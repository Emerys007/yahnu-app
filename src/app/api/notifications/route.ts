import type { PoolClient } from 'pg';
import { z } from 'zod';

import { adminRoles } from '@/lib/auth-types';
import { sourceHash } from '@/lib/messages-server';
import { requireUser } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

const readSchema = z.object({
  ids: z.array(z.string().trim().min(1).max(500)).min(1).max(100),
}).strict();

type NotificationRow = {
  id: string;
  type: string;
  title: string | null;
  body: string;
  link: string | null;
  payload: Record<string, unknown> | string | null;
  created_at: Date | string;
  read_at: Date | string | null;
};

type PendingUserRow = {
  id: string;
  name: string;
  role: string;
  created_at: Date | string;
};

type SupportTicketRow = {
  id: string;
  user_id: string;
  user_name: string;
  subject: string | null;
  submitted_at: Date | string;
};

type DerivedNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  link: string;
  source: Record<string, unknown>;
  source_hash: string;
  created_at: string;
};

function parsePayload(value: NotificationRow['payload']) {
  if (!value) return {};
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as Record<string, unknown>;
    } catch {
      return {};
    }
  }
  return value;
}

function safeLocalLink(value: string | null) {
  if (!value || value.length > 2_048) return null;
  try {
    const base = new URL('https://yahnu.local');
    const parsed = new URL(value, base);
    if (parsed.origin !== base.origin || !parsed.pathname.startsWith('/')) return null;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return null;
  }
}

function derivedNotification(input: Omit<DerivedNotification, 'source_hash' | 'created_at'> & { createdAt: Date | string }) {
  return {
    ...input,
    source_hash: sourceHash(input.source),
    created_at: new Date(input.createdAt).toISOString(),
  };
}

async function syncDerivedNotifications(
  client: Pick<PoolClient, 'query'>,
  userId: string,
  idPrefix: string,
  notifications: DerivedNotification[],
) {
  await client.query(`
    DELETE FROM notifications
    WHERE user_id = $1
      AND left(id, char_length($2)) = $2
      AND NOT (id = ANY($3::text[]))
  `, [userId, idPrefix, notifications.map((notification) => notification.id)]);
  if (notifications.length === 0) return;
  await client.query(`
    INSERT INTO notifications
      (id, user_id, recipient_ref, type, title, body, link,
        payload, source_payload, source_hash, created_at)
    SELECT item.id, $2, $2, item.type, item.title, item.body, item.link,
      item.source, item.source, item.source_hash, item.created_at
    FROM jsonb_to_recordset($1::jsonb) AS item(
      id text, type text, title text, body text, link text,
      source jsonb, source_hash text, created_at timestamptz
    )
    ON CONFLICT (id) DO UPDATE SET
      title = EXCLUDED.title,
      body = EXCLUDED.body,
      link = EXCLUDED.link,
      payload = EXCLUDED.payload,
      source_payload = EXCLUDED.source_payload,
      source_hash = EXCLUDED.source_hash
  `, [JSON.stringify(notifications), userId]);
}

