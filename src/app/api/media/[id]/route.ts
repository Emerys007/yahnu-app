import { createHash } from 'node:crypto';
import { z } from 'zod';

import { cleanOriginalFilename, detectBlogImageContentType } from '@/lib/blog-media';
import { getCurrentUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, handleApiError } from '@/lib/server/http';

export const runtime = 'nodejs';

const mediaIdSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/);

type MediaRow = {
  id: string;
  original_filename: string;
  content_type: string;
  byte_size: string | number;
  sha256: string | Buffer;
  content: Buffer;
  created_at: Date | string;
  is_public: boolean;
  uploaded_by: string | null;
  metadata: { workspace?: string } | null;
};

function contentDisposition(filename: string) {
  const clean = cleanOriginalFilename(filename);
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_') || 'image';
  const encoded = encodeURIComponent(clean).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `inline; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const id = mediaIdSchema.parse((await context.params).id);
    const actor = await getCurrentUser();
    const result = await query<MediaRow>(`
      SELECT id, original_filename, content_type, byte_size, sha256, content, created_at,
        is_public, uploaded_by, metadata
      FROM media_assets
      WHERE id = $1
        AND (is_public = true OR uploaded_by = $2)
      LIMIT 1
    `, [id, actor?.uid || null]);
    const media = result.rows[0];
    if (!media) throw new ApiError(404, 'media_not_found', 'Image introuvable.');

    const bytes = Uint8Array.from(media.content);
    const detectedContentType = detectBlogImageContentType(bytes);
    if (!detectedContentType) {
      console.error(`Refusing to serve media with an invalid image signature: ${id}`);
      throw new ApiError(404, 'media_not_found', 'Image introuvable.');
    }

    const storedHash = Buffer.isBuffer(media.sha256) ? media.sha256.toString('hex') : media.sha256;
    const sha256 = /^[a-f0-9]{64}$/i.test(storedHash)
      ? storedHash.toLowerCase()
      : createHash('sha256').update(bytes).digest('hex');
    const etag = `"${sha256}"`;
    const isOrganizationImage = media.metadata?.workspace === 'organization_profile';
    const headers = new Headers({
      'Cache-Control': media.is_public
        ? (isOrganizationImage ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000, immutable')
        : 'private, no-store',
      'Content-Disposition': contentDisposition(media.original_filename),
      'Content-Length': String(bytes.byteLength),
      'Content-Security-Policy': "default-src 'none'; sandbox",
      'Content-Type': detectedContentType,
      'Cross-Origin-Resource-Policy': 'same-origin',
      ETag: etag,
      'Last-Modified': new Date(media.created_at).toUTCString(),
      'X-Content-Type-Options': 'nosniff',
    });

    if (request.headers.get('if-none-match') === etag) {
      return new Response(null, { status: 304, headers });
    }
    return new Response(bytes, { status: 200, headers });
  } catch (error) {
    return handleApiError(error);
  }
}
