import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type SchoolRow = {
  id: string;
  name: string;
};

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await query<SchoolRow>(`
      SELECT id, COALESCE(NULLIF(school_name, ''), name) AS name
      FROM users
      WHERE role = 'school'
        AND status = 'active'
        AND deleted_at IS NULL
      ORDER BY lower(COALESCE(NULLIF(school_name, ''), name)), id
    `);

    return jsonOk({ schools: result.rows });
  } catch (error) {
    return handleApiError(error);
  }
}
