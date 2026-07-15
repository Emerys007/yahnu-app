import { z } from 'zod';

import { adminRoles, type Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const paramsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const bodySchema = z.object({ status: z.enum(['active', 'declined']) }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = paramsSchema.parse(await context.params);
    const { status } = bodySchema.parse(await readJson(request));

    const user = await transaction(async (client) => {
      const current = await client.query<{ id: string; role: Role; status: string }>(`
        SELECT id, role, status FROM users
        WHERE id = $1 AND deleted_at IS NULL AND role = ANY($2::text[])
        FOR UPDATE
      `, [id, ['company', 'school']]);
      if (!current.rows[0]) throw new ApiError(404, 'moderation_item_not_found', 'This profile is no longer awaiting review.');
      if (current.rows[0].status !== 'pending') {
        throw new ApiError(409, 'moderation_item_already_reviewed', 'This profile has already been reviewed.');
      }
      const updated = await client.query<{ id: string; role: Role; status: string }>(`
        UPDATE users SET status = $1 WHERE id = $2 RETURNING id, role, status
      `, [status, id]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      await writeAuditLog(client, request, actor.uid, 'content.profile.review', 'user', id, {
        role: current.rows[0].role,
        decision: status,
      });
      return updated.rows[0];
    });

    return jsonOk({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
