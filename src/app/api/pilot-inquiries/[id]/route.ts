import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { pilotInquiryStatuses } from '@/lib/pilot-inquiries';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const intakeRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const inquiryIdSchema = z.string().uuid();
const updateSchema = z.object({
  status: z.enum(pilotInquiryStatuses).optional(),
  internalNotes: z.string().trim().max(4000).transform((value) => value || null).optional(),
}).strict().refine(
  (input) => input.status !== undefined || input.internalNotes !== undefined,
  'Submit at least one change.',
);

type InquiryUpdateRow = {
  id: string;
  status: (typeof pilotInquiryStatuses)[number];
  internal_notes: string | null;
  updated_at: Date | string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(intakeRoles);
    const id = inquiryIdSchema.parse((await context.params).id);
    const input = updateSchema.parse(await readJson(request, 8 * 1024));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<InquiryUpdateRow>(`
        SELECT id, status, internal_notes, updated_at
        FROM pilot_inquiries
        WHERE id = $1 AND retention_expires_at > now()
        FOR UPDATE
      `, [id]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'inquiry_not_found', 'Pilot inquiry not found.');

      const status = input.status ?? current.status;
      const internalNotes = input.internalNotes === undefined ? current.internal_notes : input.internalNotes;
      const result = await client.query<InquiryUpdateRow>(`
        UPDATE pilot_inquiries
        SET status = $1, internal_notes = $2
        WHERE id = $3
        RETURNING id, status, internal_notes, updated_at
      `, [status, internalNotes, id]);
      await writeAuditLog(client, request, actor.uid, 'pilot_inquiry.update', 'pilot_inquiry', id, {
        fromStatus: current.status,
        toStatus: status,
        notesChanged: internalNotes !== current.internal_notes,
      });
      return result.rows[0];
    });

    return jsonOk({
      inquiry: {
        id: updated.id,
        status: updated.status,
        internalNotes: updated.internal_notes ?? undefined,
        updatedAt: new Date(updated.updated_at).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
