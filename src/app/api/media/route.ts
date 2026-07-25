import { createHash, randomUUID } from 'node:crypto';

import type { Role } from '@/lib/auth-types';
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
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

const MAX_MULTIPART_BYTES = MAX_BLOG_IMAGE_BYTES + 512 * 1024;
const blogEditorRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);

type MediaSummaryRow = {
  id: string;
  storage_path: string;
  original_filename: string;
  content_type: string;
  byte_size: string | number;
  sha256: string;
  created_at: Date | string;
};

function serializeMedia(row: MediaSummaryRow) {
  return {
    id: row.id,
    url: `/api/media/${encodeURIComponent(row.id)}`,
    storagePath: row.storage_path,
    originalFilename: row.original_filename,
    contentType: row.content_type,
    byteSize: Number(row.byte_size),
    sha256: row.sha256,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(blogEditorRoles);
    await enforceRateLimit(request, 'blog-media-upload', 40, 60 * 60, actor.uid);

    const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
    if (!contentType.startsWith('multipart/form-data;')) {
      throw new ApiError(415, 'unsupported_media_type', 'Envoyez l’image au format multipart/form-data.');
    }

    const declaredLength = Number(request.headers.get('content-length') ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_MULTIPART_BYTES) {
      throw new ApiError(413, 'image_too_large', 'L’image ne doit pas dépasser 5 Mo.');
    }

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      throw new ApiError(400, 'invalid_multipart_body', 'Le fichier envoyé est illisible.');
    }
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new ApiError(422, 'file_required', 'Sélectionnez une image à téléverser.');
    }
    if (file.size <= 0) throw new ApiError(422, 'empty_file', 'Le fichier sélectionné est vide.');
    if (file.size > MAX_BLOG_IMAGE_BYTES) {
      throw new ApiError(413, 'image_too_large', 'L’image ne doit pas dépasser 5 Mo.');
    }
    if (!BLOG_IMAGE_CONTENT_TYPES.includes(file.type.toLowerCase() as (typeof BLOG_IMAGE_CONTENT_TYPES)[number])) {
      throw new ApiError(415, 'unsupported_image_type', 'Formats acceptés : JPEG, PNG, WebP et GIF.');
    }

    const bytes = Buffer.from(await file.arrayBuffer());
    const detectedContentType = detectBlogImageContentType(bytes);
    if (!detectedContentType || detectedContentType !== file.type.toLowerCase()) {
      throw new ApiError(415, 'invalid_image_signature', 'Le contenu du fichier ne correspond pas à un format d’image accepté.');
    }

    const sha256 = createHash('sha256').update(bytes).digest('hex');
    const originalFilename = cleanOriginalFilename(file.name);
    const id = randomUUID();
    const storagePath = `blogImages/${id}.${extensionForBlogImage(detectedContentType)}`;

    const stored = await transaction(async (client) => {
      const duplicateResult = await client.query<MediaSummaryRow>(`
        SELECT id, storage_path, original_filename, content_type, byte_size, sha256, created_at
        FROM media_assets
        WHERE sha256 = $1 AND byte_size = $2 AND content_type = $3 AND is_public = true
        ORDER BY created_at ASC
        LIMIT 1
      `, [sha256, bytes.length, detectedContentType]);
      const duplicate = duplicateResult.rows[0];
      if (duplicate) {
        await writeAuditLog(client, request, actor.uid, 'media.reuse', 'media_asset', duplicate.id, {
          sha256,
          originalFilename,
        });
        return { media: duplicate, reused: true };
      }

      const result = await client.query<MediaSummaryRow>(`
        INSERT INTO media_assets (
          id, storage_path, original_filename, content_type, byte_size, sha256,
          content, uploaded_by, is_public, source_provider, source_bucket, source_path,
          metadata, legacy_url_hashes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true,
          'render_upload', 'postgres', $2, $9::jsonb, '[]'::jsonb
        )
        RETURNING id, storage_path, original_filename, content_type, byte_size, sha256, created_at
      `, [
        id, storagePath, originalFilename, detectedContentType, bytes.length,
        sha256, bytes, actor.uid, JSON.stringify({ uploadedBy: actor.uid }),
      ]);
      const media = result.rows[0];
      await writeAuditLog(client, request, actor.uid, 'media.upload', 'media_asset', media.id, {
        sha256,
        byteSize: bytes.length,
        contentType: detectedContentType,
      });
      return { media, reused: false };
    });

    return jsonOk({ media: serializeMedia(stored.media), reused: stored.reused }, { status: stored.reused ? 200 : 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
