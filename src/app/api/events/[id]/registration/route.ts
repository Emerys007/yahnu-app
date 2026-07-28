import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const graduateRoles = new Set<'graduate'>(['graduate']);

type EventAccessRow = {
  organizer_id: string;
  audience: 'all_graduates' | 'school_graduates';
  status: string;
  starts_at: Date | string;
  registration_deadline: Date | string | null;
  capacity: number | null;
};

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    const { id } = await context.params;
    await enforceRateLimit(request, 'career-event-registration', 30, 60 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-registration-account', 30, 60 * 60, actor.uid);

    const registration = await transaction(async (client) => {
      const eventResult = await client.query<EventAccessRow>(`
        SELECT organizer_id, audience, status, starts_at, registration_deadline, capacity
        FROM career_events WHERE id = $1 FOR UPDATE
      `, [id]);
      const event = eventResult.rows[0];
      if (!event || event.status !== 'published') throw new ApiError(404, 'event_not_found', 'Événement introuvable.');
      if (new Date(event.starts_at).getTime() <= Date.now()) {
        throw new ApiError(409, 'event_started', 'Les inscriptions sont closes : l’événement a commencé.');
      }
      if (event.registration_deadline && new Date(event.registration_deadline).getTime() <= Date.now()) {
        throw new ApiError(409, 'registration_closed', 'La date limite d’inscription est dépassée.');
      }
      if (event.audience === 'school_graduates' && actor.schoolId !== event.organizer_id) {
        throw new ApiError(403, 'event_audience_forbidden', 'Cet événement est réservé aux diplômés de l’établissement organisateur.');
      }
      const count = await client.query<{ count: number | string }>(`
        SELECT count(*)::integer AS count
        FROM career_event_registrations
        WHERE event_id = $1 AND status IN ('registered', 'attended')
      `, [id]);
      const registrationCount = Number(count.rows[0]?.count || 0);
      const existing = await client.query<{ status: string }>(
        `SELECT status FROM career_event_registrations WHERE event_id = $1 AND graduate_id = $2`,
        [id, actor.uid],
      );
      if (event.capacity !== null && registrationCount >= event.capacity && existing.rows[0]?.status === 'cancelled') {
        throw new ApiError(409, 'event_full', 'Cet événement est complet.');
      }
      if (event.capacity !== null && registrationCount >= event.capacity && !existing.rows[0]) {
        throw new ApiError(409, 'event_full', 'Cet événement est complet.');
      }
      const result = await client.query<{ status: string; registered_at: Date | string }>(`
        INSERT INTO career_event_registrations (
          event_id, graduate_id, status, registered_at, cancelled_at, reminder_state
        ) VALUES ($1, $2, 'registered', now(), NULL, 'not_scheduled')
        ON CONFLICT (event_id, graduate_id) DO UPDATE SET
          status = 'registered',
          registered_at = now(),
          cancelled_at = NULL,
          reminder_state = 'not_scheduled'
        RETURNING status, registered_at
      `, [id, actor.uid]);
      await writeAuditLog(client, request, actor.uid, 'career_event.register', 'career_event', id);
      return result.rows[0];
    });

    return jsonOk({
      registration: {
        status: registration.status,
        registeredAt: new Date(registration.registered_at).toISOString(),
        reminderState: 'not_scheduled',
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(graduateRoles);
    const { id } = await context.params;
    await enforceRateLimit(request, 'career-event-registration', 30, 60 * 60, actor.uid);
    await enforceRateLimitSubject('career-event-registration-account', 30, 60 * 60, actor.uid);
    const cancelled = await transaction(async (client) => {
      const result = await client.query(`
        UPDATE career_event_registrations
        SET status = 'cancelled', cancelled_at = now(), reminder_state = 'not_scheduled'
        WHERE event_id = $1 AND graduate_id = $2 AND status = 'registered'
        RETURNING event_id
      `, [id, actor.uid]);
      if (!result.rowCount) throw new ApiError(404, 'registration_not_found', 'Aucune inscription active n’a été trouvée.');
      await writeAuditLog(client, request, actor.uid, 'career_event.registration_cancel', 'career_event', id);
      return true;
    });
    return jsonOk({ cancelled });
  } catch (error) {
    return handleApiError(error);
  }
}
