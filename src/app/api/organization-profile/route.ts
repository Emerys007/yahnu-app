import { z } from 'zod';

import { organizationSizes, safeHttpsUrl } from '@/lib/role-workspaces';
import {
  serializeOrganizationProfile,
  type OrganizationProfileRow,
} from '@/lib/server/role-workspaces';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const organizationRoles = new Set<'company' | 'school'>(['company', 'school']);
const listOf = (limit: number, itemLimit = 120) => z.array(z.string().trim().min(1).max(itemLimit)).max(limit);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();
const optionalHttpUrl = z.string().trim().max(2_048).nullable().optional().superRefine((value, context) => {
  if (value && !safeHttpsUrl(value)) context.addIssue({ code: 'custom', message: 'Utilisez une URL HTTPS valide.' });
});

const profileSchema = z.object({
  slug: z.string().trim().toLowerCase().min(3).max(80).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  description: z.string().trim().max(6_000),
  websiteUrl: optionalHttpUrl,
  locations: listOf(12, 160),
  organizationSize: z.enum(organizationSizes).nullable().optional(),
  organizationType: optionalText(120),
  programs: listOf(30, 180),
  benefits: listOf(30, 180),
  culture: listOf(30, 180),
  logoAssetId: optionalText(200),
  coverAssetId: optionalText(200),
  contactName: optionalText(160),
  contactEmail: z.string().trim().email().max(320).nullable().optional(),
  contactPhone: optionalText(40),
  publicPublishConsent: z.boolean(),
  requestVerification: z.boolean().default(false),
}).strict();

const selectColumns = `
  slug, description, website_url, locations, organization_size, organization_type,
  programs, benefits, culture, logo_asset_id, cover_asset_id,
  contact_name, contact_email, contact_phone, public_publish_consent,
  published_at, verification_status, verification_requested_at,
  verification_note, verified_at, updated_at
`;

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 72) || 'organisation-yahnu';
}

