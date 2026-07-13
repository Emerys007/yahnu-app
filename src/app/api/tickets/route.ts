import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const ticketSchema = z.object({
  subject: z.string().trim().min(5).max(200),
  message: z.string().trim().min(20).max(10_000),
}).strict();

type TicketRow = {
  id: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  type?: string;
  subject?: string | null;
  description?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  submitted_at: Date | string;
  updated_at?: Date | string;
};

type TicketSummaryRow = {
  open: string;
  in_progress: string;
  resolved_today: string;
};

const supportRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(250).default(100),
});

function serializeTicket(ticket: TicketRow) {
  return {
    id: ticket.id,
    userId: ticket.user_id,
    userName: ticket.user_name,
    userEmail: ticket.user_email,
    type: ticket.type,
    subject: ticket.subject ?? 'Support request',
    description: ticket.description,
    status: ticket.status,
    priority: ticket.priority,
    submittedAt: new Date(ticket.submitted_at).toISOString(),
    updatedAt: new Date(ticket.updated_at ?? ticket.submitted_at).toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    await requireUser(supportRoles);
    const { limit } = listSchema.parse({ limit: new URL(request.url).searchParams.get('limit') ?? undefined });

    const [ticketsResult, summaryResult] = await Promise.all([
      query<TicketRow>(`
        SELECT t.id, t.user_id, u.name AS user_name, u.email AS user_email, t.type,
          t.subject, t.description, t.status, t.priority, t.submitted_at, t.updated_at
        FROM tickets t
        JOIN users u ON u.id = t.user_id
        WHERE t.type = 'support' AND u.deleted_at IS NULL
        ORDER BY
          CASE t.status WHEN 'open' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'resolved' THEN 2 ELSE 3 END,
          CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END,
          t.submitted_at DESC
        LIMIT $1
      `, [limit]),
      query<TicketSummaryRow>(`
        SELECT
          count(*) FILTER (WHERE t.status = 'open')::text AS open,
          count(*) FILTER (WHERE t.status = 'in_progress')::text AS in_progress,
          count(*) FILTER (
            WHERE t.status IN ('resolved', 'closed')
              AND t.updated_at >= date_trunc('day', now())
          )::text AS resolved_today
        FROM tickets t
        JOIN users u ON u.id = t.user_id
        WHERE t.type = 'support' AND u.deleted_at IS NULL
      `),
    ]);

    const summary = summaryResult.rows[0] ?? { open: '0', in_progress: '0', resolved_today: '0' };
    return jsonOk({
      tickets: ticketsResult.rows.map(serializeTicket),
      summary: {
        open: Number(summary.open),
        inProgress: Number(summary.in_progress),
        resolvedToday: Number(summary.resolved_today),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = ticketSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'support-ticket', 5, 60 * 60, user.uid);

    const ticket = await transaction(async (client) => {
      const result = await client.query<TicketRow>(`
        INSERT INTO tickets (id, user_id, type, subject, description, status, priority)
        VALUES ($1, $2, 'support', $3, $4, 'open', 'normal')
        RETURNING id, status, submitted_at
      `, [randomUUID(), user.uid, input.subject, input.message]);
      const created = result.rows[0];
      await writeAuditLog(client, request, user.uid, 'ticket.create', 'ticket', created.id, { type: 'support' });
      return created;
    });

    return jsonOk({
      ticket: {
        id: ticket.id,
        status: ticket.status,
        submittedAt: new Date(ticket.submitted_at).toISOString(),
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
