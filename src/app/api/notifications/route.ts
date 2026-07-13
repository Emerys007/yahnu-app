import { adminRoles, type Role } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type NotificationRow = {
  id: string;
  name: string;
  role: Role;
  created_at: Date | string;
};

export async function GET() {
  try {
    const user = await requireUser();
    let result: NotificationRow[] = [];

    if (adminRoles.has(user.role)) {
      const pending = await query<NotificationRow>(`
        SELECT id, name, role, created_at
        FROM users
        WHERE deleted_at IS NULL
          AND status = 'pending'
          AND role = ANY($1::text[])
        ORDER BY created_at DESC, id DESC
        LIMIT 5
      `, [['company', 'school']]);
      result = pending.rows;
    } else if (user.role === 'school') {
      const pending = await query<NotificationRow>(`
        SELECT id, name, role, created_at
        FROM users
        WHERE deleted_at IS NULL
          AND status = 'pending'
          AND role = 'graduate'
          AND school_id = $1
        ORDER BY created_at DESC, id DESC
        LIMIT 5
      `, [user.uid]);
      result = pending.rows;
    }

    return jsonOk({
      notifications: result.map((notification) => ({
        id: notification.id,
        name: notification.name,
        role: notification.role,
        createdAt: new Date(notification.created_at).toISOString(),
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
