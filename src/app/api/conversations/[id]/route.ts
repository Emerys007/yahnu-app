import { z } from 'zod';

import { listConversations, listMessages, messagingRoles, requireConversationMembership } from '@/lib/messages-server';
import { requireUser } from '@/lib/server/auth';
import { getPool, transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const idSchema = z.string().trim().min(1).max(240);
const getSchema = z.object({
  messageLimit: z.coerce.number().int().min(1).max(500).default(250),
  messageOffset: z.coerce.number().int().min(0).max(1_000_000).default(0),
});
const readSchema = z.object({ read: z.literal(true).default(true) }).strict();

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const user = await requireUser(messagingRoles);
    const id = idSchema.parse((await context.params).id);
    const { messageLimit, messageOffset } = getSchema.parse({
      messageLimit: new URL(request.url).searchParams.get('messageLimit') ?? undefined,
      messageOffset: new URL(request.url).searchParams.get('messageOffset') ?? undefined,
    });
    const pool = getPool();
    await requireConversationMembership(pool, id, user.uid);
    const [conversation] = await listConversations(pool, user.uid, 1, id);
    const messagePage = await listMessages(pool, id, messageLimit + 1, messageOffset);
    const hasMoreMessages = messagePage.length > messageLimit;
    const messages = hasMoreMessages ? messagePage.slice(1) : messagePage;
    return jsonOk({ conversation: { ...conversation, messages, hasMoreMessages } });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(messagingRoles);
    const id = idSchema.parse((await context.params).id);
    readSchema.parse(await readJson(request));

    await transaction(async (client) => {
      await requireConversationMembership(client, id, user.uid, true);
      await client.query(`
        UPDATE conversation_participants
        SET unread_count = 0, last_read_at = now()
        WHERE conversation_id = $1 AND user_id = $2
      `, [id, user.uid]);
    });
    return jsonOk({ conversation: { id, unreadCount: 0 } });
  } catch (error) {
    return handleApiError(error);
  }
}
