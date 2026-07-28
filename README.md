# Yahnu

Yahnu is a Next.js application for graduates, schools, employers, content teams, and support staff. Production runs on a Render Node service with Render PostgreSQL, Yahnu-owned authentication, Resend email, and Google OpenID Connect. Firebase is retained only as a frozen, time-bounded rollback source; it is not the live application runtime.

## Current production

- Live application: `https://yahnu.org`
- Runtime: Render service `yahnu-web` in Frankfurt
- Database: Render PostgreSQL `yahnu-postgres-live`
- Release source: GitHub `main`, promoted manually after validation
- Firebase rollback tag: `firebase-live-main-2026-07-13`
- Frozen Firebase project: `yahnu-50c61`
- Archived App Hosting backend: `yahnu-app` in `europe-west4`
- Production hostname: `yahnu.org`, with `www.yahnu.org` redirected to it
- Render region: Frankfurt
- Budgeted Render footprint: **about $13.30/month** (Starter web service $7, Basic-256 MB PostgreSQL $6, and 1 GB database storage at $0.30/GB). This stays below the owner's $25/month ceiling; no automatic storage scaling is enabled.

`render.yaml` reflects the completed production cutover with Maintenance Mode disabled, automatic deploys disabled, storage autoscaling capped, and Node `22.23.1` pinned. Use Render's dashboard to enable maintenance deliberately before a future high-risk migration.

## Local setup and verification

Use exactly Node `22.23.1` (`.nvmrc` and `package.json` are pinned), PostgreSQL 17, and npm.

```powershell
node --version
npm ci
Copy-Item .env.example .env.local
docker compose up -d
npm run db:migrate
npm run admin:create -- --email admin@example.com --name "Local Admin" --password "ChangeMe12345!"
npm run dev
```

Open `http://localhost:3000`. To verify a release candidate:

```powershell
npm run typecheck
npm run lint
npm run lint:i18n
npm run test:migration
npm run test:db-config
npm run test:image-processing
npm run test:password-recovery
npm run test:auth-navigation
npm run test:market-opportunity-security
npm run test:pilot-inquiries
npm run test:job-discovery
npm run test:skills-checks
npm run test:interview-prep
npm run test:role-workspaces
npm run test:http-security
npm run build
npm audit --omit=dev --audit-level=high
git diff --check
```

The build script also prepares Next.js standalone output. Run `npm start` to test that exact production artifact at `http://localhost:3000`; like Render, that production-mode artifact requires working email configuration. During `npm run dev`, you may test verification/reset links without Resend by explicitly setting `YAHNU_ALLOW_LOCAL_EMAIL_DEBUG=true`. The escape hatch works only with `NODE_ENV=development` and a loopback `APP_URL`, and it must remain false or unset in every hosted environment.

Important environment variables:

