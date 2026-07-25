import { adminRoles, type UserStatus } from '@/lib/auth-types';
import { requireUser } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { handleApiError, jsonOk } from '@/lib/server/http';

type ModerationRow = {
  id: string;
  name: string;
  email: string;
  role: 'company' | 'school';
  status: UserStatus;
  created_at: Date | string;
  profile: Record<string, unknown>;
  company_name: string | null;
  school_name: string | null;
  contact_name: string | null;
  industry: string | null;
  phone: string | null;
};

export async function GET() {
  try {
    await requireUser(adminRoles);
    const result = await query<ModerationRow>(`
      SELECT id, name, email, role, status, created_at, profile,
        company_name, school_name, contact_name, industry, phone
      FROM users
      WHERE deleted_at IS NULL
        AND status = 'pending'
        AND role = ANY($1::text[])
      ORDER BY created_at ASC, id ASC
      LIMIT 500
    `, [['company', 'school']]);

    return jsonOk({
      items: result.rows.map((item) => ({
        id: item.id,
        name: item.company_name || item.school_name || item.name || item.email,
        email: item.email,
        type: item.role,
        submittedAt: new Date(item.created_at).toISOString(),
        details: {
          ...item.profile,
          name: item.name,
          companyName: item.company_name,
          schoolName: item.school_name,
          contactName: item.contact_name,
          industry: item.industry,
          phone: item.phone,
          status: item.status,
        },
      })),
      truncated: result.rows.length === 500,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
