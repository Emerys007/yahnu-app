import { createHash, randomUUID } from 'node:crypto';

import {
  BLOG_IMAGE_CONTENT_TYPES,
  MAX_BLOG_IMAGE_BYTES,
  cleanOriginalFilename,
  detectBlogImageContentType,
  extensionForBlogImage,
} from '@/lib/blog-media';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

const organizationRoles = new Set<'company' | 'school'>(['company', 'school']);
const MAX_MULTIPART_BYTES = MAX_BLOG_IMAGE_BYTES + 512 * 1024;
const MAX_ORGANIZATION_MEDIA_BYTES = 25 * 1024 * 1024;
const MAX_ORGANIZATION_MEDIA_ASSETS = 8;

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(organizationRoles);
    await enforceRateLimit(request, 'organization-media-upload', 12, 60 * 60, actor.uid);
    await enforceRateLimitSubject('organization-media-upload-account', 12, 60 * 60, actor.uid);
    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('multipart/form-data;')) {
      throw new ApiError(415, 'unsupported_media_type', 'Envoyez l’image au format multipart/form-data.');
    }
    const declaredLengthHeader = request.headers.get('content-length');
    if (!declaredLengthHeader || !/^\d+$/.test(declaredLengthHeader)) {
      throw new ApiError(411, 'content_length_required', 'La taille du téléversement doit être indiquée.');
    }
    const declaredLength = Number(declaredLengthHeader);
    if (!Number.isSafeInteger(declaredLength) || declaredLength <= 0 || declaredLength > MAX_MULTIPART_BYTES) {
      throw new ApiError(413, 'image_too_large', 'L’image ne doit pas dépasser 5 Mo.');
    }
    const formData = await request.formData().catch(() => {
      throw new ApiError(400, 'invalid_multipart_body', 'Le fichier envoyé est illisible.');
    });
    const file = formData.get('file');
    if (!(file instanceof File) || file.size <= 0) throw new ApiError(422, 'file_required', 'Sélectionnez une image.');
    if (file.size > MAX_BLOG_IMAGE_BYTES) throw new ApiError(413, 'image_too_large', 'L’image ne doit pas dépasser 5 Mo.');
    if (!BLOG_IMAGE_CONTENT_TYPES.includes(file.type.toLowerCase() as (typeof BLOG_IMAGE_CONTENT_TYPES)[number])) {
      throw new ApiError(415, 'unsupported_image_type', 'Formats acceptés : JPEG, PNG, WebP et GIF.');
    }
    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedContentType = detectBlogImageContentType(bytes);
    if (!detectedContentType || detectedContentType !== file.type.toLowerCase()) {
      throw new ApiError(415, 'invalid_image_signature', 'Le contenu du fichier ne correspond pas à une image acceptée.');
    }
    const id = randomUUID();
    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const originalFilename = cleanOriginalFilename(file.name);
    const storagePath = `organizationImages/${actor.uid}/${id}.${extensionForBlogImage(detectedContentType)}`;

    const stored = await transaction(async (client) => {
      await client.query(
        `SELECT pg_advisory_xact_lock(hashtext($1))`,
        [`organization-media:${actor.uid}`],
      );
      const duplicate = await client.query<{ id: string; original_filename: string }>(`
        SELECT id, original_filename
        FROM media_assets
        WHERE uploaded_by = $1
          AND sha256 = $2
          AND byte_size = $3
          AND content_type = $4
          AND metadata->>'workspace' = 'organization_profile'
        ORDER BY created_at ASC
        LIMIT 1
      `, [actor.uid, sha256, bytes.length, detectedContentType]);
      if (duplicate.rows[0]) {
        await writeAuditLog(client, request, actor.uid, 'organization_media.reuse', 'media_asset', duplicate.rows[0].id, {
          byteSize: bytes.length,
          contentType: detectedContentType,
        });
        return {
          id: duplicate.rows[0].id,
          originalFilename: duplicate.rows[0].original_filename,
          reused: true,
        };
      }
      const usage = await client.query<{ asset_count: number | string; total_bytes: number | string }>(`
        SELECT count(*)::integer AS asset_count, COALESCE(sum(byte_size), 0)::bigint AS total_bytes
        FROM media_assets
        WHERE uploaded_by = $1
          AND metadata->>'workspace' = 'organization_profile'
      `, [actor.uid]);
      const assetCount = Number(usage.rows[0]?.asset_count || 0);
      const totalBytes = Number(usage.rows[0]?.total_bytes || 0);
      if (
        assetCount >= MAX_ORGANIZATION_MEDIA_ASSETS
        || totalBytes + bytes.length > MAX_ORGANIZATION_MEDIA_BYTES
      ) {
        throw new ApiError(
          409,
          'organization_media_quota',
          'Votre espace image est plein. Enregistrez le profil pour nettoyer les anciens brouillons, puis réessayez.',
        );
      }
      await client.query(`
        INSERT INTO media_assets (
          id, storage_path, original_filename, content_type, byte_size, sha256,
          content, uploaded_by, is_public, source_provider, source_bucket, source_path,
          metadata, legacy_url_hashes
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, false,
          'render_upload', 'postgres', $2, $9::jsonb, '[]'::jsonb
        )
      `, [
        id,
        storagePath,
        originalFilename,
        detectedContentType,
        bytes.length,
        sha256,
        bytes,
        actor.uid,
        JSON.stringify({ workspace: 'organization_profile' }),
      ]);
      await writeAuditLog(client, request, actor.uid, 'organization_media.upload', 'media_asset', id, {
        byteSize: bytes.length,
        contentType: detectedContentType,
      });
      return { id, originalFilename, reused: false };
    });

    return jsonOk({
      media: {
        id: stored.id,
        url: `/api/media/${encodeURIComponent(stored.id)}`,
        originalFilename: stored.originalFilename,
      },
      reused: stored.reused,
    }, { status: stored.reused ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
