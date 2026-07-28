import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

import { escapedLikeContains, safeHttpsUrl } from '../../src/lib/role-workspaces.ts';

let PGlite;
try {
  ({ PGlite } = await import('@electric-sql/pglite'));
} catch {
  // Schema tests stay optional when development dependencies are omitted.
}

const here = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(here, '..', '..');

async function migratedDatabase() {
  const database = new PGlite();
  for (const migration of [
    '001_render_postgres.sql',
    '002_legacy_invite_provenance.sql',
    '003_production_data_parity.sql',
    '010_role_workspaces.sql',
    '011_role_workspace_hardening.sql',
  ]) {
    await database.exec(await readFile(path.join(projectRoot, 'db', 'migrations', migration), 'utf8'));
  }
  return database;
}

async function seedActors(database) {
  await database.exec(`
    INSERT INTO users (id, email, name, role, status, email_verified_at, company_name, school_name, school_id)
    VALUES
      ('company-1', 'company@example.ci', 'Akwaba Industrie', 'company', 'active', now(), 'Akwaba Industrie', NULL, NULL),
      ('school-1', 'school@example.ci', 'Institut Lagune', 'school', 'active', now(), NULL, 'Institut Lagune', NULL),
      ('graduate-1', 'graduate@example.ci', 'Aïcha Koné', 'graduate', 'active', now(), NULL, 'Institut Lagune', 'school-1');
  `);
}

test('organization publication is explicit, complete, and slug-based', { skip: !PGlite }, async () => {
  const database = await migratedDatabase();
  await seedActors(database);
  await database.exec(`
    INSERT INTO organization_profiles (
      user_id, slug, description, locations, public_publish_consent
    ) VALUES (
      'company-1',
      'akwaba-industrie',
      'Une entreprise ivoirienne qui forme de jeunes équipes et construit des services utiles pour les territoires.',
      '["Abidjan", "Bouaké"]',
      false
    );
  `);
  const privateRows = await database.query(`
    SELECT count(*)::integer AS count
    FROM organization_profiles
    WHERE public_publish_consent = true
      AND published_at IS NOT NULL
      AND char_length(btrim(description)) >= 80
      AND jsonb_array_length(locations) > 0
  `);
  assert.deepEqual(privateRows.rows, [{ count: 0 }]);

  await database.exec(`
    UPDATE organization_profiles
    SET public_publish_consent = true, published_at = now()
    WHERE user_id = 'company-1';
  `);
  const publicRows = await database.query(`
    SELECT slug, published_at IS NOT NULL AS published
    FROM organization_profiles
    WHERE public_publish_consent = true
  `);
  assert.deepEqual(publicRows.rows, [{ slug: 'akwaba-industrie', published: true }]);

  await assert.rejects(database.exec(`
    INSERT INTO organization_profiles (
      user_id, slug, description, locations, public_publish_consent, published_at
    ) VALUES (
      'school-1', 'akwaba-industrie',
      'Un établissement ivoirien qui accompagne ses diplômés avec des passerelles concrètes vers le premier emploi.',
      '["Cocody"]', true, now()
    );
  `));
  await database.close();
});

test('event registrations are durable and cannot be duplicated', { skip: !PGlite }, async () => {
  const database = await migratedDatabase();
  await seedActors(database);
  await database.exec(`
    INSERT INTO career_events (
      id, organizer_id, title, description, event_format, location,
      starts_at, ends_at, registration_deadline, capacity, audience,
      status, published_at
    ) VALUES (
      'event-1', 'company-1', 'Rencontre métiers',
      'Une rencontre avec des équipes ivoiriennes pour comprendre les métiers, les missions et le processus de recrutement.',
      'onsite', 'Plateau, Abidjan', now() + interval '7 days',
      now() + interval '7 days 2 hours', now() + interval '6 days',
      1, 'all_graduates', 'published', now()
    );
    INSERT INTO career_event_registrations (event_id, graduate_id)
    VALUES ('event-1', 'graduate-1');
  `);
  await assert.rejects(database.exec(`
    INSERT INTO career_event_registrations (event_id, graduate_id)
    VALUES ('event-1', 'graduate-1');
  `));
  const registration = await database.query(`
    SELECT status, reminder_state FROM career_event_registrations
    WHERE event_id = 'event-1' AND graduate_id = 'graduate-1'
  `);
  assert.deepEqual(registration.rows, [{ status: 'registered', reminder_state: 'not_scheduled' }]);
  await database.close();
});

