import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk } from '@/lib/server/http';

const supportRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const ticketIdSchema = z.string().trim().min(1).max(200);

type TicketRow = {
  id: string;
  user_id: string;
  user_name: string;
  description: string;
  submitted_at: Date | string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(supportRoles);
    const ticketId = ticketIdSchema.parse((await context.params).id);

    const conversationId = await transaction(async (client) => {
      const ticketResult = await client.query<TicketRow>(`
        SELECT t.id, t.user_id, u.name AS user_name, t.description, t.submitted_at, t.status
        FROM tickets t
        JOIN users u ON u.id = t.user_id AND u.deleted_at IS NULL
        WHERE t.id = $1 AND t.type = 'support'
        FOR UPDATE OF t
      `, [ticketId]);
      const ticket = ticketResult.rows[0];
      if (!ticket) throw new ApiError(404, 'ticket_not_found', 'Ticket de support introuvable.');

      const existing = await client.query<{ id: string }>(`
        SELECT id FROM conversations WHERE ticket_id = $1 ORDER BY created_at ASC LIMIT 1
      `, [ticketId]);
      const id = existing.rows[0]?.id || `support-${ticketId}`;

      if (!existing.rows[0]) {
        const conversationSource = { origin: 'render', source: 'support_ticket', ticketId: ticket.id };
        await client.query(`
          INSERT INTO conversations
            (id, name, avatar_url, last_message, last_message_at, ticket_id,
              source_payload, source_hash)
          VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        `, [
          id,
          ticket.user_name,
          null,
          ticket.description,
          ticket.submitted_at,
          ticket.id,
          JSON.stringify(conversationSource),
          sourceHash(conversationSource),
        ]);
        const messageSource = { origin: 'render', source: 'support_ticket', ticketId: ticket.id, conversationId: id };
        await client.query(`
          INSERT INTO messages
            (id, conversation_id, sender_id, sender_ref, body,
              source_payload, source_hash, sent_at, created_at)
          VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, $7, $7)
          ON CONFLICT (id) DO NOTHING
        `, [
          `ticket-${ticket.id}`,
          id,
          ticket.user_id,
          ticket.description,
          JSON.stringify(messageSource),
          sourceHash(messageSource),
          ticket.submitted_at,
        ]);
      }

      await client.query(`
        INSERT INTO conversation_participants
          (conversation_id, participant_ref, user_id, display_name, unread_count, last_read_at)
        SELECT $1, $2, $2, $3, 0, now()
        WHERE NOT EXISTS (
          SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2
        )
        ON CONFLICT (conversation_id, user_id) DO UPDATE
          SET unread_count = 0, last_read_at = now()
      `, [id, actor.uid, actor.name || 'Équipe support']);
      await client.query(`
        INSERT INTO conversation_participants
          (conversation_id, participant_ref, user_id, display_name, unread_count, last_read_at)
        SELECT $1, $2, $2, $3, pending.unread_count,
          CASE WHEN pending.unread_count = 0 THEN now() ELSE NULL END
        FROM (
          SELECT count(*)::integer AS unread_count
          FROM messages
          WHERE conversation_id = $1
            AND COALESCE(sender_id, sender_ref) IS DISTINCT FROM $2
        ) pending
        WHERE NOT EXISTS (
          SELECT 1 FROM conversation_participants WHERE conversation_id = $1 AND user_id = $2
        )
        ON CONFLICT (conversation_id, user_id) DO UPDATE
          SET display_name = EXCLUDED.display_name
      `, [id, ticket.user_id, ticket.user_name]);
      await client.query(`
        UPDATE conversation_participants
        SET unread_count = 0, last_read_at = now()
        WHERE conversation_id = $1 AND user_id = $2
      `, [id, actor.uid]);

      if (ticket.status === 'open') {
        await client.query(`UPDATE tickets SET status = 'in_progress' WHERE id = $1`, [ticket.id]);
      }
      await writeAuditLog(client, request, actor.uid, 'ticket.conversation.open', 'ticket', ticket.id, {
        conversationId: id,
      });
      return id;
    });

    return jsonOk({ conversation: { id: conversationId } });
  } catch (error) {
    return handleApiError(error);
  }
}