export async function GET(request: Request) {
  try {
    const user = await requireUser();
    const { limit } = listSchema.parse({
      limit: new URL(request.url).searchParams.get('limit') ?? undefined,
    });

    const notifications = await transaction(async (client) => {
      let derived: DerivedNotification[] = [];
      let derivedPrefix: string | null = null;

      if (adminRoles.has(user.role)) {
        derivedPrefix = `derived:pending-user:${user.uid}:`;
        const pending = await client.query<PendingUserRow>(`
          SELECT id, name, role, created_at
          FROM users
          WHERE deleted_at IS NULL AND status = 'pending' AND role = ANY($1::text[])
          ORDER BY created_at DESC, id DESC
          LIMIT 50
        `, [['company', 'school']]);
        derived = pending.rows.map((row) => {
          const source = { origin: 'derived', kind: 'pending_user', userId: row.id, role: row.role };
          return derivedNotification({
            id: `derived:pending-user:${user.uid}:${row.id}`,
            type: 'pending_user',
            title: row.role === 'company' ? 'Nouvelle entreprise' : 'Nouvelle école',
            body: `${row.name} attend votre approbation.`,
            link: '/dashboard/admin/user-management',
            source,
            createdAt: row.created_at,
          });
        });
      } else if (user.role === 'school') {
        derivedPrefix = `derived:pending-graduate:${user.uid}:`;
        const pending = await client.query<PendingUserRow>(`
          SELECT id, name, role, created_at
          FROM users
          WHERE deleted_at IS NULL AND status = 'pending'
            AND role = 'graduate' AND school_id = $1
          ORDER BY created_at DESC, id DESC
          LIMIT 50
        `, [user.uid]);
        derived = pending.rows.map((row) => {
          const source = { origin: 'derived', kind: 'pending_graduate', userId: row.id };
          return derivedNotification({
            id: `derived:pending-graduate:${user.uid}:${row.id}`,
            type: 'pending_graduate',
            title: 'Nouveau diplômé',
            body: `${row.name} attend son activation.`,
            link: '/dashboard/graduates',
            source,
            createdAt: row.created_at,
          });
        });
      } else if (user.role === 'support_staff') {
        derivedPrefix = `derived:support-ticket:${user.uid}:`;
        const pending = await client.query<SupportTicketRow>(`
          SELECT t.id, t.user_id, u.name AS user_name, t.subject, t.submitted_at
          FROM tickets t
          JOIN users u ON u.id = t.user_id AND u.deleted_at IS NULL
          WHERE t.type = 'support' AND t.status IN ('open', 'in_progress')
          ORDER BY t.submitted_at DESC, t.id DESC
          LIMIT 50
        `);
        derived = pending.rows.map((row) => {
          const source = { origin: 'derived', kind: 'support_ticket', ticketId: row.id, userId: row.user_id };
          return derivedNotification({
            id: `derived:support-ticket:${user.uid}:${row.id}`,
            type: 'support_ticket',
            title: 'Nouveau ticket de support',
            body: `${row.user_name} : ${row.subject || 'Demande de support'}`,
            link: `/dashboard/messages?ticketId=${encodeURIComponent(row.id)}`,
            source,
            createdAt: row.submitted_at,
          });
        });
      }

      if (derivedPrefix) await syncDerivedNotifications(client, user.uid, derivedPrefix, derived);
      const result = await client.query<NotificationRow>(`
        SELECT n.id, n.type, n.title, n.body, n.link,
          n.payload, n.created_at, r.read_at
        FROM notifications n
        LEFT JOIN notification_receipts r
          ON r.notification_id = n.id AND r.user_id = $1
        WHERE (
          n.user_id = $1
          OR n.target_role = $2
          OR n.is_global = true
        )
          AND (n.expires_at IS NULL OR n.expires_at > now())
          AND (r.dismissed_at IS NULL)
        ORDER BY n.created_at DESC, n.id DESC
        LIMIT $3
      `, [user.uid, user.role, limit]);
      return result.rows;
    });

    return jsonOk({
      notifications: notifications.map((notification) => ({
        id: notification.id,
        type: notification.type,
        title: notification.title || 'Notification Yahnu',
        body: notification.body,
        link: safeLocalLink(notification.link),
        payload: parsePayload(notification.payload),
        createdAt: new Date(notification.created_at).toISOString(),
        read: Boolean(notification.read_at),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request) {
  try {
    assertSameOrigin(request);
    const user = await requireUser();
    const input = readSchema.parse(await readJson(request));
    const ids = [...new Set(input.ids)];

    const result = await transaction(async (client) => client.query<{ notification_id: string }>(`
      INSERT INTO notification_receipts (notification_id, user_id, delivered_at, read_at)
      SELECT n.id, $1, now(), now()
      FROM notifications n
      WHERE n.id = ANY($2::text[])
        AND (
          n.user_id = $1
          OR n.target_role = $3
          OR n.is_global = true
        )
      ON CONFLICT (notification_id, user_id) DO UPDATE
        SET delivered_at = COALESCE(notification_receipts.delivered_at, EXCLUDED.delivered_at),
          read_at = COALESCE(notification_receipts.read_at, EXCLUDED.read_at)
      RETURNING notification_id
    `, [user.uid, ids, user.role]));

    return jsonOk({ readIds: result.rows.map((row) => row.notification_id) });
  } catch (error) {
    return handleApiError(error);
  }
}