- `DATABASE_URL`: direct PostgreSQL URL for migrations, cutover commands, and local development. Every database URL must be a complete `postgres://`/`postgresql://` URL with a host, database, username, and password; query strings and fragments are rejected so node-postgres cannot override TLS options. The standard PostgreSQL port is normalized to `5432` when a provider omits it, preventing an inherited `PGPORT` from redirecting the connection.
- `DATABASE_POOL_URL`: optional pooled runtime URL. A non-empty value takes precedence over `DATABASE_URL` at runtime; an invalid pooled URL fails closed rather than falling back to the direct URL. Cutover commands always use `DATABASE_URL` directly. Keep both URL-query-free.
- `PGSSLMODE`: omit it (or set `disable`) for the local Docker database. Runtime accepts only `disable`, `require`, `verify-ca`, and `verify-full`; every enabled mode verifies the server certificate and identity. In this app, `require` is treated as verified TLS rather than libpq's relaxed compatibility mode. `no-verify`, `prefer`, and URL-level `sslmode` configuration are rejected.
- `DATABASE_SSL_CA` or `DATABASE_SSL_CA_FILE`: optional private-CA PEM source for verified TLS. Configure exactly one; `PGSSLROOTCERT` is accepted as a file-path compatibility alias. When no custom CA is set, Node's platform trust store is used. For an external Render database URL, set `PGSSLMODE=verify-full` only after validating the certificate chain; retain the private-network URL's non-TLS setting unless that endpoint is independently verified to support TLS.
- `DATABASE_SSL_SERVERNAME`: optional, owner-controlled expected certificate identity for a TLS endpoint whose URL host and certificate identity intentionally differ. It is accepted only with a configured private CA/leaf pin and delegates to Node's standard identity verifier, so it still requires successful certificate and hostname verification. Node-postgres still sends SNI for the database URL host, so use this only where that endpoint returns the intended certificate for the URL-host SNI value. Never replace this with `rejectUnauthorized: false` or an accepting `checkServerIdentity` bypass.
- `DATABASE_SSL_CERT_SHA256`: optional owner-controlled SHA-256 fingerprint pin for the exact leaf certificate (hex or colon-separated hex). It requires the same private CA/leaf-pin source and is checked only after Node validates the certificate chain and expected identity. Use it for a self-signed internal endpoint only when the certificate rotation process is documented; leave it unset for the normal public-CA external URL.
- `DATABASE_POOL_MAX`: runtime connection limit, an integer from 1 through 100 (default 10)
- `AUTH_SECRET`: at least 32 random characters; the same value must be available to import and runtime
- `APP_URL`: the exact public origin, without a trailing slash
- `RESEND_API_KEY` and `EMAIL_FROM`: mandatory production email configuration
- `YAHNU_ALLOW_LOCAL_EMAIL_DEBUG`: optional explicit local-development escape hatch. It is ignored unless `NODE_ENV=development` and `APP_URL` points to `localhost`, `127.0.0.1`, or `::1`; never enable it on Render or staging.
- `YAHNU_SKILLS_BANK_PATH`: absolute path to the protected, versioned assessment bank. The file contains question content and answer keys, must never be committed, and is required before migrations can publish a skills-bank release.
- `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`: optional Google sign-in; callback is `${APP_URL}/api/auth/google/callback`
- `NEXT_PUBLIC_OPENCAGE_API_KEY`: optional address autocomplete
- `YAHNU_ENABLE_AI`, `GEMINI_API_KEY`, and `YAHNU_GEMINI_MODEL`: optional AI features

### Protected skills bank on Render

Create a Render Secret File named `yahnu-skills-bank.v1.json`, paste the audited bank into that secret file, and keep `YAHNU_SKILLS_BANK_PATH=/etc/secrets/yahnu-skills-bank.v1.json`. Render mounts secret files at runtime without storing their content in Git. The pre-deploy migration imports the bank transactionally and fails the deployment if the file is absent, malformed, incomplete, or conflicts with an immutable release already stored in PostgreSQL.

Never print the bank, its answer keys, or its digest inputs in logs. Use `npm run test:skills-checks` with the synthetic fixture for local and CI validation.

## Archived production cutover runbook

The remaining sections preserve the tested Firebase-to-Render migration and rollback procedure. They are not instructions to reconnect the live site to Firebase. Before any future reprovisioning, verify these three choices against the current Render pricing page:

1. Recurring Render spend remains at or below `$25/month`.
2. Frankfurt is the immutable web/database region.
3. `yahnu.org` is the application hostname and `www.yahnu.org` redirects to it.

The operator also needs working access to GitHub, Render, Firebase/Google Cloud, Firebase Authentication, Resend, Google OAuth, and GoDaddy DNS. Create a tested break-glass `super_admin` before opening production.

Migrated Firebase password hashes are intentionally not accepted by Yahnu. Linked Google users can continue with Google; every email/password user must complete forgot-password through Resend. Verified sender deliverability, user communication, and recovery support are hard launch gates.

## Data contract

The final Firestore export dynamically discovers roots and fails closed on unknown collections or subcollections. The known production roots are:

