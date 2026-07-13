import type { EducationEntry, Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk } from '@/lib/server/http';

const schoolRoles: ReadonlySet<Role> = new Set(['school']);

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; index: string }> },
) {
  try {
    assertSameOrigin(request);
    const school = await requireUser(schoolRoles);
    const { id, index: rawIndex } = await context.params;
    const index = Number(rawIndex);
    if (!Number.isSafeInteger(index) || index < 0 || index > 19) {
      throw new ApiError(422, 'invalid_education_index', 'Select a valid education record.');
    }

    const education = await transaction(async (client) => {
      const result = await client.query<{ education: EducationEntry[] | null }>(`
        SELECT education
        FROM users
        WHERE id = $1
          AND role = 'graduate'
          AND school_id = $2
          AND deleted_at IS NULL
        FOR UPDATE
      `, [id, school.uid]);

      const entries = result.rows[0]?.education;
      if (!Array.isArray(entries)) throw new ApiError(404, 'graduate_not_found', 'Graduate not found.');
      if (!entries[index]) throw new ApiError(404, 'education_not_found', 'Education record not found.');

      const updated = entries.map((entry, entryIndex) => (
        entryIndex === index ? { ...entry, verified: true } : entry
      ));
      await client.query('UPDATE users SET education = $1::jsonb WHERE id = $2', [JSON.stringify(updated), id]);
      await writeAuditLog(client, request, school.uid, 'graduate.education.verify', 'user', id, { index });
      return updated;
    });

    return jsonOk({ education });
  } catch (error) {
    return handleApiError(error);
  }
}
