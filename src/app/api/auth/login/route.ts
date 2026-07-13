import { NextResponse } from 'next/server';
import { z } from 'zod';

import type { UserRow } from '@/lib/server/auth';
import { createSession, setSessionCookie, toUserProfile, writeAuditLog } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, readJson } from '@/lib/server/http';
import { hashPassword, verifyPassword } from '@/lib/server/password';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const loginSchema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
  password: z.string().min(1).max(128),
});

type LoginRow = UserRow & { password_hash: string | null };

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'login_ip', 30, 15 * 60);
    const input = loginSchema.parse(await readJson(request));
    await enforceRateLimit(request, 'login_account_ip', 10, 15 * 60, input.email);

    const result = await query<LoginRow>(`
      SELECT id, email, password_hash, name, first_name, last_name, role, status,
        school_id, school_name, company_name, contact_name, industry, experience,
        education, skills, phone, auth_provider, email_verified_at, created_at
      FROM users
      WHERE lower(email) = $1 AND deleted_at IS NULL
      LIMIT 1
    `, [input.email]);
    const row = result.rows[0];

    const validPassword = row?.password_hash
      ? await verifyPassword(input.password, row.password_hash)
      : (await hashPassword(input.password), false);
    if (!row || !validPassword) {
      throw new ApiError(401, 'invalid_credentials', 'Invalid email or password.');
    }

    if (!row.email_verified_at) throw new ApiError(403, 'email_unverified', 'Verify your email address before signing in.');
    if (row.status === 'pending') {
      throw new ApiError(403, row.role === 'graduate' ? 'pending_graduate' : 'pending_org', 'Your account is still awaiting approval.');
    }
    if (row.status === 'suspended') throw new ApiError(403, 'suspended', 'Your account has been suspended.');
    if (row.status === 'declined') throw new ApiError(403, 'declined', 'This registration was not approved.');

    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [row.id]);
    const token = await createSession(row.id, request);
    await writeAuditLog(null, request, row.id, 'auth.login', 'user', row.id);

    const response = NextResponse.json({ data: { user: toUserProfile(row) } }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