`users`, `invites`, `tickets`, `pages`, `dashboards`, `blogPosts`, `conversations`, `notifications`, `emailVerificationCodes`, `mail`, `jobs`, `applications`, and `partnerships`.

`announcements` and `knowledgeBaseArticles` are also accounted for as new/optional roots. Cutover requires zero unknown roots, zero unknown subcollections, and zero unaccounted Storage object paths.

Firebase Auth is authoritative for UID, canonical email, verification, disabled state, and linked providers. Firestore only enriches matching Auth users. Password-like fields are recursively removed, legacy email codes are invalidated, Trigger Email bodies/tokens are not retained, and strict imports roll back on skipped, invalid, orphaned, conflicting, or rejected records. Never use `--allow-partial` in production.

Firestore profile documents without a matching Auth UID or any embedded UID/email candidate are retained only in the legacy archive tables; they never become runtime accounts. A separately audited quarantine ledger can hold only the three hash-pinned, source-absent references from the final export. It cannot create a user or a foreign-key relationship, and any changed, additional, or otherwise unresolved reference fails the import and reconciliation.

## Cutover runbook

### 1. Protect source control and rehearse

1. Keep Firebase `main` at `ed982f3` and the rollback tag intact.
2. Disable Firebase App Hosting automatic rollouts before merging or moving migration code to `main`.
3. Deploy Render only from `agent/render-production-main` with manual deploys while migration is in progress.
4. Rehearse Auth, Firestore, and full-bucket Storage export/import/verification against a disposable PostgreSQL database.
5. Confirm `schema_migrations` before every rehearsal. An applied migration checksum may not be rewritten; recreate an empty rehearsal DB or add a new migration.
6. Inventory every role and dataset before scheduling downtime.

The App Hosting build record names `yahnu-50c61.firebasestorage.app`, while old application source names `yahnu-50c61.appspot.com`. Confirm the actual bucket rather than guessing:

```powershell
gcloud auth login
gcloud storage buckets list --project yahnu-50c61
$bucket = '<exact bucket returned by Google Cloud>'
```

Always export the full bucket without `--prefix`. The tools cap a single object at 100 MB and the bucket at 10 GB. The provisioned database disk is 1 GB, so account for existing tables, bytea overhead, indexes, and transaction/WAL space. As a conservative gate, do not proceed unless current database size plus twice the manifest payload remains below 80% of provisioned disk; otherwise increase the approved plan/disk or redesign the import before downtime.

### 2. Provision Render in maintenance

Only after the approval gates, create the Blueprint from `render.yaml` and the release branch. Confirm:

- web and database are in the approved region;
- Maintenance Mode is already enabled and the public `onrender.com` URL returns `503`;
- automatic deployment is off;
- Node is exactly `22.23.1`;
- migrations complete against the empty database;
- secrets are populated without placing them in Git or chat;
- database external access is closed except for a temporary operator `/32` rule during import.

Set up Resend and Google OAuth in staging first. Do not send production reset links until the final hostname has valid TLS and `APP_URL`/OAuth callback match it exactly.

### 3. Archive rollback state

Create an encrypted, access-controlled rollback bundle containing:

- active Firestore and Storage rules;
- active App Hosting release and automatic-rollout configuration;
- enabled Firebase Authentication providers;
- Trigger Email extension and every privileged writer configuration;
- encrypted Storage token metadata and the tested command needed to restore it only during a pre-write rollback;
- GoDaddy DNS records for `app`, root, and `www`;
- the release commit/tag and all environment settings needed to restore Firebase.

Test the restoration procedure in a non-production project. Keep Firebase; do not delete it after launch.

### 4. Freeze Firebase

1. Announce the maintenance window and stop new sessions.
2. Drain or explicitly disposition pending `mail` documents, then disable Trigger Email.
3. Disable Firebase sign-in providers and every Admin SDK, scheduled, extension, or background writer.
4. Disable App Hosting automatic rollouts.
5. Deploy the deny-all Firestore and Storage rules:

