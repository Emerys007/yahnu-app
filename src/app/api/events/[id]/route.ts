import { z } from 'zod';

import { safeHttpsUrl } from '@/lib/role-workspaces';
import { serializeCareerEvent, type CareerEventRow } from '@/lib/server/role-workspaces';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const organizerRoles = new Set<'company' | 'school'>(['company', 'school']);
const updateSchema = z.object({
  title: z.string().trim().min(3).max(180).optional(),
  description: z.string().trim().min(20).max(12_000).optional(),
  eventFormat: z.enum(['onsite', 'online', 'hybrid']).optional(),
  location: z.string().trim().max(240).nullable().optional(),
  onlineUrl: z.string().trim().max(2_048).nullable().optional(),
  startsAt: z.string().datetime().optional(),
  endsAt: z.string().datetime().optional(),
  registrationDeadline: z.string().datetime().nullable().optional(),
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  audience: z.enum(['all_graduates', 'school_graduates']).optional(),
  status: z.enum(['draft', 'published', 'cancelled', 'completed']).optional(),
}).strict();

type LockedEvent = {
  id: string;
  title: string;
  description: string;
  event_format: 'onsite' | 'online' | 'hybrid';
  location: string | null;
  online_url: string | null;
  starts_at: Date | string;
  ends_at: Date | string;
  registration_deadline: Date | string | null;
  capacity: number | null;
  audience: 'all_graduates' | 'school_graduates';
  status: 'draft' | 'published' | 'cancelled' | 'completed';
};

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(organizerRoles);
    const { id } = await context.params;
    await enforceRateLimit(request, 'career-event-update', 60, 60 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-update-account', 60, 60 * 60, actor.uid);
    const input = updateSchema.parse(await readJson(request, 128 * 1024));
    if (!Object.keys(input).length) throw new ApiError(422, 'empty_update', 'Aucune modification n’a été envoyée.');

    const updated = await transaction(async (client) => {
      const locked = await client.query<LockedEvent>(
        `SELECT id, title, description, event_format, location, online_url, starts_at, ends_at,
          registration_deadline, capacity, audience, status
        FROM career_events WHERE id = $1 AND organizer_id = $2 FOR UPDATE`,
        [id, actor.uid],
      );
      const current = locked.rows[0];
      if (!current) throw new ApiError(404, 'event_not_found', 'Événement introuvable.');

      const next = {
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        eventFormat: input.eventFormat ?? current.event_format,
        location: input.location === undefined ? current.location : input.location,
        onlineUrl: input.onlineUrl === undefined ? current.online_url : input.onlineUrl,
        startsAt: input.startsAt ?? new Date(current.starts_at).toISOString(),
        endsAt: input.endsAt ?? new Date(current.ends_at).toISOString(),
        registrationDeadline: input.registrationDeadline === undefined
          ? (current.registration_deadline ? new Date(current.registration_deadline).toISOString() : null)
          : input.registrationDeadline,
        capacity: input.capacity === undefined ? current.capacity : input.capacity,
        audience: input.audience ?? current.audience,
        status: input.status ?? current.status,
      };
      if (new Date(next.endsAt) <= new Date(next.startsAt)) {
        throw new ApiError(422, 'invalid_event_dates', 'La date de fin doit suivre la date de début.');
      }
      if (next.registrationDeadline && new Date(next.registrationDeadline) > new Date(next.startsAt)) {
        throw new ApiError(422, 'invalid_registration_deadline', 'La clôture des inscriptions doit précéder le début.');
      }
      if (next.eventFormat === 'online' && !next.onlineUrl) {
        throw new ApiError(422, 'online_url_required', 'Ajoutez le lien de l’événement en ligne.');
      }
      if (next.onlineUrl && !safeHttpsUrl(next.onlineUrl)) {
        throw new ApiError(422, 'invalid_online_url', 'Utilisez un lien HTTPS valide.');
      }
      if (actor.role === 'company' && next.audience === 'school_graduates') {
        throw new ApiError(422, 'invalid_event_audience', 'Seuls les établissements peuvent limiter un événement à leurs diplômés.');
      }
      if (next.status === 'published' && new Date(next.startsAt).getTime() <= Date.now()) {
        throw new ApiError(422, 'event_in_past', 'Un événement publié doit commencer dans le futur.');
      }
      if (next.status === 'completed' && new Date(next.endsAt).getTime() > Date.now()) {
        throw new ApiError(422, 'event_not_finished', 'Un événement ne peut être marqué terminé avant sa date de fin.');
      }
      const allowedTransitions: Record<LockedEvent['status'], readonly LockedEvent['status'][]> = {
        draft: ['draft', 'published', 'cancelled'],
        published: ['published', 'cancelled', 'completed'],
        cancelled: ['cancelled'],
        completed: ['completed'],
      };
      if (!allowedTransitions[current.status].includes(next.status)) {
        throw new ApiError(
          409,
          'invalid_event_status_transition',
          'Cette transition de statut n’est pas autorisée pour cet événement.',
        );
      }
      const activeRegistrations = await client.query<{ count: number | string }>(
        `SELECT count(*)::integer AS count FROM career_event_registrations
         WHERE event_id = $1 AND status IN ('registered', 'attended')`,
        [id],
      );
      const registrationCount = Number(activeRegistrations.rows[0]?.count || 0);
      if (next.capacity !== null && next.capacity < registrationCount) {
        throw new ApiError(422, 'capacity_below_registrations', `La capacité ne peut pas être inférieure aux ${registrationCount} inscriptions actives.`);
      }

      const result = await client.query<CareerEventRow>(`
        WITH changed AS (
          UPDATE career_events SET
            title = $3, description = $4, event_format = $5, location = $6,
            online_url = $7, starts_at = $8, ends_at = $9, registration_deadline = $10,
            capacity = $11, audience = $12, status = $13,
            published_at = CASE
              WHEN $13 = 'published' AND published_at IS NULL THEN now()
              WHEN $13 <> 'published' THEN NULL
              ELSE published_at
            END
          WHERE id = $1 AND organizer_id = $2
          RETURNING *
        )
        SELECT changed.id, changed.organizer_id,
          COALESCE(NULLIF(CASE WHEN organizer.role = 'company' THEN organizer.company_name ELSE organizer.school_name END, ''), organizer.name) AS organizer_name,
          organizer.role AS organizer_role, changed.title, changed.description, changed.event_format,
          changed.location, changed.online_url, changed.starts_at, changed.ends_at,
          changed.registration_deadline, changed.capacity, changed.audience, changed.status,
          changed.reminder_state, $14::integer AS registration_count,
          NULL::text AS registration_status, changed.created_at, changed.updated_at
        FROM changed JOIN users organizer ON organizer.id = changed.organizer_id
      `, [
        id,
        actor.uid,
        next.title,
        next.description,
        next.eventFormat,
        next.location || null,
        next.onlineUrl ? safeHttpsUrl(next.onlineUrl) : null,
        next.startsAt,
        next.endsAt,
        next.registrationDeadline,
        next.capacity,
        next.audience,
        next.status,
        registrationCount,
      ]);
      await writeAuditLog(client, request, actor.uid, 'career_event.update', 'career_event', id, {
        fields: Object.keys(input),
        status: next.status,
      });
      return result.rows[0];
    });

    return jsonOk({ event: serializeCareerEvent(updated, true) });
  } catch (error) {
    return handleApiError(error);
  }
}
