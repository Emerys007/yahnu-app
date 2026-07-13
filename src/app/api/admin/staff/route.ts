import { adminRoles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type StaffRow = {
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
    const result = await query<StaffRow>(`
      SELECT id, name, email, role, status, created_at
      FROM users
      WHERE deleted_at IS NULL
        AND role = ANY($1::text[])
      ORDER BY CASE WHEN status = 'active' THEN 0 ELSE 1 END,
        CASE WHEN role = 'super_admin' THEN 0 ELSE 1 END, lower(name), created_at
    `, [['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']]);

    return jsonOk({
      staff: result.rows.map((staff) => ({
        id: staff.id,
        name: staff.name || staff.email,
        email: staff.email,
        accountType: staff.role,
        status: staff.status,
        createdAt: new Date(staff.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