```powershell
firebase deploy --project yahnu-50c61 --only firestore:rules --config cutover/firebase/firebase.freeze.json
firebase deploy --project yahnu-50c61 --only storage --config cutover/firebase/firebase.freeze.json
```

6. Prove client reads and writes fail and privileged write metrics remain at zero. Also test representative Firebase download-token URLs anonymously: bearer tokens can remain usable independently of the deny-all rules.
7. After the final Storage export, revoke or rotate download tokens for every private object and re-test them anonymously. Keep the encrypted token metadata only for an approved pre-write rollback; PostgreSQL must retain hashes or redacted URLs, never plaintext download tokens.

Export and verification use privileged OAuth and remain available. The live application may show only its static shell during the freeze; data access is intentionally closed.

### 5. Create final encrypted exports

Use a new encrypted directory outside this repository, cloud-sync folders, and chat attachments. Firebase Auth JSON can contain password hashes.

```powershell
firebase auth:export C:\secure\yahnu-auth.json --project yahnu-50c61 --format=json

$env:GOOGLE_ACCESS_TOKEN = gcloud auth print-access-token
npm run firebase:export:firestore -- --project yahnu-50c61 --database '(default)' --output C:\secure\yahnu-firestore.json
npm run firebase:export:storage -- --bucket $bucket --output-dir C:\secure\yahnu-storage

Get-FileHash C:\secure\yahnu-auth.json -Algorithm SHA256
Get-FileHash C:\secure\yahnu-firestore.json -Algorithm SHA256
Get-FileHash C:\secure\yahnu-storage\manifest.json -Algorithm SHA256
```

The Firestore export must report every expected collection and zero unknown subcollections. The Storage manifest must match the observed object count and byte total. Clear `GOOGLE_ACCESS_TOKEN` immediately after export.

### 6. Import and reconcile in Render PostgreSQL

Run from an access-controlled operator machine using the exact Render `DATABASE_URL` and `AUTH_SECRET`, with a temporary `/32` database allowlist. Remove that rule after success, failure, or abort. Before the first committed import, create and checksum a logical backup of the migration-only Render database. Each import file is transactional, but the Auth -> Firestore -> Storage sequence is not one cross-source transaction. If any committed import or either verifier fails, keep Maintenance Mode on, restore that baseline (or recreate the empty migrated database), and rerun the entire sequence from the same immutable exports. Do not resume at a later phase or use `--allow-partial` to work around a failure.

The individual dry-runs below validate each source and schema, but they do not compose into a media-linkage rehearsal because each rolls back before the next command. The required full rehearsal in step 1 must use committed Auth, Firestore, and Storage imports on a disposable database, followed by both verifiers. For every Storage dry-run and real import, pass the exact provisioned database disk size in bytes. The opt-in preflight rejects an import when current database size plus twice the manifest payload would exceed 80% of that capacity, preserving bytea and WAL headroom.

Before opening a database connection or freezing Firebase, inspect the Auth export for account types that the Render runtime can actually preserve. This command exits non-zero when it finds phone, anonymous, MFA, multi-tenant, malformed Google, or other unsupported federated accounts; resolve every reported account before continuing.

```powershell
npm run firebase:import -- --file C:\secure\yahnu-auth.json --source auth --preflight
```

```powershell
npm run db:migrate
$databaseCapacityBytes = 1GB

npm run firebase:import -- --file C:\secure\yahnu-auth.json --source auth --dry-run
npm run firebase:import -- --file C:\secure\yahnu-firestore.json --source firestore --dry-run
npm run firebase:import:storage -- --manifest C:\secure\yahnu-storage\manifest.json --database-capacity-bytes $databaseCapacityBytes --dry-run

npm run firebase:import -- --file C:\secure\yahnu-auth.json --source auth
npm run firebase:import -- --file C:\secure\yahnu-firestore.json --source firestore
npm run firebase:import:storage -- --manifest C:\secure\yahnu-storage\manifest.json --database-capacity-bytes $databaseCapacityBytes --rewrite-output C:\secure\yahnu-media-url-rewrites.json

npm run firebase:verify -- --auth C:\secure\yahnu-auth.json --firestore C:\secure\yahnu-firestore.json
npm run firebase:verify:storage -- --manifest C:\secure\yahnu-storage\manifest.json
```

