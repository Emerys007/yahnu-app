import { z } from 'zod';

import type { Role, UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const supportRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const searchSchema = z.object({
  q: z.string().trim().min(2).max(120),
  limit: z.coerce.number().int().min(1).max(50).default(25),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});

type SupportUserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  school_name: string | null;
  industry: string | null;
  slug: string | null;
  created_at: Date | string;
};

export async function GET(request: Request) {
  try {
    const actor = await requireUser(supportRoles);
    await enforceRateLimit(request, 'support-user-search', 60, 60, actor.uid);
    const url = new URL(request.url);
    const { q: search, limit, offset } = searchSchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const pattern = `%${search.replaceAll('%', '\\%').replaceAll('_', '\\_')}%`;
    const result = await query<SupportUserRow>(`
      SELECT id, name, email, role, status, school_name, industry,
        NULLIF(profile->>'slug', '') AS slug, created_at
      FROM users
      WHERE deleted_at IS NULL
        AND role = ANY($1::text[])
        AND (name ILIKE $2 ESCAPE '\\' OR email ILIKE $2 ESCAPE '\\')
      ORDER BY name ASC, id ASC
      LIMIT $3
      OFFSET $4
    `, [['graduate', 'company', 'school', 'admin'], pattern, limit + 1, offset]);

    const page = result.rows.slice(0, limit);

    return jsonOk({
      users: page.map((user) => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        type: user.role,
        status: user.status,
        slug: user.slug ?? user.id,
        schoolName: user.school_name ?? '',
        industry: user.industry ?? '',
        joinDate: new Date(user.created_at).toISOString(),
      })),
      hasMore: result.rows.length > limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
