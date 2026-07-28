import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { sourceHash } from '@/lib/messages-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const companyRoles = new Set<'company'>(['company']);
const inputSchema = z.object({
  message: z.string().trim().min(20).max(4_000),
}).strict();

type TalentRow = { id: string; name: string };

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    const { id } = await context.params;
    const input = inputSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'talent-contact', 20, 24 * 60 * 60, actor.uid);
    await enforceRateLimitSubject('talent-contact-account', 20, 24 * 60 * 60, actor.uid);

    const result = await transaction(async (client) => {
      const talentResult = await client.query<TalentRow>(`
        SELECT graduate.id, graduate.name
        FROM talent_profiles profile
        JOIN users graduate ON graduate.id = profile.user_id
        WHERE graduate.id = $1
          AND graduate.role = 'graduate'
          AND graduate.status = 'active'
          AND graduate.deleted_at IS NULL
          AND graduate.email_verified_at IS NOT NULL
          AND profile.visibility_consent = true
          AND profile.consented_at IS NOT NULL
          AND profile.withdrawn_at IS NULL
        FOR SHARE OF profile, graduate
      `, [id]);
      const talent = talentResult.rows[0];
      if (!talent) throw new ApiError(404, 'talent_not_found', 'Ce profil n’est plus visible.');

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
      `, [actor.uid, id]);
      if (prior.rows[0]) {
        const conversationId = prior.rows[0].conversation_id;
        const messageId = randomUUID();
        const messageSource = { origin: 'render', conversationId, senderId: actor.uid };
        const notificationSource = { origin: 'render', conversationId, messageId, recipientId: id };
        await client.query(`
          INSERT INTO messages (
            id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at
          ) VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, now())
        `, [
          messageId,
          conversationId,
          actor.uid,
          input.message,
          JSON.stringify(messageSource),
          sourceHash(messageSource),
        ]);
        await client.query(`
          UPDATE conversations
          SET last_message = $2, last_message_at = now()
          WHERE id = $1
        `, [conversationId, input.message]);
        await client.query(`
          UPDATE conversation_participants
          SET unread_count = unread_count + 1
          WHERE conversation_id = $1 AND user_id = $2
        `, [conversationId, id]);
        await client.query(`
          INSERT INTO notifications (
            id, user_id, recipient_ref, created_by, actor_ref, type,
            title, body, link, payload, source_payload, source_hash
          ) VALUES (
            $1, $2, $2, $3, $3, 'message', 'Nouveau message',
            $4, $5, $6::jsonb, $6::jsonb, $7
          )
        `, [
          `message:${messageId}:${id}`,
          id,
          actor.uid,
          input.message.slice(0, 240),
          `/dashboard/messages?convoId=${encodeURIComponent(conversationId)}`,
          JSON.stringify(notificationSource),
          sourceHash(notificationSource),
        ]);
        await client.query(`
          INSERT INTO talent_contact_log (organization_id, graduate_id, conversation_id, outcome)
          VALUES ($1, $2, $3, 'conversation_reused')
        `, [actor.uid, id, conversationId]);
        await client.query(`
          INSERT INTO talent_shortlists (organization_id, graduate_id, status)
          VALUES ($1, $2, 'contacted')
          ON CONFLICT (organization_id, graduate_id) DO UPDATE SET status = 'contacted'
        `, [actor.uid, id]);
        await writeAuditLog(client, request, actor.uid, 'talent_contact.reuse', 'user', id, {
          conversationId,
          messageId,
        });
        return { conversationId, created: false };
      }

      const recent = await client.query<{ count: number | string }>(`
        SELECT count(*)::integer AS count
        FROM talent_contact_log
        WHERE organization_id = $1
          AND outcome = 'conversation_created'
          AND created_at > now() - interval '24 hours'
      `, [actor.uid]);
      if (Number(recent.rows[0]?.count || 0) >= 20) {
        throw new ApiError(
          429,
          'talent_contact_limit',
          'Vous avez atteint la limite de 20 nouvelles prises de contact sur 24 heures. Reprenez les échanges existants ou réessayez plus tard.',
        );
      }

      const conversationId = randomUUID();
      const messageId = randomUUID();
      const notificationId = `message:${messageId}:${id}`;
      const conversationSource = { origin: 'render', createdBy: actor.uid, purpose: 'consented_talent_contact' };
      const messageSource = { origin: 'render', conversationId, senderId: actor.uid };
      const notificationSource = { origin: 'render', conversationId, messageId, recipientId: id };
      const organizationName = actor.companyName || actor.name || 'Entreprise Yahnu';

      await client.query(`
        INSERT INTO conversations (
          id, name, last_message, last_message_at, source_payload, source_hash
        ) VALUES ($1, $2, $3, now(), $4::jsonb, $5)
      `, [
        conversationId,
        `Échange avec ${organizationName}`,
        input.message,
        JSON.stringify(conversationSource),
        sourceHash(conversationSource),
      ]);
      await client.query(`
        INSERT INTO conversation_participants (
          conversation_id, participant_ref, user_id, display_name, unread_count, last_read_at
        ) VALUES
          ($1, $2, $2, $3, 0, now()),
          ($1, $4, $4, $5, 1, NULL)
      `, [conversationId, actor.uid, organizationName, id, talent.name]);
      await client.query(`
        INSERT INTO messages (
          id, conversation_id, sender_id, sender_ref, body, source_payload, source_hash, sent_at
        ) VALUES ($1, $2, $3, $3, $4, $5::jsonb, $6, now())
      `, [
        messageId,
        conversationId,
        actor.uid,
        input.message,
        JSON.stringify(messageSource),
        sourceHash(messageSource),
      ]);
      await client.query(`
        INSERT INTO notifications (
          id, user_id, recipient_ref, created_by, actor_ref, type,
          title, body, link, payload, source_payload, source_hash
        ) VALUES (
          $1, $2, $2, $3, $3, 'message', 'Nouveau message',
          $4, $5, $6::jsonb, $6::jsonb, $7
        )
      `, [
        notificationId,
        id,
        actor.uid,
        input.message.slice(0, 240),
        `/dashboard/messages?convoId=${encodeURIComponent(conversationId)}`,
        JSON.stringify(notificationSource),
        sourceHash(notificationSource),
      ]);
      await client.query(`
        INSERT INTO talent_contact_log (organization_id, graduate_id, conversation_id, outcome)
        VALUES ($1, $2, $3, 'conversation_created')
      `, [actor.uid, id, conversationId]);
      await client.query(`
        INSERT INTO talent_shortlists (organization_id, graduate_id, status)
        VALUES ($1, $2, 'contacted')
        ON CONFLICT (organization_id, graduate_id) DO UPDATE SET status = 'contacted'
      `, [actor.uid, id]);
      await writeAuditLog(client, request, actor.uid, 'talent_contact.create', 'user', id, {
        conversationId,
      });
      return { conversationId, created: true };
    });

    return jsonOk({ conversation: { id: result.conversationId }, created: result.created }, {
      status: result.created ? 201 : 200,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
