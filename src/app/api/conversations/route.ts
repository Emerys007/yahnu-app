import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { listConversations, messagingRoles, sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { getPool, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

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
  talent_visible: boolean;
  applicant_relationship: boolean;
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
    await enforceRateLimitSubject('conversation-create-account', 20, 60 * 60, actor.uid);

    const created = await transaction(async (client) => {
      const recipientsResult = await client.query<RecipientRow>(`
        SELECT u.id, u.name, u.role, u.school_id,
          (
            talent.visibility_consent = true
            AND talent.consented_at IS NOT NULL
            AND talent.withdrawn_at IS NULL
          ) AS talent_visible,
          EXISTS (
            SELECT 1
            FROM applications application
            JOIN jobs job ON job.id = application.job_id
            WHERE application.applicant_id = u.id
              AND job.company_id = $2
              AND application.status <> 'withdrawn'
          ) AS applicant_relationship
        FROM users u
        LEFT JOIN talent_profiles talent ON talent.user_id = u.id
        WHERE u.id = ANY($1::text[])
          AND u.deleted_at IS NULL
          AND u.status = 'active'
        FOR SHARE OF u
      `, [recipientIds, actor.uid]);
      if (recipientsResult.rows.length !== recipientIds.length) {
        throw new ApiError(422, 'invalid_recipients', 'Un ou plusieurs destinataires ne sont pas disponibles.');
      }
      const recipient = recipientsResult.rows[0];
      if (actor.role === 'company' && recipient.role === 'graduate' && !recipient.applicant_relationship) {
        const lockedConsent = await client.query<{ visible: boolean }>(`
          SELECT (
            visibility_consent = true
            AND consented_at IS NOT NULL
            AND withdrawn_at IS NULL
          ) AS visible
          FROM talent_profiles
          WHERE user_id = $1
          FOR SHARE
        `, [recipient.id]);
        recipient.talent_visible = lockedConsent.rows[0]?.visible === true;
      }
      const supportCanContact = actor.role === 'admin' || actor.role === 'super_admin' || actor.role === 'support_staff';
      const relationshipAllowsContact = supportCanContact
        || (actor.role === 'school' && recipient.role === 'graduate' && recipient.school_id === actor.uid)
        || (actor.role === 'graduate' && recipient.role === 'school' && recipient.id === actor.schoolId)
        || (
          actor.role === 'company'
          && recipient.role === 'graduate'
          && (recipient.talent_visible || recipient.applicant_relationship)
        );
      if (!relationshipAllowsContact) {
        throw new ApiError(403, 'recipient_forbidden', 'Vous ne pouvez pas démarrer une conversation avec ce destinataire.');
      }
      const consentedTalentContact = actor.role === 'company'
        && recipient.role === 'graduate'
        && recipient.talent_visible
        && !recipient.applicant_relationship;
      if (consentedTalentContact) {
        const prior = await client.query<{ conversation_id: string }>(`
          SELECT log.conversation_id
          FROM talent_contact_log log
          JOIN conversation_participants company_participant
            ON company_participant.conversation_id = log.conversation_id
            AND company_participant.user_id = $1
          JOIN conversation_participants graduate_participant
            ON graduate_participant.conversation_id = log.conversation_id
            AND graduate_participant.user_id = $2
          WHERE log.organization_id = $1
            AND log.graduate_id = $2
            AND log.conversation_id IS NOT NULL
          ORDER BY log.created_at DESC
          LIMIT 1
        `, [actor.uid, recipient.id]);
        if (prior.rows[0]) {
          const conversationId = prior.rows[0].conversation_id;
          const messageId = randomUUID();
          const messageSource = { origin: 'render', conversationId, senderId: actor.uid };
          const notificationSource = {
            origin: 'render',
            conversationId,
            messageId,
            recipientId: recipient.id,
          };
          await client.query(`
            INSERT INTO messages
              (id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at)
            VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, now())
          `, [
            messageId,
            conversationId,
            actor.uid,
            input.initialMessage,
            JSON.stringify(messageSource),
            sourceHash(messageSource),
          ]);
          await client.query(`
            UPDATE conversations
            SET last_message = $2, last_message_at = now()
            WHERE id = $1
          `, [conversationId, input.initialMessage]);
          await client.query(`
            UPDATE conversation_participants
            SET unread_count = unread_count + 1
            WHERE conversation_id = $1 AND user_id = $2
          `, [conversationId, recipient.id]);
          await client.query(`
            INSERT INTO notifications (
              id, user_id, recipient_ref, created_by, actor_ref, type,
              title, body, link, payload, source_payload, source_hash
            ) VALUES (
              $1, $2, $2, $3, $3, 'message', 'Nouveau message',
              $4, $5, $6::jsonb, $6::jsonb, $7
            )
          `, [
            `message:${messageId}:${recipient.id}`,
            recipient.id,
            actor.uid,
            input.initialMessage.slice(0, 240),
            `/dashboard/messages?convoId=${encodeURIComponent(conversationId)}`,
            JSON.stringify(notificationSource),
            sourceHash(notificationSource),
          ]);
          await client.query(`
            INSERT INTO talent_contact_log (organization_id, graduate_id, conversation_id, outcome)
            VALUES ($1, $2, $3, 'conversation_reused')
          `, [actor.uid, recipient.id, conversationId]);
          await client.query(`
            INSERT INTO talent_shortlists (organization_id, graduate_id, status)
            VALUES ($1, $2, 'contacted')
            ON CONFLICT (organization_id, graduate_id) DO UPDATE SET status = 'contacted'
          `, [actor.uid, recipient.id]);
          await writeAuditLog(client, request, actor.uid, 'conversation.reuse', 'conversation', conversationId, {
            recipientId: recipient.id,
            consentedTalentContact: true,
          });
          return { id: conversationId, created: false };
        }
        const recentContacts = await client.query<{ count: number | string }>(`
          SELECT count(*)::integer AS count
          FROM talent_contact_log
          WHERE organization_id = $1
            AND outcome = 'conversation_created'
            AND created_at > now() - interval '24 hours'
        `, [actor.uid]);
        if (Number(recentContacts.rows[0]?.count || 0) >= 20) {
          throw new ApiError(
            429,
            'talent_contact_limit',
            'Vous avez atteint la limite de 20 nouvelles prises de contact sur 24 heures.',
          );
        }
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
      if (consentedTalentContact) {
        await client.query(`
          INSERT INTO talent_contact_log (organization_id, graduate_id, conversation_id, outcome)
          VALUES ($1, $2, $3, 'conversation_created')
        `, [actor.uid, recipient.id, conversationId]);
        await client.query(`
          INSERT INTO talent_shortlists (organization_id, graduate_id, status)
          VALUES ($1, $2, 'contacted')
          ON CONFLICT (organization_id, graduate_id) DO UPDATE SET status = 'contacted'
        `, [actor.uid, recipient.id]);
      }
      await writeAuditLog(client, request, actor.uid, 'conversation.create', 'conversation', conversationId, {
        recipientCount: recipientIds.length,
        consentedTalentContact,
      });

      return { id: conversationId, created: true };
    });

    return jsonOk({ conversation: { id: created.id }, created: created.created }, {
      status: created.created ? 201 : 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
