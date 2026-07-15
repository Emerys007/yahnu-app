import { z } from 'zod';

import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, handleApiError } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

export const runtime = 'nodejs';

const mediaIdSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/);

type PrivateMediaRow = {
  original_filename: string;
  content: Buffer;
};

function attachmentDisposition(filename: string) {
  const clean = filename.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 1_000) || 'yahnu-file';
  const ascii = clean.replace(/[^\x20-\x7e]/g, '_').replace(/["\\]/g, '_');
  const encoded = encodeURIComponent(clean).replace(/['()*]/g, (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`);
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encoded}`;
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser();
    await enforceRateLimit(request, 'private-media-download', 60, 60, user.uid);
    const id = mediaIdSchema.parse((await context.params).id);
    const isAdministrator = user.role === 'admin' || user.role === 'super_admin';
    const result = await query<PrivateMediaRow>(`
      SELECT asset.original_filename, asset.content
      FROM media_assets asset
      WHERE asset.id = $1
        AND asset.is_public = false
        AND (
          asset.uploaded_by = $2
          OR $3::boolean = true
          OR EXISTS (
            SELECT 1
            FROM messages message
            JOIN conversation_participants participant
              ON participant.conversation_id = message.conversation_id
            WHERE message.attachment_asset_id = asset.id
              AND participant.user_id = $2
          )
          OR EXISTS (
            SELECT 1
            FROM applications application
            LEFT JOIN jobs job ON job.id = application.job_id
            WHERE application.resume_asset_id = asset.id
              AND (application.applicant_id = $2 OR job.company_id = $2)
          )
        )
      LIMIT 1
    `, [id, user.uid, isAdministrator]);
    const media = result.rows[0];
    if (!media) throw new ApiError(404, 'media_not_found', 'Fichier introuvable.');

    // `pg` already materializes bytea as a Buffer. Queue that buffer directly
    // instead of cloning it with Uint8Array.from(), which doubles peak memory
    // for large private attachments.
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(media.content);
        controller.close();
      },
    });

    return new Response(body, {
      status: 200,
      headers: {
        'Cache-Control': 'private, no-store, max-age=0',
        'Content-Disposition': attachmentDisposition(media.original_filename),
        'Content-Length': String(media.content.byteLength),
        'Content-Security-Policy': "default-src 'none'; sandbox",
        'Content-Type': 'application/octet-stream',
        'Cross-Origin-Resource-Policy': 'same-origin',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