test('talent visibility requires recorded consent and stores no direct contact details', { skip: !PGlite }, async () => {
  const database = await migratedDatabase();
  await seedActors(database);
  await assert.rejects(database.exec(`
    INSERT INTO talent_profiles (user_id, visibility_consent, headline)
    VALUES ('graduate-1', true, 'Analyste data junior');
  `));
  await database.exec(`
    INSERT INTO talent_profiles (
      user_id, visibility_consent, headline, preferred_roles, consented_at
    ) VALUES (
      'graduate-1', true, 'Analyste data junior pour les services publics',
      '["Analyste data"]', now()
    );
  `);
  const columns = await database.query(`
    SELECT column_name FROM information_schema.columns
    WHERE table_name = 'talent_profiles'
  `);
  const names = new Set(columns.rows.map((row) => row.column_name));
  assert.equal(names.has('email'), false);
  assert.equal(names.has('phone'), false);
  assert.equal(names.has('resume'), false);

  const visible = await database.query(`
    SELECT user_id FROM talent_profiles
    WHERE visibility_consent = true
      AND consented_at IS NOT NULL
      AND withdrawn_at IS NULL
  `);
  assert.deepEqual(visible.rows, [{ user_id: 'graduate-1' }]);
  await database.close();
});

test('company direct messaging checks graduate talent consent', async () => {
  const source = await readFile(path.join(projectRoot, 'src', 'app', 'api', 'conversations', 'route.ts'), 'utf8');
  assert.match(source, /talent\.visibility_consent = true/);
  assert.match(source, /recipient\.talent_visible/);
  assert.match(source, /FROM talent_profiles[\s\S]*FOR SHARE/);
  assert.match(source, /conversation_reused/);
  assert.match(source, /INSERT INTO messages/);
  assert.match(source, /conversation-create-account/);
  assert.doesNotMatch(source, /actor\.role === 'company' && recipient\.role === 'graduate'\);/);
});

test('event online links are authorized per row and lifecycle writes are bounded', async () => {
  const [listSource, updateSource, attendanceSource] = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'events', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'events', '[id]', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'events', '[id]', 'registrations', 'route.ts'), 'utf8'),
  ]);
  assert.match(listSource, /serializeCareerEvent\(row, row\.organizer_id === actor\.uid\)/);
  assert.doesNotMatch(listSource, /const isOrganizer = actor\.role/);
  assert.match(updateSource, /event_not_finished/);
  assert.match(updateSource, /career-event-update-account/);
  assert.match(attendanceSource, /attendance_not_open/);
  assert.match(attendanceSource, /FOR UPDATE/);
  assert.match(attendanceSource, /LIMIT \$2 OFFSET \$3/);
});

test('organization media remains private until profile publication and is quota bounded', async () => {
  const [uploadSource, profileSource, mediaSource] = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'organization-profile', 'media', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'organization-profile', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'media', '[id]', 'route.ts'), 'utf8'),
  ]);
  assert.match(uploadSource, /MAX_ORGANIZATION_MEDIA_BYTES/);
  assert.match(uploadSource, /MAX_ORGANIZATION_MEDIA_ASSETS/);
  assert.match(uploadSource, /content_length_required/);
  assert.match(uploadSource, /\$8, false,/);
  assert.match(uploadSource, /organization_media\.reuse/);
  assert.match(profileSource, /SET is_public = \$3/);
  assert.match(profileSource, /DELETE FROM media_assets/);
  assert.match(mediaSource, /uploaded_by = \$2/);
  assert.match(mediaSource, /private, no-store/);
  assert.match(mediaSource, /must-revalidate/);
});

