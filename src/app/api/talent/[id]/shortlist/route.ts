import { z } from 'zod';

import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const companyRoles = new Set<'company'>(['company']);
const inputSchema = z.object({
  note: z.string().trim().max(1_000).default(''),
  status: z.enum(['saved', 'contacted', 'archived']).default('saved'),
}).strict();

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    const { id } = await context.params;
    const input = inputSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'talent-shortlist-write', 120, 60 * 60, actor.uid);
    await enforceRateLimitSubject('talent-shortlist-write-account', 120, 60 * 60, actor.uid);
    const shortlist = await transaction(async (client) => {
      const talent = await client.query(`
        SELECT 1
        FROM talent_profiles profile
        JOIN users graduate ON graduate.id = profile.user_id
        WHERE profile.user_id = $1
          AND profile.visibility_consent = true
          AND profile.withdrawn_at IS NULL
          AND graduate.status = 'active'
          AND graduate.deleted_at IS NULL
      `, [id]);
      if (!talent.rowCount) throw new ApiError(404, 'talent_not_found', 'Ce profil n’est plus visible.');
      const result = await client.query<{ status: string; note: string; updated_at: Date | string }>(`
        INSERT INTO talent_shortlists (organization_id, graduate_id, note, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (organization_id, graduate_id) DO UPDATE
        SET note = EXCLUDED.note, status = EXCLUDED.status
        RETURNING status, note, updated_at
      `, [actor.uid, id, input.note, input.status]);
      await writeAuditLog(client, request, actor.uid, 'talent_shortlist.update', 'user', id, {
        status: input.status,
      });
      return result.rows[0];
    });
    return jsonOk({
      shortlist: {
        status: shortlist.status,
        note: shortlist.note,
        updatedAt: new Date(shortlist.updated_at).toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(companyRoles);
    const { id } = await context.params;
    await enforceRateLimit(request, 'talent-shortlist-write', 120, 60 * 60, actor.uid);
    await enforceRateLimitSubject('talent-shortlist-write-account', 120, 60 * 60, actor.uid);
    await transaction(async (client) => {
      await client.query(
        `UPDATE talent_shortlists SET status = 'archived' WHERE organization_id = $1 AND graduate_id = $2`,
        [actor.uid, id],
      );
      await writeAuditLog(client, request, actor.uid, 'talent_shortlist.archive', 'user', id);
    });
    return jsonOk({ archived: true });
  } catch (error) {
    return handleApiError(error);
  }
}
