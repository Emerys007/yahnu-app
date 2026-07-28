import { z } from 'zod';

import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const organizerRoles = new Set<'company' | 'school'>(['company', 'school']);
const updateSchema = z.object({
  graduateId: z.string().trim().min(1).max(200),
  status: z.enum(['registered', 'attended']),
}).strict();
const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

type RegistrationRow = {
  graduate_id: string;
  graduate_name: string;
  school_name: string | null;
  status: 'registered' | 'attended';
  reminder_state: 'not_scheduled' | 'scheduled' | 'processing' | 'completed' | 'failed';
  registered_at: Date | string;
  updated_at: Date | string;
};

function serialize(row: RegistrationRow) {
  return {
    graduateId: row.graduate_id,
    name: row.graduate_name,
    schoolName: row.school_name,
    status: row.status,
    reminderState: row.reminder_state,
    registeredAt: new Date(row.registered_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireUser(organizerRoles);
    const { id } = await context.params;
    const url = new URL(request.url);
    const input = listSchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    await enforceRateLimit(request, 'career-event-attendees-read', 120, 5 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-attendees-read-account', 120, 5 * 60, actor.uid);
    const ownership = await query(`SELECT 1 FROM career_events WHERE id = $1 AND organizer_id = $2`, [id, actor.uid]);
    if (!ownership.rowCount) throw new ApiError(404, 'event_not_found', 'Événement introuvable.');
    const result = await query<RegistrationRow>(`
      SELECT registration.graduate_id, graduate.name AS graduate_name,
        graduate.school_name, registration.status, registration.reminder_state,
        registration.registered_at, registration.updated_at
      FROM career_event_registrations registration
      JOIN users graduate ON graduate.id = registration.graduate_id
        AND graduate.deleted_at IS NULL
      WHERE registration.event_id = $1
        AND registration.status IN ('registered', 'attended')
      ORDER BY registration.registered_at, graduate.name, graduate.id
      LIMIT $2 OFFSET $3
    `, [id, input.limit + 1, input.offset]);
    return jsonOk({
      registrations: result.rows.slice(0, input.limit).map(serialize),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(organizerRoles);
    const { id } = await context.params;
    await enforceRateLimit(request, 'career-event-attendance', 120, 60 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-attendance-account', 120, 60 * 60, actor.uid);
    const input = updateSchema.parse(await readJson(request));
    const updated = await transaction(async (client) => {
      const eventResult = await client.query<{
        starts_at: Date | string;
        status: 'draft' | 'published' | 'cancelled' | 'completed';
      }>(
        `SELECT starts_at, status
         FROM career_events
         WHERE id = $1 AND organizer_id = $2
         FOR UPDATE`,
        [id, actor.uid],
      );
      const event = eventResult.rows[0];
      if (!event) throw new ApiError(404, 'event_not_found', 'Événement introuvable.');
      if (
        input.status === 'attended'
        && (
          new Date(event.starts_at).getTime() > Date.now()
          || (event.status !== 'published' && event.status !== 'completed')
        )
      ) {
        throw new ApiError(
          409,
          'attendance_not_open',
          'La présence ne peut être confirmée qu’après le début d’un événement publié.',
        );
      }
      const result = await client.query<RegistrationRow>(`
        UPDATE career_event_registrations registration SET status = $3
        FROM users graduate
        WHERE registration.event_id = $1
          AND registration.graduate_id = $2
          AND graduate.id = registration.graduate_id
          AND registration.status IN ('registered', 'attended')
        RETURNING registration.graduate_id, graduate.name AS graduate_name,
          graduate.school_name, registration.status, registration.reminder_state,
          registration.registered_at, registration.updated_at
      `, [id, input.graduateId, input.status]);
      if (!result.rows[0]) throw new ApiError(404, 'registration_not_found', 'Inscription introuvable.');
      await writeAuditLog(client, request, actor.uid, 'career_event.attendance_update', 'career_event', id, {
        graduateId: input.graduateId,
        status: input.status,
      });
      return result.rows[0];
    });
    return jsonOk({ registration: serialize(updated) });
  } catch (error) {
    return handleApiError(error);
  }
}
