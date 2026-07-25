import { z } from 'zod';

import type { EducationEntry, Role, UserStatus } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const schoolRoles: ReadonlySet<Role> = new Set(['school']);
const updateSchema = z.object({ status: z.enum(['pending', 'active']) }).strict();

type GraduateRow = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  education: EducationEntry[] | null;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const school = await requireUser(schoolRoles);
    const { status } = updateSchema.parse(await readJson(request));
    const { id } = await context.params;

    const graduate = await transaction(async (client) => {
      const result = await client.query<GraduateRow>(`
        UPDATE users
        SET status = $1
        WHERE id = $2
          AND role = 'graduate'
          AND school_id = $3
          AND status IN ('pending', 'active')
          AND deleted_at IS NULL
        RETURNING id, name, email, status, education
      `, [status, id, school.uid]);

      const updated = result.rows[0];
      if (!updated) throw new ApiError(404, 'graduate_not_found', 'Graduate not found.');
      if (status !== 'active') await client.query('DELETE FROM sessions WHERE user_id = $1', [updated.id]);
      await writeAuditLog(client, request, school.uid, 'graduate.status.update', 'user', updated.id, { status });
      return updated;
    });

    return jsonOk({
      graduate: {
        ...graduate,
        education: Array.isArray(graduate.education) ? graduate.education : [],
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
