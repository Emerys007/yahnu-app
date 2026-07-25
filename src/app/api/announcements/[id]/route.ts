import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sourceHash } from '@/lib/server/source-hash';

const managerRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']);
const paramsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const inputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  content: z.string().trim().min(1).max(10_000),
  audience: z.enum(['all', 'graduate', 'company', 'school']),
  status: z.enum(['draft', 'active']),
  expiresAt: z.string().datetime().nullable(),
}).strict();

type AnnouncementRow = {
  id: string;
  title: string;
  content: string;
  audience: 'all' | Role;
  status: 'draft' | 'active';
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
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

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    await requireUser(managerRoles);
    const { id } = paramsSchema.parse(await context.params);
    const result = await query<AnnouncementRow>(`
      SELECT id, title, content, audience, status, expires_at, created_at, updated_at
      FROM announcements
      WHERE id = $1
      LIMIT 1
    `, [id]);
    if (!result.rows[0]) throw new ApiError(404, 'announcement_not_found', 'This announcement no longer exists.');
    return jsonOk({ announcement: mapAnnouncement(result.rows[0]) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(managerRoles);
    const { id } = paramsSchema.parse(await context.params);
    const input = inputSchema.parse(await readJson(request));
    const sourcePayload = { ...input, origin: 'render' };
    const row = await transaction(async (client) => {
      const current = await client.query<{ status: string }>('SELECT status FROM announcements WHERE id = $1 FOR UPDATE', [id]);
      if (!current.rows[0]) throw new ApiError(404, 'announcement_not_found', 'This announcement no longer exists.');
      const result = await client.query<AnnouncementRow>(`
        UPDATE announcements
        SET title = $1, content = $2, audience = $3, status = $4, expires_at = $5,
          source_payload = $6::jsonb, source_hash = $7
        WHERE id = $8
        RETURNING id, title, content, audience, status, expires_at, created_at, updated_at
      `, [input.title, input.content, input.audience, input.status, input.expiresAt, JSON.stringify(sourcePayload), sourceHash(sourcePayload), id]);
      const notificationPayload = { announcementId: id, origin: 'render' };
      if (input.status === 'active') {
        const notificationHash = sourceHash(notificationPayload);
        const existingNotification = await client.query<{ id: string }>(`
          SELECT id FROM notifications
          WHERE type = 'announcement' AND payload->>'announcementId' = $1
          ORDER BY created_at ASC, id ASC
          LIMIT 1 FOR UPDATE
        `, [id]);
        if (existingNotification.rows[0]) {
          await client.query(`
            UPDATE notifications SET user_id = NULL, target_role = $1, is_global = $2,
              created_by = $3, title = $4, body = $5, payload = $6::jsonb,
              source_payload = $6::jsonb, source_hash = $7, expires_at = $8
            WHERE id = $9
          `, [input.audience === 'all' ? null : input.audience, input.audience === 'all', actor.uid, input.title, input.content, JSON.stringify(notificationPayload), notificationHash, input.expiresAt, existingNotification.rows[0].id]);
        } else {
          await client.query(`
            INSERT INTO notifications (id, target_role, is_global, created_by, type, title, body, link, payload, source_payload, source_hash, expires_at)
            VALUES ($1, $2, $3, $4, 'announcement', $5, $6, '/dashboard', $7::jsonb, $7::jsonb, $8, $9)
          `, [randomUUID(), input.audience === 'all' ? null : input.audience, input.audience === 'all', actor.uid, input.title, input.content, JSON.stringify(notificationPayload), notificationHash, input.expiresAt]);
        }
      } else {
        await client.query(`DELETE FROM notifications WHERE type = 'announcement' AND payload->>'announcementId' = $1`, [id]);
      }
      await writeAuditLog(client, request, actor.uid, 'announcement.update', 'announcement', id, { status: input.status, audience: input.audience });
      return result.rows[0];
    });
    return jsonOk({ announcement: mapAnnouncement(row) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(managerRoles);
    const { id } = paramsSchema.parse(await context.params);
    await transaction(async (client) => {
      await client.query(`DELETE FROM notifications WHERE type = 'announcement' AND payload->>'announcementId' = $1`, [id]);
      const result = await client.query('DELETE FROM announcements WHERE id = $1', [id]);
      if (!result.rowCount) throw new ApiError(404, 'announcement_not_found', 'This announcement no longer exists.');
      await writeAuditLog(client, request, actor.uid, 'announcement.delete', 'announcement', id);
    });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
