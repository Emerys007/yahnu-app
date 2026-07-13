import { z } from 'zod';
import type { PoolClient } from 'pg';

import { adminRoles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const routeParamsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const statusSchema = z.object({ status: z.enum(['active', 'suspended']) }).strict();
const staffRoleNames = ['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff'];

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
};

async function lockStaff(client: PoolClient, id: string) {
  const result = await client.query<StaffRow>(`
    SELECT id, name, email, role, status
    FROM users
    WHERE id = $1
      AND deleted_at IS NULL
      AND role = ANY($2::text[])
    FOR UPDATE
  `, [id, staffRoleNames]);
  if (!result.rows[0]) throw new ApiError(404, 'staff_not_found', 'This team member could not be found.');
  return result.rows[0];
}

async function ensureSuperAdminRemains(client: PoolClient, target: StaffRow) {
  if (target.role !== 'super_admin' || target.status !== 'active') return;
  await client.query("SELECT pg_advisory_xact_lock(hashtext('yahnu-super-admin-management'))");
  const result = await client.query<{ count: string }>(`
    SELECT count(*) AS count
    FROM users
    WHERE role = 'super_admin'
      AND status = 'active'
      AND deleted_at IS NULL
      AND id <> $1
  `, [target.id]);
  if (Number(result.rows[0]?.count ?? 0) === 0) {
    throw new ApiError(409, 'last_super_admin', 'The last active super administrator cannot be deactivated.');
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = routeParamsSchema.parse(await context.params);
    const { status } = statusSchema.parse(await readJson(request));
    if (id === actor.uid && status !== 'active') {
      throw new ApiError(409, 'cannot_deactivate_self', 'You cannot deactivate your own account.');
    }

    const updated = await transaction(async (client) => {
      const target = await lockStaff(client, id);
      if (target.role === 'super_admin' && actor.role !== 'super_admin') {
        throw new ApiError(403, 'super_admin_required', 'Only a super administrator can manage this account.');
      }
      if (status !== 'active') await ensureSuperAdminRemains(client, target);

      await client.query('UPDATE users SET status = $1 WHERE id = $2', [status, id]);
      if (status !== 'active') await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      await writeAuditLog(client, request, actor.uid, 'admin.staff.status_change', 'user', id, {
        from: target.status,
        to: status,
        role: target.role,
      });
      return { ...target, status };
    });

    return jsonOk({
      staff: {
        id: updated.id,
        name: updated.name || updated.email,
        email: updated.email,
        accountType: updated.role,
        status: updated.status,
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
    if (id === actor.uid) throw new ApiError(409, 'cannot_delete_self', 'You cannot delete your own account.');

    await transaction(async (client) => {
      const target = await lockStaff(client, id);
      if ((target.role === 'admin' || target.role === 'super_admin') && actor.role !== 'super_admin') {
        throw new ApiError(403, 'super_admin_required', 'Only a super administrator can delete an administrator.');
      }
      await ensureSuperAdminRemains(client, target);

      await client.query(`
        UPDATE users
        SET deleted_at = now(), status = 'suspended', pending_email = NULL
        WHERE id = $1
      `, [id]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      await writeAuditLog(client, request, actor.uid, 'admin.staff.soft_delete', 'user', id, {
        role: target.role,
        priorStatus: target.status,
      });
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
