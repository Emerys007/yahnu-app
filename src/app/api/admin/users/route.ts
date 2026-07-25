import { adminRoles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type UserRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
  status: UserStatus;
  created_at: Date | string;
};

export async function GET() {
  try {
    await requireUser(adminRoles);

    const result = await query<UserRow>(`
      SELECT id, name, email, role, status, created_at
      FROM users
      WHERE deleted_at IS NULL
        AND role = ANY($1::text[])
      ORDER BY created_at DESC, id DESC
      LIMIT 1000
    `, [['graduate', 'company', 'school']]);

    return jsonOk({
      users: result.rows.map((user) => ({
        id: user.id,
        name: user.name || user.email,
        email: user.email,
        accountType: user.role,
        status: user.status,
        date: new Date(user.created_at).toISOString(),
      })),
      truncated: result.rows.length === 1000,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
