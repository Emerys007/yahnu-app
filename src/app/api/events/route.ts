import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import {
  serializeCareerEvent,
  type CareerEventRow,
} from '@/lib/server/role-workspaces';
import { escapedLikeContains, safeHttpsUrl } from '@/lib/role-workspaces';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const eventRoles = new Set<'graduate' | 'company' | 'school'>(['graduate', 'company', 'school']);
const organizerRoles = new Set<'company' | 'school'>(['company', 'school']);
const listSchema = z.object({
  scope: z.enum(['upcoming', 'registered', 'mine']).default('upcoming'),
  q: z.string().trim().max(120).default(''),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
const eventSchema = z.object({
  title: z.string().trim().min(3).max(180),
  description: z.string().trim().min(20).max(12_000),
  eventFormat: z.enum(['onsite', 'online', 'hybrid']),
  location: z.string().trim().max(240).nullable().optional(),
  onlineUrl: z.string().trim().max(2_048).nullable().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime(),
  registrationDeadline: z.string().datetime().nullable().optional(),
  capacity: z.number().int().min(1).max(100_000).nullable().optional(),
  audience: z.enum(['all_graduates', 'school_graduates']).default('all_graduates'),
  status: z.enum(['draft', 'published']).default('draft'),
}).strict();

const eventColumns = `
  e.id, e.organizer_id,
  COALESCE(NULLIF(CASE WHEN organizer.role = 'company' THEN organizer.company_name ELSE organizer.school_name END, ''), organizer.name) AS organizer_name,
  organizer.role AS organizer_role, e.title, e.description, e.event_format, e.location,
  e.online_url, e.starts_at, e.ends_at, e.registration_deadline, e.capacity,
  e.audience, e.status, e.reminder_state,
  count(registration.graduate_id) FILTER (WHERE registration.status IN ('registered', 'attended'))::integer AS registration_count,
  mine.status AS registration_status, e.created_at, e.updated_at
`;

function validateEvent(input: z.infer<typeof eventSchema>, organizerRole: 'company' | 'school') {
  const startsAt = new Date(input.startsAt);
  const endsAt = new Date(input.endsAt);
  const deadline = input.registrationDeadline ? new Date(input.registrationDeadline) : null;
  if (endsAt <= startsAt) throw new ApiError(422, 'invalid_event_dates', 'La date de fin doit suivre la date de début.');
  if (deadline && deadline > startsAt) {
    throw new ApiError(422, 'invalid_registration_deadline', 'La clôture des inscriptions doit précéder le début.');
  }
  if (input.eventFormat === 'online' && !input.onlineUrl) {
    throw new ApiError(422, 'online_url_required', 'Ajoutez le lien de l’événement en ligne.');
  }
  if (input.onlineUrl && !safeHttpsUrl(input.onlineUrl)) {
    throw new ApiError(422, 'invalid_online_url', 'Utilisez un lien HTTPS valide.');
  }
  if (organizerRole === 'company' && input.audience === 'school_graduates') {
    throw new ApiError(422, 'invalid_event_audience', 'Seuls les établissements peuvent limiter un événement à leurs diplômés.');
  }
  if (input.status === 'published' && startsAt.getTime() <= Date.now()) {
    throw new ApiError(422, 'event_in_past', 'Un événement publié doit commencer dans le futur.');
  }
}

export async function GET(request: Request) {
  try {
    const actor = await requireUser(eventRoles);
    await enforceRateLimit(request, 'career-event-read', 180, 5 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-read-account', 180, 5 * 60, actor.uid);
    const url = new URL(request.url);
    const input = listSchema.parse({
      scope: url.searchParams.get('scope') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    if (input.scope === 'mine' && actor.role === 'graduate') {
      throw new ApiError(403, 'event_scope_forbidden', 'Ce filtre est réservé aux organisateurs.');
    }
    if (input.scope === 'registered' && actor.role !== 'graduate') {
      throw new ApiError(403, 'event_scope_forbidden', 'Ce filtre est réservé aux diplômés.');
    }

    const scopeClause = input.scope === 'mine'
      ? `e.organizer_id = $1`
      : input.scope === 'registered'
        ? `mine.status IN ('registered', 'attended')`
        : `e.status = 'published'
          AND e.ends_at > now()
          AND (
            e.audience = 'all_graduates'
            OR (e.audience = 'school_graduates' AND e.organizer_id = $2)
          )`;
    const result = await query<CareerEventRow>(`
      SELECT ${eventColumns}
      FROM career_events e
      JOIN users organizer ON organizer.id = e.organizer_id
        AND organizer.deleted_at IS NULL
        AND organizer.status = 'active'
      LEFT JOIN career_event_registrations registration ON registration.event_id = e.id
      LEFT JOIN career_event_registrations mine ON mine.event_id = e.id AND mine.graduate_id = $1
      WHERE ${scopeClause}
        AND (
          $3 = ''
          OR e.title ILIKE $3 ESCAPE E'\\\\'
          OR e.description ILIKE $3 ESCAPE E'\\\\'
          OR e.location ILIKE $3 ESCAPE E'\\\\'
        )
      GROUP BY e.id, organizer.id, mine.status
      ORDER BY
        CASE WHEN e.starts_at >= now() THEN 0 ELSE 1 END,
        e.starts_at ASC, e.id
      LIMIT $4 OFFSET $5
    `, [
      actor.uid,
      actor.role === 'graduate' ? actor.schoolId || null : null,
      input.q ? escapedLikeContains(input.q) : '',
      input.limit + 1,
      input.offset,
    ]);
    return jsonOk({
      events: result.rows
        .slice(0, input.limit)
        .map((row) => serializeCareerEvent(row, row.organizer_id === actor.uid)),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(organizerRoles);
    if (actor.role !== 'company' && actor.role !== 'school') {
      throw new ApiError(403, 'forbidden', 'Ce rôle ne peut pas créer un événement.');
    }
    await enforceRateLimit(request, 'career-event-create', 20, 60 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-create-account', 20, 60 * 60, actor.uid);
    const input = eventSchema.parse(await readJson(request, 128 * 1024));
    validateEvent(input, actor.role);
    const id = randomUUID();

    const created = await transaction(async (client) => {
      const result = await client.query<CareerEventRow>(`
        WITH inserted AS (
          INSERT INTO career_events (
            id, organizer_id, title, description, event_format, location, online_url,
            starts_at, ends_at, registration_deadline, capacity, audience, status, published_at
          ) VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13,
            CASE WHEN $13 = 'published' THEN now() ELSE NULL END
          )
          RETURNING *
        )
        SELECT inserted.id, inserted.organizer_id,
          COALESCE(NULLIF(CASE WHEN organizer.role = 'company' THEN organizer.company_name ELSE organizer.school_name END, ''), organizer.name) AS organizer_name,
          organizer.role AS organizer_role, inserted.title, inserted.description,
          inserted.event_format, inserted.location, inserted.online_url, inserted.starts_at,
          inserted.ends_at, inserted.registration_deadline, inserted.capacity, inserted.audience,
          inserted.status, inserted.reminder_state, 0::integer AS registration_count,
          NULL::text AS registration_status, inserted.created_at, inserted.updated_at
        FROM inserted
        JOIN users organizer ON organizer.id = inserted.organizer_id
      `, [
        id,
        actor.uid,
        input.title,
        input.description,
        input.eventFormat,
        input.location || null,
        input.onlineUrl ? safeHttpsUrl(input.onlineUrl) : null,
        input.startsAt,
        input.endsAt,
        input.registrationDeadline || null,
        input.capacity ?? null,
        input.audience,
        input.status,
      ]);
      await writeAuditLog(client, request, actor.uid, 'career_event.create', 'career_event', id, {
        status: input.status,
        audience: input.audience,
      });
      return result.rows[0];
    });

    return jsonOk({ event: serializeCareerEvent(created, true) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
