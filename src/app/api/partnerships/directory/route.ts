import { z } from 'zod';

import { serializeDirectoryEntry, type DirectoryRow } from '@/lib/careers-server';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

const partnershipRoles = new Set<'company' | 'school'>(['company', 'school']);
const listSchema = z.object({
  q: z.string().trim().max(120).default(''),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();

export async function GET(request: Request) {
  try {
    const actor = await requireUser(partnershipRoles);
    const url = new URL(request.url);
    const input = listSchema.parse({
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const targetRole = actor.role === 'company' ? 'school' : 'company';
    const result = await query<DirectoryRow>(`
      SELECT candidate.id, candidate.name, candidate.role,
        candidate.company_name, candidate.school_name, candidate.industry
      FROM users candidate
      WHERE candidate.role = $1
        AND candidate.status = 'active'
        AND candidate.deleted_at IS NULL
        AND ($2 = '' OR candidate.name ILIKE $2
          OR candidate.company_name ILIKE $2 OR candidate.school_name ILIKE $2)
        AND NOT EXISTS (
          SELECT 1 FROM partnerships partnership
          WHERE partnership.status IN ('pending', 'accepted')
            AND ((partnership.requester_id = $3 AND partnership.partner_id = candidate.id)
              OR (partnership.requester_id = candidate.id AND partnership.partner_id = $3))
        )
      ORDER BY COALESCE(candidate.company_name, candidate.school_name, candidate.name), candidate.id
      LIMIT $4 OFFSET $5
    `, [targetRole, input.q ? `%${input.q}%` : '', actor.uid, input.limit + 1, input.offset]);
    return jsonOk({
      organizations: result.rows.slice(0, input.limit).map(serializeDirectoryEntry),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

