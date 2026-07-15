import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { serializePartnership, type PartnershipRow } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const partnershipRoles = new Set<'company' | 'school'>(['company', 'school']);
const idSchema = z.string().trim().min(1).max(1_500);
const updateSchema = z.object({ status: z.enum(['accepted', 'declined', 'cancelled']) }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(partnershipRoles);
    await enforceRateLimit(request, 'partnership-update', 40, 60 * 60, actor.uid);
    const id = idSchema.parse((await context.params).id);
    const input = updateSchema.parse(await readJson(request, 4 * 1024));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<{
        requester_id: string | null;
        partner_id: string | null;
        status: string;
      }>('SELECT requester_id, partner_id, status FROM partnerships WHERE id = $1 FOR UPDATE', [id]);
      const current = currentResult.rows[0];
      if (!current || (current.requester_id !== actor.uid && current.partner_id !== actor.uid)) {
        throw new ApiError(404, 'partnership_not_found', 'This partnership request was not found.');
      }
      if (current.status !== 'pending') throw new ApiError(409, 'partnership_finalized', 'This request has already been resolved.');
      if (current.partner_id === actor.uid && !['accepted', 'declined'].includes(input.status)) {
        throw new ApiError(403, 'invalid_partnership_action', 'The receiving organization may accept or decline the request.');
      }
      if (current.requester_id === actor.uid && input.status !== 'cancelled') {
        throw new ApiError(403, 'invalid_partnership_action', 'The requesting organization may only cancel the request.');
      }

      await client.query('UPDATE partnerships SET status = $1, updated_at = now() WHERE id = $2', [input.status, id]);
      const recipientId = current.requester_id === actor.uid ? current.partner_id : current.requester_id;
      if (recipientId) {
        const notificationId = randomUUID();
        const notificationSource = { origin: 'render', partnershipId: id, status: input.status, recipientId };
        await client.query(`
          INSERT INTO notifications (
            id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash
          ) VALUES ($1, $2, $2, $3, $3, 'partnership',
            'Partnership updated', $4, '/dashboard/partnerships', $5::jsonb, $5::jsonb, $6)
        `, [
          notificationId,
          recipientId,
          actor.uid,
          `A partnership request is now ${input.status}.`,
          JSON.stringify(notificationSource),
          sourceHash(notificationSource),
        ]);
      }
      await writeAuditLog(client, request, actor.uid, 'partnership.status.update', 'partnership', id, {
        from: current.status,
        to: input.status,
      });

      const result = await client.query<PartnershipRow>(`
        SELECT partnership.id, partnership.requester_id,
          requester.name AS requester_name, requester.role AS requester_role,
          requester.company_name AS requester_company_name,
          requester.school_name AS requester_school_name,
          partnership.partner_id, partner.name AS partner_name, partner.role AS partner_role,
          partner.company_name AS partner_company_name, partner.school_name AS partner_school_name,
          partnership.organization_name, partnership.status,
          partnership.created_at, partnership.updated_at
        FROM partnerships partnership
        LEFT JOIN users requester ON requester.id = partnership.requester_id
        LEFT JOIN users partner ON partner.id = partnership.partner_id
        WHERE partnership.id = $1
      `, [id]);
      return result.rows[0];
    });
    return jsonOk({ partnership: serializePartnership(updated, actor.uid) });
  } catch (error) {
    return handleApiError(error);
  }
}
