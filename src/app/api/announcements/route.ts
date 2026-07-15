import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sourceHash } from '@/lib/server/source-hash';

const managerRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']);
const audienceSchema = z.enum(['all', 'graduate', 'company', 'school']);
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
const inputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(10_000),
  audience: audienceSchema,
  status: z.enum(['draft', 'active']),
  expiresAt: z.string().datetime().nullable(),
}).strict();

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  audience: z.infer<typeof audienceSchema>;
  status: 'draft' | 'active';
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type AnnouncementListRow = Omit<AnnouncementRow, 'content'> & {
  content_preview: string;
};

const mapAnnouncement = (row: AnnouncementRow) => ({
  id: row.id,
  title: row.title,
  content: row.content,
  audience: row.audience,
  status: row.status,
  expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const mapAnnouncementSummary = (row: AnnouncementListRow) => ({
  id: row.id,
  title: row.title,
  contentPreview: row.content_preview,
  audience: row.audience,
  status: row.status,
  expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

export async function GET(request: Request) {
  try {
    await requireUser(managerRoles);
    const url = new URL(request.url);
    const { limit, offset } = listQuerySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const result = await query<AnnouncementListRow>(`
      SELECT id, title, LEFT(content, 480) AS content_preview, audience, status, expires_at, created_at, updated_at
      FROM announcements
      ORDER BY created_at DESC, id DESC
      LIMIT $1 OFFSET $2
    `, [limit + 1, offset]);
    const hasMore = result.rows.length > limit;
    return jsonOk({
      announcements: result.rows.slice(0, limit).map(mapAnnouncementSummary),
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(managerRoles);
    const input = inputSchema.parse(await readJson(request));
    const id = randomUUID();
    const sourcePayload = { ...input, origin: 'render' };
    const row = await transaction(async (client) => {
      const result = await client.query<AnnouncementRow>(`
        INSERT INTO announcements (id, title, content, audience, status, expires_at, created_by, source_payload, source_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9)
        RETURNING id, title, content, audience, status, expires_at, created_at, updated_at
      `, [id, input.title, input.content, input.audience, input.status, input.expiresAt, actor.uid, JSON.stringify(sourcePayload), sourceHash(sourcePayload)]);
      if (input.status === 'active') {
        const notificationPayload = { announcementId: id, origin: 'render' };
        await client.query(`
          INSERT INTO notifications (id, target_role, is_global, created_by, type, title, body, link, payload, source_payload, source_hash, expires_at)
          VALUES ($1, $2, $3, $4, 'announcement', $5, $6, '/dashboard', $7::jsonb, $7::jsonb, $8, $9)
        `, [randomUUID(), input.audience === 'all' ? null : input.audience, input.audience === 'all', actor.uid, input.title, input.content, JSON.stringify(notificationPayload), sourceHash(notificationPayload), input.expiresAt]);
      }
      await writeAuditLog(client, request, actor.uid, 'announcement.create', 'announcement', id, { status: input.status, audience: input.audience });
      return result.rows[0];
    });
    return jsonOk({ announcement: mapAnnouncement(row) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
