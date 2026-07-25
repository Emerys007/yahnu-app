import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const supportRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const ticketIdSchema = z.string().trim().min(1).max(200);
const updateSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
}).strict();

type TicketStatus = z.infer<typeof updateSchema>['status'];
type TicketStatusRow = {
  id: string;
  status: TicketStatus;
  updated_at: Date | string;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(supportRoles);
    const id = ticketIdSchema.parse((await context.params).id);
    const input = updateSchema.parse(await readJson(request));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<{ status: TicketStatus }>(`
        SELECT status FROM tickets WHERE id = $1 AND type = 'support' FOR UPDATE
      `, [id]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'ticket_not_found', 'Support ticket not found.');

      if (current.status === input.status) {
        const unchanged = await client.query<TicketStatusRow>(`
          SELECT id, status, updated_at FROM tickets WHERE id = $1
        `, [id]);
        return unchanged.rows[0];
      }

      const result = await client.query<TicketStatusRow>(`
        UPDATE tickets SET status = $1 WHERE id = $2
        RETURNING id, status, updated_at
      `, [input.status, id]);
      await writeAuditLog(client, request, actor.uid, 'ticket.status.update', 'ticket', id, {
        from: current.status,
        to: input.status,
      });
      return result.rows[0];
    });

    return jsonOk({
      ticket: {
        id: updated.id,
        status: updated.status,
        updatedAt: new Date(updated.updated_at).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
