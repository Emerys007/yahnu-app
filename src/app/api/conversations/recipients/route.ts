import { z } from 'zod';

import { roles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, handleApiError, jsonOk } from '@/lib/server/http';

const searchSchema = z.object({
  q: z.string().trim().max(100).default(''),
  role: z.enum(roles).optional(),
  scope: z.enum(['all', 'school-graduates']).default('all'),
  limit: z.coerce.number().int().min(1).max(250).default(100),
});
const directoryRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);

type RecipientRow = {
  id: string;
  name: string;
  role: Role;
  status: UserStatus;
  avatar_url: string | null;
};

export async function GET(request: Request) {
  try {
    const actor = await requireUser();
    const url = new URL(request.url);
    const input = searchSchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      role: url.searchParams.get('role') ?? undefined,
      scope: url.searchParams.get('scope') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
    });

    if (input.scope === 'school-graduates' && actor.role !== 'school' && actor.role !== 'admin' && actor.role !== 'super_admin') {
      throw new ApiError(403, 'recipient_scope_forbidden', 'Vous ne pouvez pas consulter cette liste de destinataires.');
    }
    if (input.scope === 'all' && !directoryRoles.has(actor.role)) {
      throw new ApiError(403, 'recipient_scope_forbidden', 'Vous ne pouvez pas consulter cet annuaire.');
    }
    if (input.scope === 'all' && input.q.length < 2) {
      return jsonOk({ recipients: [] });
    }

    const schoolId = input.scope === 'school-graduates' && actor.role === 'school' ? actor.uid : null;
    const effectiveRole = input.scope === 'school-graduates' ? 'graduate' : (input.role ?? null);
    const result = await query<RecipientRow>(`
      SELECT id, name, role, status,
        COALESCE(profile->>'avatarUrl', profile->>'photoURL', profile->>'avatar') AS avatar_url
      FROM users
      WHERE id <> $1
        AND deleted_at IS NULL
        AND status = ANY($2::text[])
        AND ($3::text IS NULL OR role = $3)
        AND ($4::text IS NULL OR school_id = $4)
        AND ($5::text = '' OR name ILIKE '%' || $5 || '%')
      ORDER BY name ASC, id ASC
      LIMIT $6
    `, [
      actor.uid,
      input.scope === 'school-graduates' ? ['pending', 'active'] : ['active'],
      effectiveRole,
      schoolId,
      input.q,
      input.limit,
    ]);

    return jsonOk({
      recipients: result.rows.map((recipient) => ({
        id: recipient.id,
        name: recipient.name,
        role: recipient.role,
        status: recipient.status,
        avatarUrl: recipient.avatar_url,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
