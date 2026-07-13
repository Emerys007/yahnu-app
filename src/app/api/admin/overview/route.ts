import { adminRoles, type Role, type UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type CountRow = {
  total_users: string;
  active_companies: string;
  active_schools: string;
};

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

    const [countResult, pendingResult, recentResult] = await Promise.all([
      query<CountRow>(`
        SELECT
          count(*) FILTER (WHERE role = ANY($1::text[]) AND status = 'active') AS total_users,
          count(*) FILTER (WHERE role = 'company' AND status = 'active') AS active_companies,
          count(*) FILTER (WHERE role = 'school' AND status = 'active') AS active_schools
        FROM users
        WHERE deleted_at IS NULL
      `, [['graduate', 'company', 'school']]),
      query<UserRow>(`
        SELECT id, name, email, role, status, created_at
        FROM users
        WHERE deleted_at IS NULL
          AND status = 'pending'
          AND role = ANY($1::text[])
        ORDER BY created_at ASC, id ASC
        LIMIT 20
      `, [['company', 'school']]),
      query<UserRow>(`
        SELECT id, name, email, role, status, created_at
        FROM users
        WHERE deleted_at IS NULL
        ORDER BY created_at DESC, id DESC
        LIMIT 5
      `),
    ]);

    const counts = countResult.rows[0] ?? { total_users: '0', active_companies: '0', active_schools: '0' };
    const toDashboardUser = (user: UserRow) => ({
      id: user.id,
      name: user.name || user.email,
      email: user.email,
      accountType: `${user.role.charAt(0).toUpperCase()}${user.role.slice(1)}`,
      role: user.role,
      status: user.status,
      date: new Date(user.created_at).toISOString(),
    });

    return jsonOk({
      stats: {
        totalUsers: Number(counts.total_users),
        activeCompanies: Number(counts.active_companies),
        activeSchools: Number(counts.active_schools),
      },
      pendingRequests: pendingResult.rows.map(toDashboardUser),
      recentActivity: recentResult.rows.map((user) => ({
        id: user.id,
        type: 'new_user' as const,
        name: user.name || user.email,
        role: user.role,
        occurredAt: new Date(user.created_at).toISOString(),
      })),
      serviceStatus: 'operational' as const,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