Every command must exit zero. Verification must prove exact IDs, normalized operational fields, provider identities, audiences, source hashes, object generations/hashes, public/private media exposure, URL rewrites, and reference linkage. Any mismatch is a no-go.

### 7. Go/no-go validation while Render stays closed

Create and download a final Render logical backup, checksum it, and verify it includes the post-Storage state. Then test all of the following against the Render service while Maintenance Mode remains enabled externally:

- graduate, company, school, admin, super-admin, content, moderator, and support permissions;
- Google sign-in and forced password reset through real Resend delivery;
- registration, email verification, reset, invitation, logout, and break-glass access;
- profiles, schools, graduates, approvals, pages, dashboard layouts, and tickets;
- public blog list/article, editor CRUD, migrated images, and new uploads;
- private media IDs are not anonymously retrievable;
- conversations, older-history pagination, unread counts, broadcasts, ticket handoff, and notifications;
- jobs, applications, partnerships, announcements, and published knowledge-base content;
- support user search/direct message, system health, and audit logs;
- `/api/health`, database latency, error logs, backup restore, TLS, and the Render release commit.

Do not proceed with unresolved warnings, a skipped migration suite, unverified email delivery, an unknown bucket, unknown collections/objects, or insufficient disk/WAL headroom.

### 8. Hostname and release

1. Add `yahnu.org` and `www.yahnu.org` as Render custom domains and use the exact DNS targets Render supplies.
2. Replace only the root and `www` web records at GoDaddy; preserve all email-related MX, SPF, DKIM, and DMARC records.
3. Wait for valid TLS, then set `APP_URL=https://yahnu.org` and the Google callback to `https://yahnu.org/api/auth/google/callback`.
4. Re-run login, reset-email, callback, image, and health smoke tests.
5. Disable Render Maintenance Mode and watch errors, authentication, email delivery, database capacity, and support traffic closely.
6. Keep Firebase frozen for the agreed rollback window. Keep Render deploys manual until the migration is formally closed.

### 9. Cleanup

- Remove and verify removal of the temporary database `/32` allowlist on every exit path.
- Revoke temporary Google/Firebase credentials and clear shell history containing secrets.
- Securely dispose of Auth, Firestore, Storage object, manifest, and rewrite artifacts according to the retention policy. `Remove-Item` alone is not guaranteed secure erasure on SSDs or synced/encrypted volumes.
- Rotate any credential that appeared in logs or operator history.

## Rollback

Before Render accepts writes: enable Render Maintenance Mode first, restore the archived Firebase rules, providers, writers, App Hosting release, and only the application DNS record; verify Firebase end to end, then reopen it.

After Render accepts writes: a simple DNS rollback can lose production data. Freeze Render first, reverse-reconcile new Render writes into Firebase or obtain explicit loss acceptance, and only then restore Firebase. Never allow both systems to accept writes.

## Security model

- Browser code never receives database credentials or privileged Firebase credentials.
- Every mutation is authorized by a server route; dashboard visibility is not an authorization boundary.
- Sessions use opaque hashed tokens in `HttpOnly`, `Secure`, `SameSite=Lax` cookies.
- Passwords use memory-hard scrypt; reset, verification, and invitation tokens are hashed and single-use.
- State-changing routes enforce same-origin checks, body limits, strict schemas, rate limits, and audit logging.
- `/api/health` reports only the non-secret `emailReady` boolean and returns `503` until both PostgreSQL and account-recovery email are ready.
- Public media is image-signature checked and immutable; migrated private objects remain non-public and require explicit authorization paths.
- Production responses set restrictive security headers in `next.config.js`.
