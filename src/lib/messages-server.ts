import 'server-only';

import { createHash } from 'node:crypto';
import type { PoolClient, QueryResultRow } from 'pg';

import type { Role } from '@/lib/auth-types';
import type { ConversationMessage, ConversationSummary, MessageParticipant } from '@/lib/messages';
import { ApiError } from '@/lib/server/http';

export const messagingRoles: ReadonlySet<Role> = new Set([
  'graduate', 'company', 'school', 'admin', 'super_admin', 'support_staff',
]);

type DbClient = Pick<PoolClient, 'query'>;

type ConversationRow = QueryResultRow & {
  id: string;
  name: string;
  avatar_url: string | null;
  last_message: string;
  last_message_at: Date | string;
  ticket_id: string | null;
  unread_count: number | string;
  participants: MessageParticipant[] | string;
};

type MessageRow = QueryResultRow & {
  id: string;
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: Date | string;
  attachment_asset_id: string | null;
  attachment_name: string | null;
};

function parseParticipants(value: ConversationRow['participants']): MessageParticipant[] {
  const parsed = typeof value === 'string' ? JSON.parse(value) as unknown : value;
  if (!Array.isArray(parsed)) return [];
  return parsed.map((participant) => ({
    id: String(participant.id),
    name: String(participant.name || 'Utilisateur Yahnu'),
    role: participant.role,
    avatarUrl: participant.avatarUrl ? String(participant.avatarUrl) : null,
  }));
}

export function serializeConversation(row: ConversationRow, viewerId: string): ConversationSummary {
  const participants = parseParticipants(row.participants);
  const counterpart = participants.length === 2
    ? participants.find((participant) => participant.id !== viewerId)
    : undefined;

  return {
    id: row.id,
    name: counterpart?.name || row.name || 'Conversation Yahnu',
    avatarUrl: counterpart?.avatarUrl || row.avatar_url,
    lastMessage: row.last_message || '',
    lastMessageAt: new Date(row.last_message_at).toISOString(),
    unreadCount: Number(row.unread_count || 0),
    ticketId: row.ticket_id,
    participants,
  };
}

export function serializeMessage(row: MessageRow): ConversationMessage {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name || 'Utilisateur Yahnu',
    body: row.body,
    createdAt: new Date(row.created_at).toISOString(),
    attachmentUrl: row.attachment_asset_id ? `/api/private-media/${encodeURIComponent(row.attachment_asset_id)}` : null,
    attachmentName: row.attachment_name,
  };
}

export function sourceHash(value: unknown) {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex');
}

export async function listConversations(
  client: DbClient,
  viewerId: string,
  limit: number,
  conversationId?: string,
  offset = 0,
) {
  const values: unknown[] = [viewerId, limit, Math.max(0, Math.trunc(offset))];
  const idFilter = conversationId ? 'AND c.id = $4' : '';
  if (conversationId) values.push(conversationId);

  const result = await client.query<ConversationRow>(`
    SELECT c.id, c.name, c.avatar_url, COALESCE(c.last_message, '') AS last_message,
      COALESCE(c.last_message_at, c.updated_at, c.created_at) AS last_message_at,
      c.ticket_id, mine.unread_count,
      COALESCE(
        jsonb_agg(
          jsonb_build_object(
            'id', COALESCE(u.id, p.participant_ref),
            'name', COALESCE(u.name, p.display_name, p.participant_ref, 'Utilisateur Yahnu'),
            'role', COALESCE(u.role, 'graduate'),
            'avatarUrl', COALESCE(
              u.profile->>'avatarUrl',
              u.profile->>'photoURL',
              u.profile->>'avatar'
            )
          ) ORDER BY p.joined_at, u.id
        ),
        '[]'::jsonb
      ) AS participants
    FROM conversations c
    JOIN conversation_participants mine
      ON mine.conversation_id = c.id AND mine.user_id = $1
    JOIN conversation_participants p ON p.conversation_id = c.id
    LEFT JOIN users u ON u.id = p.user_id AND u.deleted_at IS NULL
    WHERE true ${idFilter}
    GROUP BY c.id, mine.unread_count
    ORDER BY COALESCE(c.last_message_at, c.updated_at, c.created_at) DESC, c.id DESC
    LIMIT $2
    OFFSET $3
  `, values);

  return result.rows.map((row) => serializeConversation(row, viewerId));
}

export async function requireConversationMembership(
  client: DbClient,
  conversationId: string,
  userId: string,
  lock = false,
) {
  const result = await client.query<{ unread_count: number | string }>(`
    SELECT unread_count
    FROM conversation_participants
    WHERE conversation_id = $1 AND user_id = $2
    ${lock ? 'FOR UPDATE' : ''}
  `, [conversationId, userId]);
  if (!result.rows[0]) {
    throw new ApiError(404, 'conversation_not_found', 'Conversation introuvable.');
  }
  return result.rows[0];
}

export async function lockConversationForMember(client: DbClient, conversationId: string, userId: string) {
  const result = await client.query<{ id: string }>(`
    SELECT c.id
    FROM conversations c
    JOIN conversation_participants p
      ON p.conversation_id = c.id AND p.user_id = $2
    WHERE c.id = $1
    FOR UPDATE OF c
  `, [conversationId, userId]);
  if (!result.rows[0]) {
    throw new ApiError(404, 'conversation_not_found', 'Conversation introuvable.');
  }
  return result.rows[0];
}

export async function listMessages(client: DbClient, conversationId: string, limit: number, offset = 0) {
  const result = await client.query<MessageRow>(`
    SELECT recent.id, COALESCE(recent.sender_id, recent.sender_ref, 'unknown') AS sender_id,
      COALESCE(u.name, recent.sender_ref, 'Utilisateur Yahnu') AS sender_name,
      recent.body, recent.sent_at AS created_at, recent.attachment_asset_id,
      asset.original_filename AS attachment_name
    FROM (
      SELECT id, sender_id, sender_ref, body, sent_at, attachment_asset_id
      FROM messages
      WHERE conversation_id = $1
      ORDER BY sent_at DESC, id DESC
      LIMIT $2
      OFFSET $3
    ) recent
    LEFT JOIN users u ON u.id = recent.sender_id
    LEFT JOIN media_assets asset ON asset.id = recent.attachment_asset_id AND asset.is_public = false
    ORDER BY recent.sent_at ASC, recent.id ASC
  `, [conversationId, limit, Math.max(0, Math.trunc(offset))]);
  return result.rows.map(serializeMessage);
}
