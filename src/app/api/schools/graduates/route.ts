import type { EducationEntry, Role, UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

const schoolRoles: ReadonlySet<Role> = new Set(['school']);

type GraduateRow = {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  education: EducationEntry[] | null;
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const school = await requireUser(schoolRoles);
    const result = await query<GraduateRow>(`
      SELECT id, name, email, status, education
      FROM users
      WHERE role = 'graduate'
        AND school_id = $1
        AND status IN ('pending', 'active')
        AND deleted_at IS NULL
      ORDER BY
        CASE status WHEN 'pending' THEN 0 ELSE 1 END,
        lower(name),
        id
    `, [school.uid]);

    return jsonOk({
      graduates: result.rows.map((graduate) => ({
        ...graduate,
        education: Array.isArray(graduate.education) ? graduate.education : [],
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
