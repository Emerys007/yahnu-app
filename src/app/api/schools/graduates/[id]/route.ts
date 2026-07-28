import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { EducationEntry, Role, UserStatus } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sendAccountReviewEmail } from '@/lib/server/email';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const schoolRoles: ReadonlySet<Role> = new Set(['school']);
const updateSchema = z.object({ status: z.enum(['pending', 'active']) }).strict();

type GraduateRow = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  education: EducationEntry[] | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const school = await requireUser(schoolRoles);
    await enforceRateLimit(request, 'graduate-status-review', 60, 60 * 60, school.uid);
    const { status } = updateSchema.parse(await readJson(request));
    const { id } = await context.params;

    const { graduate, statusChanged } = await transaction(async (client) => {
      const currentResult = await client.query<GraduateRow>(`
        SELECT id, name, email, status, education
        FROM users
        WHERE id = $1
          AND role = 'graduate'
          AND school_id = $2
          AND status IN ('pending', 'active')
          AND deleted_at IS NULL
        FOR UPDATE
      `, [id, school.uid]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'graduate_not_found', 'Graduate not found.');
      if (current.status === status) return { graduate: current, statusChanged: false };

      const result = await client.query<GraduateRow>(`
        UPDATE users
        SET status = $1
        WHERE id = $2
        RETURNING id, name, email, status, education
      `, [status, id]);
      const updated = result.rows[0];
      if (status !== 'active') await client.query('DELETE FROM sessions WHERE user_id = $1', [updated.id]);
      const notificationSource = {
        origin: 'render',
        recipientId: updated.id,
        status,
        reviewedBySchoolId: school.uid,
      };
      await client.query(`
        INSERT INTO notifications (
          id, user_id, recipient_ref, created_by, actor_ref, type,
          title, body, link, payload, source_payload, source_hash
        ) VALUES ($1, $2, $2, $3, $3, 'account_review', $4, $5, $6, $7::jsonb, $7::jsonb, $8)
      `, [
        randomUUID(),
        updated.id,
        school.uid,
        status === 'active' ? 'Votre espace Yahnu est activé' : 'Votre espace est en vérification',
        status === 'active'
          ? 'Votre établissement a validé votre accès. Vous pouvez maintenant utiliser votre espace jeune diplômé.'
          : 'Votre établissement doit de nouveau vérifier votre accès Yahnu.',
        status === 'active' ? '/dashboard' : '/login',
        JSON.stringify(notificationSource),
        sourceHash(notificationSource),
      ]);
      await writeAuditLog(client, request, school.uid, 'graduate.status.update', 'user', updated.id, {
        from: current.status,
        to: status,
      });
      return { graduate: updated, statusChanged: true };
    });

    let emailDelivery: 'sent' | 'failed' | 'not_needed' = 'not_needed';
    if (statusChanged) {
      try {
        await sendAccountReviewEmail(graduate.email, graduate.name, 'graduate', status);
        emailDelivery = 'sent';
      } catch (error) {
        emailDelivery = 'failed';
        console.error('Graduate status changed but the notification email could not be delivered.', error);
      }
    }

    return jsonOk({
      graduate: {
        ...graduate,
        education: Array.isArray(graduate.education) ? graduate.education : [],
      },
      emailDelivery,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
