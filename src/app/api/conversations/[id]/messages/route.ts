import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { lockConversationForMember, messagingRoles, sourceHash } from '@/lib/messages-server';
import { requireUser } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const idSchema = z.string().trim().min(1).max(240);
const messageSchema = z.object({
  body: z.string().trim().min(1).max(10_000),
}).strict();

type MessageRow = {
  id: string;
  sender_id: string;
  body: string;
  created_at: Date | string;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(messagingRoles);
    const conversationId = idSchema.parse((await context.params).id);
    const input = messageSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'conversation-message', 90, 60, actor.uid);

    const message = await transaction(async (client) => {
      await lockConversationForMember(client, conversationId, actor.uid);
      const messageId = randomUUID();
      const messageSource = { origin: 'render', conversationId, senderId: actor.uid };
      const inserted = await client.query<MessageRow>(`
        INSERT INTO messages
          (id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at)
        VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, now())
        RETURNING id, sender_id, body, sent_at AS created_at
      `, [messageId, conversationId, actor.uid, input.body, JSON.stringify(messageSource), sourceHash(messageSource)]);
      await client.query(`
        UPDATE conversations
        SET last_message = $1, last_message_at = clock_timestamp()
        WHERE id = $2
      `, [input.body, conversationId]);
      await client.query(`
        UPDATE conversation_participants
        SET unread_count = CASE WHEN user_id = $2 THEN 0 ELSE unread_count + 1 END,
          last_read_at = CASE WHEN user_id = $2 THEN now() ELSE last_read_at END
        WHERE conversation_id = $1
      `, [conversationId, actor.uid]);
      const recipientResult = await client.query<{ user_id: string }>(`
        SELECT user_id
        FROM conversation_participants
        WHERE conversation_id = $1 AND user_id IS NOT NULL AND user_id <> $2
      `, [conversationId, actor.uid]);
      const notificationRecords = recipientResult.rows.map(({ user_id: recipientId }) => {
        const source = { origin: 'render', conversationId, messageId, recipientId };
        return {
          id: `message:${messageId}:${recipientId}`,
          recipient_id: recipientId,
          source,
          source_hash: sourceHash(source),
        };
      });
      await client.query(`
        INSERT INTO notifications
          (id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash)
        SELECT notification.id, notification.recipient_id, notification.recipient_id,
          $2, $2, 'message', $3, $4,
          '/dashboard/messages?convoId=' || $5,
          notification.source, notification.source, notification.source_hash
        FROM jsonb_to_recordset($1::jsonb) AS notification(
          id text, recipient_id text, source jsonb, source_hash text
        )
      `, [
        JSON.stringify(notificationRecords),
        actor.uid,
        `Nouveau message de ${actor.name || 'Yahnu'}`,
        input.body.slice(0, 240),
        conversationId,
      ]);
      return inserted.rows[0];
    });

    return jsonOk({
      message: {
        id: message.id,
        senderId: message.sender_id,
        senderName: actor.name || 'Utilisateur Yahnu',
        body: message.body,
        createdAt: new Date(message.created_at).toISOString(),
        attachmentUrl: null,
        attachmentName: null,
      },
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
