import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { adminRoles, type Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sendAccountReviewEmail } from '@/lib/server/email';
import { sourceHash } from '@/lib/server/source-hash';

const paramsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const bodySchema = z.object({ status: z.enum(['active', 'declined']) }).strict();

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = paramsSchema.parse(await context.params);
    const { status } = bodySchema.parse(await readJson(request));

    const user = await transaction(async (client) => {
      const current = await client.query<{ id: string; role: Role; status: string; name: string; email: string }>(`
        SELECT id, role, status, name, email FROM users
        WHERE id = $1 AND deleted_at IS NULL AND role = ANY($2::text[])
        FOR UPDATE
      `, [id, ['company', 'school']]);
      if (!current.rows[0]) throw new ApiError(404, 'moderation_item_not_found', 'This profile is no longer awaiting review.');
      if (current.rows[0].status !== 'pending') {
        throw new ApiError(409, 'moderation_item_already_reviewed', 'This profile has already been reviewed.');
      }
      const updated = await client.query<{ id: string; role: Role; status: string; name: string; email: string }>(`
        UPDATE users SET status = $1 WHERE id = $2 RETURNING id, role, status, name, email
      `, [status, id]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [id]);
      const notificationSource = {
        origin: 'render',
        recipientId: id,
        status,
        reviewedBy: actor.uid,
      };
      await client.query(`
        INSERT INTO notifications (
          id, user_id, recipient_ref, created_by, actor_ref, type,
          title, body, link, payload, source_payload, source_hash
        ) VALUES ($1, $2, $2, $3, $3, 'account_review', $4, $5, $6, $7::jsonb, $7::jsonb, $8)
      `, [
        randomUUID(),
        id,
        actor.uid,
        status === 'active' ? 'Votre organisation est validée' : 'Décision concernant votre inscription',
        status === 'active'
          ? 'L’équipe Yahnu a validé votre organisation. Votre espace est maintenant accessible.'
          : 'Votre inscription n’a pas été validée à cette étape. Contactez Yahnu pour obtenir plus d’informations.',
        status === 'active' ? '/dashboard' : '/contact?intent=account-review&source=other',
        JSON.stringify(notificationSource),
        sourceHash(notificationSource),
      ]);
      await writeAuditLog(client, request, actor.uid, 'content.profile.review', 'user', id, {
        role: current.rows[0].role,
        decision: status,
      });
      return updated.rows[0];
    });

    let emailDelivery: 'sent' | 'failed' = 'sent';
    try {
      await sendAccountReviewEmail(
        user.email,
        user.name,
        user.role as 'company' | 'school',
        status,
      );
    } catch (error) {
      emailDelivery = 'failed';
      console.error('Organization review completed but the notification email could not be delivered.', error);
    }

    return jsonOk({ user, emailDelivery });
  } catch (error) {
    return handleApiError(error);
  }
}