export async function GET() {
  try {
    const actor = await requireUser(organizationRoles);
    const result = await query<OrganizationProfileRow>(
      `SELECT ${selectColumns} FROM organization_profiles WHERE user_id = $1`,
      [actor.uid],
    );
    const organizationName = actor.role === 'company'
      ? actor.companyName || actor.name
      : actor.schoolName || actor.name;
    const safeOrganizationName = organizationName || 'Organisation Yahnu';
    return jsonOk({
      organizationName: safeOrganizationName,
      role: actor.role,
      profile: result.rows[0] ? serializeOrganizationProfile(result.rows[0]) : null,
      suggestedSlug: slugify(safeOrganizationName),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(organizationRoles);
    await enforceRateLimit(request, 'organization-profile-update', 30, 60 * 60, actor.uid);
    await enforceRateLimitSubject('organization-profile-update-account', 30, 60 * 60, actor.uid);
    const input = profileSchema.parse(await readJson(request, 128 * 1024));

    if (input.publicPublishConsent) {
      if (input.description.length < 80 || input.locations.length === 0) {
        throw new ApiError(
          422,
          'public_profile_incomplete',
          'Ajoutez une présentation d’au moins 80 caractères et un lieu avant de publier.',
        );
      }
    }
    if (input.requestVerification && (input.description.length < 120 || !input.websiteUrl || !input.contactEmail)) {
      throw new ApiError(
        422,
        'verification_profile_incomplete',
        'Ajoutez une présentation détaillée, un site web et un e-mail de contact avant de demander la vérification.',
      );
    }

    const saved = await transaction(async (client) => {
      const currentProfileResult = await client.query<{
        website_url: string | null;
        contact_email: string | null;
        verification_status: OrganizationProfileRow['verification_status'];
      }>(`
        SELECT website_url, contact_email, verification_status
        FROM organization_profiles
        WHERE user_id = $1
        FOR UPDATE
      `, [actor.uid]);
      const currentProfile = currentProfileResult.rows[0];
      const normalizedWebsiteUrl = input.websiteUrl ? safeHttpsUrl(input.websiteUrl) : null;
      const normalizedContactEmail = input.contactEmail?.toLowerCase() || null;
      const verificationEvidenceChanged = currentProfile?.verification_status === 'verified'
        && (
          currentProfile.website_url !== normalizedWebsiteUrl
          || currentProfile.contact_email !== normalizedContactEmail
        );
      for (const assetId of [input.logoAssetId, input.coverAssetId].filter(Boolean)) {
        const asset = await client.query(
          `SELECT 1
           FROM media_assets
           WHERE id = $1
             AND uploaded_by = $2
             AND metadata->>'workspace' = 'organization_profile'`,
          [assetId, actor.uid],
        );
        if (!asset.rowCount) {
          throw new ApiError(422, 'invalid_organization_media', 'Une image sélectionnée n’est plus disponible.');
        }
      }

      const slugConflict = await client.query(
        `SELECT 1 FROM organization_profiles WHERE slug = $1 AND user_id <> $2`,
        [input.slug, actor.uid],
      );
      if (slugConflict.rowCount) throw new ApiError(409, 'slug_in_use', 'Cette adresse publique est déjà utilisée.');

      const result = await client.query<OrganizationProfileRow>(`
        INSERT INTO organization_profiles (
          user_id, slug, description, website_url, locations, organization_size,
          organization_type, programs, benefits, culture, logo_asset_id, cover_asset_id,
          contact_name, contact_email, contact_phone, public_publish_consent,
          published_at, verification_status, verification_requested_at,
          verification_reviewed_at, verification_reviewed_by, verification_note, verified_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb,
          $11, $12, $13, $14, $15, $16,
          CASE WHEN $16 THEN now() ELSE NULL END,
          CASE WHEN $17 THEN 'pending' ELSE 'unverified' END,
          CASE WHEN $17 THEN now() ELSE NULL END,
          NULL,
          NULL,
          NULL,
          NULL
        )
        ON CONFLICT (user_id) DO UPDATE SET
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          website_url = EXCLUDED.website_url,
          locations = EXCLUDED.locations,
          organization_size = EXCLUDED.organization_size,
          organization_type = EXCLUDED.organization_type,
          programs = EXCLUDED.programs,
          benefits = EXCLUDED.benefits,
          culture = EXCLUDED.culture,
          logo_asset_id = EXCLUDED.logo_asset_id,
          cover_asset_id = EXCLUDED.cover_asset_id,
          contact_name = EXCLUDED.contact_name,
          contact_email = EXCLUDED.contact_email,
          contact_phone = EXCLUDED.contact_phone,
          public_publish_consent = EXCLUDED.public_publish_consent,
          published_at = CASE
            WHEN EXCLUDED.public_publish_consent = false THEN NULL
            WHEN organization_profiles.published_at IS NULL THEN now()
            ELSE organization_profiles.published_at
          END,
          verification_status = CASE
            WHEN $17 THEN 'pending'
            WHEN $18 THEN 'unverified'
            ELSE organization_profiles.verification_status
          END,
          verification_requested_at = CASE
            WHEN $17 THEN now()
            ELSE organization_profiles.verification_requested_at
          END,
          verification_reviewed_at = CASE
            WHEN $17 OR $18 THEN NULL
            ELSE organization_profiles.verification_reviewed_at
          END,
          verification_reviewed_by = CASE
            WHEN $17 OR $18 THEN NULL
            ELSE organization_profiles.verification_reviewed_by
          END,
          verification_note = CASE
            WHEN $17 OR $18 THEN NULL
            ELSE organization_profiles.verification_note
          END,
          verified_at = CASE
            WHEN $17 OR $18 THEN NULL
            ELSE organization_profiles.verified_at
          END
        RETURNING ${selectColumns}
      `, [
        actor.uid,
        input.slug,
        input.description,
        normalizedWebsiteUrl,
        JSON.stringify(input.locations),
        input.organizationSize || null,
        input.organizationType || null,
        JSON.stringify(input.programs),
        JSON.stringify(input.benefits),
        JSON.stringify(input.culture),
        input.logoAssetId || null,
        input.coverAssetId || null,
        input.contactName || null,
        normalizedContactEmail,
        input.contactPhone || null,
        input.publicPublishConsent,
        input.requestVerification,
        verificationEvidenceChanged,
      ]);
      const selectedAssetIds = [...new Set(
        [input.logoAssetId, input.coverAssetId].filter((assetId): assetId is string => Boolean(assetId)),
      )];
      await client.query(`
        UPDATE media_assets
        SET is_public = $3
        WHERE uploaded_by = $2
          AND id = ANY($1::text[])
          AND metadata->>'workspace' = 'organization_profile'
      `, [selectedAssetIds, actor.uid, input.publicPublishConsent]);
      const cleanup = await client.query(`
        DELETE FROM media_assets
        WHERE uploaded_by = $2
          AND NOT (id = ANY($1::text[]))
          AND metadata->>'workspace' = 'organization_profile'
      `, [selectedAssetIds, actor.uid]);
      await writeAuditLog(client, request, actor.uid, 'organization_profile.update', 'organization_profile', actor.uid, {
        published: input.publicPublishConsent,
        verificationRequested: input.requestVerification,
        verificationEvidenceChanged,
        removedDraftAssets: cleanup.rowCount || 0,
      });
      return result.rows[0];
    });

    return jsonOk({ profile: serializeOrganizationProfile(saved) });
  } catch (error) {
    return handleApiError(error);
  }
}