test('organization verification has an audited review queue and revokes changed identity', { skip: !PGlite }, async () => {
  const database = await migratedDatabase();
  await seedActors(database);
  await database.exec(`
    INSERT INTO organization_profiles (
      user_id, slug, description, website_url, locations, contact_email,
      public_publish_consent, published_at, verification_status,
      verification_requested_at
    ) VALUES (
      'company-1', 'akwaba-industrie',
      'Une entreprise ivoirienne qui forme de jeunes équipes et construit des services utiles pour les territoires.',
      'https://example.ci', '["Abidjan"]', 'contact@example.ci',
      true, now(), 'pending', now()
    );
    UPDATE organization_profiles
    SET verification_status = 'verified',
      verification_reviewed_at = now(),
      verification_reviewed_by = 'company-1',
      verification_note = 'Site et identité contrôlés.',
      verified_at = now()
    WHERE user_id = 'company-1' AND verification_status = 'pending';
  `);
  const result = await database.query(`
    SELECT verification_status, verified_at IS NOT NULL AS verified,
      verification_reviewed_at IS NOT NULL AS reviewed
    FROM organization_profiles
    WHERE user_id = 'company-1'
  `);
  assert.deepEqual(result.rows, [{ verification_status: 'verified', verified: true, reviewed: true }]);
  await database.close();

  const [profileSource, emailSource, reviewSource] = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'me', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'auth', 'verify', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'admin', 'organization-verifications', '[id]', 'route.ts'), 'utf8'),
  ]);
  assert.match(profileSource, /organization_verification\.revoked/);
  assert.match(profileSource, /organization_name_changed/);
  assert.match(emailSource, /account_email_changed/);
  assert.match(reviewSource, /organization_verification\.\$\{input\.decision\}/);
  assert.match(reviewSource, /verification_reviewed_by/);
});

test('school reports expose aggregates instead of named graduate outcomes', async () => {
  const source = await readFile(path.join(projectRoot, 'src', 'app', 'api', 'reports', 'route.ts'), 'utf8');
  assert.match(source, /Données agrégées/);
  assert.match(source, /rows: statuses\.map/);
  assert.doesNotMatch(source, /SELECT graduate\.name, graduate\.status/);
  assert.match(source, /workspace-report-read-account/);
});

test('new public links require HTTPS and LIKE filters treat wildcard characters literally', { skip: !PGlite }, async () => {
  assert.equal(safeHttpsUrl('http://example.ci/profile'), null);
  assert.equal(safeHttpsUrl('https://user:secret@example.ci/profile'), null);
  assert.equal(safeHttpsUrl('https://example.ci/profile'), 'https://example.ci/profile');

  const database = new PGlite();
  const pattern = escapedLikeContains('%_');
  const result = await database.query(`
    SELECT
      'preuve %_ locale' ILIKE $1 ESCAPE E'\\\\' AS literal_match,
      'preuve ab locale' ILIKE $1 ESCAPE E'\\\\' AS wildcard_match
  `, [pattern]);
  assert.deepEqual(result.rows, [{ literal_match: true, wildcard_match: false }]);
  await database.close();
});

test('role workspace API sources enforce role-specific authentication gates', async () => {
  const sources = await Promise.all([
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'organization-profile', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'talent', 'me', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'talent', 'route.ts'), 'utf8'),
    readFile(path.join(projectRoot, 'src', 'app', 'api', 'reports', 'route.ts'), 'utf8'),
  ]);
  assert.match(sources[0], /requireUser\(organizationRoles\)/);
  assert.match(sources[0], /new Set<'company' \| 'school'>/);
  assert.match(sources[1], /requireUser\(graduateRoles\)/);
  assert.match(sources[1], /new Set<'graduate'>/);
  assert.match(sources[2], /requireUser\(companyRoles\)/);
  assert.match(sources[2], /new Set<'company'>/);
  assert.match(sources[3], /requireUser\(reportingRoles\)/);
  assert.match(sources[3], /new Set<'company' \| 'school'>/);
});
