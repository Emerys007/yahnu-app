import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const broadcastSchema = z.object({
  recipientIds: z.array(z.string().trim().min(1).max(200)).min(1).max(250),
  subject: z.string().trim().min(3).max(160),
  body: z.string().trim().min(1).max(10_000),
}).strict();

type RecipientRow = {
  id: string;
  name: string;
  role: Role;
  school_id: string | null;
};

const broadcastRoles: ReadonlySet<Role> = new Set(['school', 'admin', 'super_admin']);

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(broadcastRoles);
    const input = broadcastSchema.parse(await readJson(request));
    const recipientIds = [...new Set(input.recipientIds)].filter((id) => id !== actor.uid);
    if (recipientIds.length === 0) {
      throw new ApiError(422, 'recipient_required', 'Sélectionnez au moins un destinataire.');
    }
    await enforceRateLimit(request, 'conversation-broadcast', 10, 60 * 60, actor.uid);

    const result = await transaction(async (client) => {
      const recipientsResult = await client.query<RecipientRow>(`
        SELECT id, name, role, school_id
        FROM users
        WHERE id = ANY($1::text[])
          AND deleted_at IS NULL
          AND status = ANY($2::text[])
        FOR SHARE
      `, [recipientIds, actor.role === 'school' ? ['pending', 'active'] : ['active']]);
      if (recipientsResult.rows.length !== recipientIds.length) {
        throw new ApiError(422, 'invalid_recipients', 'Un ou plusieurs destinataires ne sont pas disponibles.');
      }
      if (actor.role === 'school' && recipientsResult.rows.some((recipient) => (
        recipient.role !== 'graduate' || recipient.school_id !== actor.uid
      ))) {
        throw new ApiError(403, 'invalid_school_recipients', 'Une école ne peut diffuser qu’à ses propres diplômés.');
      }

      const body = `${input.subject}\n\n${input.body}`;
      const records = recipientsResult.rows.map((recipient) => {
        const conversationId = randomUUID();
        const messageId = randomUUID();
        const conversationSource = { origin: 'render', broadcast: true, subject: input.subject, createdBy: actor.uid, recipientId: recipient.id };
        const messageSource = { origin: 'render', broadcast: true, conversationId, senderId: actor.uid };
        const notificationSource = { origin: 'render', broadcast: true, conversationId, messageId, recipientId: recipient.id };
        return {
          conversation_id: conversationId,
          message_id: messageId,
          recipient_id: recipient.id,
          recipient_name: recipient.name,
          avatar_url: null,
          conversation_source: conversationSource,
          conversation_hash: sourceHash(conversationSource),
          message_source: messageSource,
          message_hash: sourceHash(messageSource),
          notification_source: notificationSource,
          notification_hash: sourceHash(notificationSource),
        };
      });
      const recordsJson = JSON.stringify(records);

      await client.query(`
        INSERT INTO conversations
          (id, name, avatar_url, last_message, last_message_at, source_payload, source_hash)
        SELECT item.conversation_id, item.recipient_name, item.avatar_url, $2, now(),
          item.conversation_source, item.conversation_hash
        FROM jsonb_to_recordset($1::jsonb) AS item(
          conversation_id text, message_id text, recipient_id text,
          recipient_name text, avatar_url text, conversation_source jsonb,
          conversation_hash text, message_source jsonb, message_hash text,
          notification_source jsonb, notification_hash text
        )
      `, [recordsJson, body]);
      await client.query(`
        INSERT INTO conversation_participants
          (conversation_id, participant_ref, user_id, display_name, unread_count, last_read_at)
        SELECT item.conversation_id, participant.user_id, participant.user_id,
          participant.display_name, participant.unread_count,
          CASE WHEN participant.unread_count = 0 THEN now() ELSE NULL END
        FROM jsonb_to_recordset($1::jsonb) AS item(
          conversation_id text, message_id text, recipient_id text,
          recipient_name text, avatar_url text, conversation_source jsonb,
          conversation_hash text, message_source jsonb, message_hash text,
          notification_source jsonb, notification_hash text
        )
        CROSS JOIN LATERAL (
          VALUES ($2::text, $3::text, 0), (item.recipient_id, item.recipient_name, 1)
        ) AS participant(user_id, display_name, unread_count)
      `, [recordsJson, actor.uid, actor.name || 'Yahnu']);
      await client.query(`
        INSERT INTO messages
          (id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at)
        SELECT item.message_id, item.conversation_id, $2, $2, $3,
          item.message_source, item.message_hash, now()
        FROM jsonb_to_recordset($1::jsonb) AS item(
          conversation_id text, message_id text, recipient_id text,
          recipient_name text, avatar_url text, conversation_source jsonb,
          conversation_hash text, message_source jsonb, message_hash text,
          notification_source jsonb, notification_hash text
        )
      `, [recordsJson, actor.uid, body]);
      await client.query(`
        INSERT INTO notifications
          (id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash)
        SELECT 'message:' || item.message_id || ':' || item.recipient_id,
          item.recipient_id, item.recipient_id, $4, $4, 'message', $2, $3,
          '/dashboard/messages?convoId=' || item.conversation_id,
          item.notification_source, item.notification_source, item.notification_hash
        FROM jsonb_to_recordset($1::jsonb) AS item(
          conversation_id text, message_id text, recipient_id text,
          recipient_name text, avatar_url text, conversation_source jsonb,
          conversation_hash text, message_source jsonb, message_hash text,
          notification_source jsonb, notification_hash text
        )
      `, [recordsJson, input.subject, input.body.slice(0, 240), actor.uid]);
      await writeAuditLog(client, request, actor.uid, 'conversation.broadcast', 'conversation', undefined, {
        recipientCount: records.length,
        conversationIds: records.map((record) => record.conversation_id),
      });

      return records.map((record) => record.conversation_id);
    });

    return jsonOk({ sent: result.length, conversationIds: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
