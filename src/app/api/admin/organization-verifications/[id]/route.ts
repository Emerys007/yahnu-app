import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { adminRoles } from '@/lib/auth-types';
import { sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const paramsSchema = z.object({ id: z.string().trim().min(1).max(200) });
const inputSchema = z.object({
  decision: z.enum(['approve', 'reject']),
  note: z.string().trim().max(1000).default(''),
}).strict().superRefine((input, context) => {
  if (input.decision === 'reject' && input.note.length < 10) {
    context.addIssue({
      code: 'custom',
      path: ['note'],
      message: 'Expliquez en au moins 10 caractères ce que l’organisation doit corriger.',
    });
  }
});

type PendingRow = {
  user_id: string;
  role: 'company' | 'school';
  organization_name: string;
  verification_status: 'pending' | 'verified' | 'rejected' | 'unverified';
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(adminRoles);
    const { id } = paramsSchema.parse(await context.params);
    const input = inputSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'organization-verification-review', 100, 60 * 60, actor.uid);
    await enforceRateLimitSubject('organization-verification-review-account', 100, 60 * 60, actor.uid);

    const reviewed = await transaction(async (client) => {
      const result = await client.query<PendingRow>(`
        SELECT profile.user_id, profile.verification_status, organization.role,
          COALESCE(
            NULLIF(btrim(CASE
              WHEN organization.role = 'company' THEN organization.company_name
              ELSE organization.school_name
            END), ''),
            NULLIF(btrim(organization.name), ''),
            organization.email
          ) AS organization_name
        FROM organization_profiles profile
        JOIN users organization
          ON organization.id = profile.user_id
          AND organization.role IN ('company', 'school')
          AND organization.status = 'active'
          AND organization.deleted_at IS NULL
        WHERE profile.user_id = $1
        FOR UPDATE OF profile
      `, [id]);
      const pending = result.rows[0];
      if (!pending) {
        throw new ApiError(404, 'verification_request_not_found', 'Cette demande de vérification est introuvable.');
      }
      if (pending.verification_status !== 'pending') {
        throw new ApiError(409, 'verification_request_already_reviewed', 'Cette demande a déjà été traitée ou retirée.');
      }

      const nextStatus = input.decision === 'approve' ? 'verified' : 'rejected';
      await client.query(`
        UPDATE organization_profiles
        SET verification_status = $2,
          verified_at = CASE WHEN $2 = 'verified' THEN now() ELSE NULL END,
          verification_reviewed_at = now(),
          verification_reviewed_by = $3,
          verification_note = NULLIF($4, '')
        WHERE user_id = $1
      `, [id, nextStatus, actor.uid, input.note]);

      const notificationId = randomUUID();
      const title = input.decision === 'approve'
        ? 'Organisation vérifiée'
        : 'Vérification à compléter';
      const body = input.decision === 'approve'
        ? 'Votre identité a été vérifiée par l’équipe Yahnu.'
        : input.note;
      const notificationSource = {
        origin: 'render',
        organizationId: id,
        decision: input.decision,
        reviewerId: actor.uid,
      };
      await client.query(`
        INSERT INTO notifications (
          id, user_id, recipient_ref, created_by, actor_ref, type,
          title, body, link, payload, source_payload, source_hash
        ) VALUES (
          $1, $2, $2, $3, $3, 'system',
          $4, $5, $6, $7::jsonb, $7::jsonb, $8
        )
      `, [
        notificationId,
        id,
        actor.uid,
        title,
        body,
        pending.role === 'company' ? '/dashboard/company-profile' : '/dashboard/school-profile',
        JSON.stringify(notificationSource),
        sourceHash(notificationSource),
      ]);
      await writeAuditLog(
        client,
        request,
        actor.uid,
        `organization_verification.${input.decision}`,
        'organization_profile',
        id,
        {
          from: pending.verification_status,
          to: nextStatus,
          organizationRole: pending.role,
          note: input.note || null,
        },
      );
      return { id, status: nextStatus, organizationName: pending.organization_name };
    });

    return jsonOk({ request: reviewed });
  } catch (error) {
    return handleApiError(error);
  }
}
