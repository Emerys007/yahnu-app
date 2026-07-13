import { z } from 'zod';

import { adminRoles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const routeParamsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const statusSchema = z.object({
  status: z.enum(['pending', 'active', 'suspended', 'declined']),
}).strict();

type PublicUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: Date | string;
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = routeParamsSchema.parse(await context.params);
    const { status } = statusSchema.parse(await readJson(request));

    const updated = await transaction(async (client) => {
      const targetResult = await client.query<PublicUserRow>(`
        SELECT id, name, email, role, status, created_at
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
          AND role = ANY($2::text[])
        FOR UPDATE
      `, [id, ['graduate', 'company', 'school']]);
      const target = targetResult.rows[0];
      if (!target) throw new ApiError(404, 'user_not_found', 'This user could not be found.');

      const result = await client.query<PublicUserRow>(`
        UPDATE users
        SET status = $1
        WHERE id = $2
        RETURNING id, name, email, role, status, created_at
      `, [status, id]);

      if (status !== 'active') {
        await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      }

      await writeAuditLog(client, request, actor.uid, 'admin.user.status_change', 'user', id, {
        from: target.status,
        to: status,
        role: target.role,
      });
      return result.rows[0];
    });

    return jsonOk({
      user: {
        id: updated.id,
        name: updated.name || updated.email,
        email: updated.email,
        accountType: updated.role,
        status: updated.status,
        date: new Date(updated.created_at).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = routeParamsSchema.parse(await context.params);

    await transaction(async (client) => {
      const targetResult = await client.query<PublicUserRow>(`
        SELECT id, name, email, role, status, created_at
        FROM users
        WHERE id = $1
          AND deleted_at IS NULL
          AND role = ANY($2::text[])
        FOR UPDATE
      `, [id, ['graduate', 'company', 'school']]);
      const target = targetResult.rows[0];
      if (!target) throw new ApiError(404, 'user_not_found', 'This user could not be found.');

      await client.query(`
        UPDATE users
        SET deleted_at = now(), status = 'suspended', pending_email = NULL
        WHERE id = $1
      `, [id]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      await writeAuditLog(client, request, actor.uid, 'admin.user.soft_delete', 'user', id, {
        role: target.role,
        priorStatus: target.status,
      });
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
