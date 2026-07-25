import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { listConversations, messagingRoles, sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { getPool, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

const createSchema = z.object({
  recipientIds: z.array(z.string().trim().min(1).max(200)).length(1),
  name: z.string().trim().min(1).max(160).optional(),
  initialMessage: z.string().trim().min(1).max(10_000),
}).strict();

type RecipientRow = {
  id: string;
  name: string;
  role: string;
  school_id: string | null;
};

export async function GET(request: Request) {
  try {
    const user = await requireUser(messagingRoles);
    const { limit, offset } = listSchema.parse({
      limit: new URL(request.url).searchParams.get('limit') ?? undefined,
      offset: new URL(request.url).searchParams.get('offset') ?? undefined,
    });
    const conversations = await listConversations(getPool(), user.uid, limit + 1, undefined, offset);
    return jsonOk({ conversations: conversations.slice(0, limit), hasMore: conversations.length > limit });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(messagingRoles);
    const input = createSchema.parse(await readJson(request));
    const recipientIds = [...new Set(input.recipientIds)].filter((id) => id !== actor.uid);
    if (recipientIds.length === 0) {
      throw new ApiError(422, 'recipient_required', 'Sélectionnez au moins un destinataire.');
    }
    await enforceRateLimit(request, 'conversation-create', 20, 60 * 60, actor.uid);

    const created = await transaction(async (client) => {
      const recipientsResult = await client.query<RecipientRow>(`
        SELECT id, name, role, school_id
        FROM users
        WHERE id = ANY($1::text[])
          AND deleted_at IS NULL
          AND status = 'active'
        FOR SHARE
      `, [recipientIds]);
      if (recipientsResult.rows.length !== recipientIds.length) {
        throw new ApiError(422, 'invalid_recipients', 'Un ou plusieurs destinataires ne sont pas disponibles.');
      }
      const recipient = recipientsResult.rows[0];
      const supportCanContact = actor.role === 'admin' || actor.role === 'super_admin' || actor.role === 'support_staff';
      const relationshipAllowsContact = supportCanContact
        || (actor.role === 'school' && recipient.role === 'graduate' && recipient.school_id === actor.uid)
        || (actor.role === 'graduate' && recipient.role === 'school' && recipient.id === actor.schoolId)
        || (actor.role === 'company' && recipient.role === 'graduate');
      if (!relationshipAllowsContact) {
        throw new ApiError(403, 'recipient_forbidden', 'Vous ne pouvez pas démarrer une conversation avec ce destinataire.');
      }
      const conversationId = randomUUID();
      const messageId = randomUUID();
      const name = input.name || recipient.name;
      const avatarUrl = null;
      const conversationSource = { origin: 'render', createdBy: actor.uid };
      const messageSource = { origin: 'render', conversationId, senderId: actor.uid };
      const participants = [
        { id: actor.uid, name: actor.name || 'Yahnu', unread: 0 },
        ...recipientsResult.rows.map((recipient) => ({ id: recipient.id, name: recipient.name, unread: 1 })),
      ];
      const notifications = recipientIds.map((recipientId) => {
        const source = { origin: 'render', conversationId, messageId, recipientId };
        return {
          id: `message:${messageId}:${recipientId}`,
          recipient_id: recipientId,
          source,
          source_hash: sourceHash(source),
        };
      });

      await client.query(`
        INSERT INTO conversations
          (id, name, avatar_url, last_message, last_message_at, source_payload, source_hash)
        VALUES ($1, $2, $3, $4, now(), $5::jsonb, $6)
      `, [conversationId, name, avatarUrl, input.initialMessage, JSON.stringify(conversationSource), sourceHash(conversationSource)]);
      await client.query(`
        INSERT INTO conversation_participants
          (conversation_id, participant_ref, user_id, display_name, unread_count, last_read_at)
        SELECT $1, participant.id, participant.id, participant.name, participant.unread,
          CASE WHEN participant.unread = 0 THEN now() ELSE NULL END
        FROM jsonb_to_recordset($2::jsonb) AS participant(id text, name text, unread integer)
      `, [conversationId, JSON.stringify(participants)]);
      await client.query(`
        INSERT INTO messages
          (id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at)
        VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, now())
      `, [messageId, conversationId, actor.uid, input.initialMessage, JSON.stringify(messageSource), sourceHash(messageSource)]);
      await client.query(`
        INSERT INTO notifications
          (id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash)
        SELECT notification.id, notification.recipient_id, notification.recipient_id,
          $2, $2, 'message', 'Nouveau message', $3,
          '/dashboard/messages?convoId=' || $4,
          notification.source, notification.source, notification.source_hash
        FROM jsonb_to_recordset($1::jsonb) AS notification(
          id text, recipient_id text, source jsonb, source_hash text
        )
      `, [JSON.stringify(notifications), actor.uid, input.initialMessage.slice(0, 240), conversationId]);
      await writeAuditLog(client, request, actor.uid, 'conversation.create', 'conversation', conversationId, {
        recipientCount: recipientIds.length,
      });

      return { id: conversationId };
    });

    return jsonOk({ conversation: created }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
