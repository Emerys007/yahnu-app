import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { adminRoles } from '@/lib/auth-types';
import { hashToken, newOpaqueToken, requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { sendInvitationEmail } from '@/lib/server/email';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const invitationSchema = z.object({
  email: z.string().trim().email().max(320).transform((email) => email.toLowerCase()),
  role: z.enum(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const input = invitationSchema.parse(await readJson(request));
    if (input.role === 'super_admin' && actor.role !== 'super_admin') {
      throw new ApiError(403, 'super_admin_required', 'Only a super administrator can invite another super administrator.');
    }

    const id = randomUUID();
    const token = newOpaqueToken();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`yahnu-invite:${input.email}`]);
      const existing = await client.query('SELECT 1 FROM users WHERE lower(email) = $1 AND deleted_at IS NULL', [input.email]);
      if (existing.rowCount) throw new ApiError(409, 'email_in_use', 'An active account already uses this email address.');

      await client.query(`
        UPDATE invites
        SET status = CASE WHEN expires_at <= now() THEN 'expired' ELSE 'revoked' END
        WHERE lower(email) = $1 AND status = 'pending'
      `, [input.email]);
      await client.query(`
        INSERT INTO invites (id, token_hash, email, role, status, created_by, expires_at)
        VALUES ($1, $2, $3, $4, 'pending', $5, $6)
      `, [id, hashToken(token), input.email, input.role, actor.uid, expiresAt]);
      await writeAuditLog(client, request, actor.uid, 'admin.invite.create', 'invite', id, {
        email: input.email,
        role: input.role,
        expiresAt: expiresAt.toISOString(),
      });
    });

    let delivery;
    try {
      delivery = await sendInvitationEmail(input.email, input.role, token);
    } catch (error) {
      await transaction(async (client) => {
        await client.query("UPDATE invites SET status = 'revoked' WHERE id = $1 AND status = 'pending'", [id]);
        await writeAuditLog(client, request, actor.uid, 'admin.invite.delivery_failed', 'invite', id, {
          email: input.email,
          role: input.role,
        });
      });
      throw error;
    }

    return jsonOk({
      invite: { id, email: input.email, role: input.role, expiresAt: expiresAt.toISOString() },
      emailDelivery: delivery.delivered ? 'sent' : 'development_link',
      ...(process.env.NODE_ENV !== 'production' && delivery.debugUrl ? { debugUrl: delivery.debugUrl } : {}),
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
