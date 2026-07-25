import 'server-only';

import { createHmac, randomBytes } from 'node:crypto';
import { cookies } from 'next/headers';
import type { NextResponse } from 'next/server';
import type { PoolClient } from 'pg';

import type { Role, UserProfile, UserStatus } from '@/lib/auth-types';
import { ApiError, clientAddress, privacyHash } from '@/lib/server/http';
import { query } from '@/lib/server/db';

const SESSION_DAYS = 30;
const DEV_COOKIE_NAME = 'yahnu_session';
const PROD_COOKIE_NAME = '__Host-yahnu_session';

export type UserRow = {
  id: string;
  email: string;
  name: string;
  first_name: string | null;
  last_name: string | null;
  role: Role;
  status: UserStatus;
  school_id: string | null;
  school_name: string | null;
  company_name: string | null;
  contact_name: string | null;
  industry: string | null;
  experience: string | null;
  education: UserProfile['education'] | null;
  skills: string[] | string | null;
  phone: string | null;
  auth_provider: 'password' | 'google' | 'migrated';
  password_hash?: string | null;
  has_password?: boolean;
  email_verified_at: Date | string | null;
  created_at: Date | string;
};

export function toUserProfile(row: UserRow): UserProfile {
  return {
    uid: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    status: row.status,
    firstName: row.first_name ?? undefined,
    lastName: row.last_name ?? undefined,
    schoolId: row.school_id ?? undefined,
    schoolName: row.school_name ?? undefined,
    companyName: row.company_name ?? undefined,
    contactName: row.contact_name ?? undefined,
    industry: row.industry ?? undefined,
    experience: row.experience ?? undefined,
    education: row.education ?? [],
    skills: row.skills ?? [],
    phone: row.phone ?? undefined,
    authProvider: row.auth_provider,
    hasPassword: row.has_password ?? Boolean(row.password_hash),
    emailVerified: Boolean(row.email_verified_at),
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function authSecret() {
  const secret = process.env.AUTH_SECRET;
  if ((!secret || secret.length < 32) && process.env.NODE_ENV === 'production') {
    throw new Error('AUTH_SECRET must contain at least 32 characters in production.');
  }
  return secret ?? 'yahnu-development-secret-change-me';
}

export function hashToken(token: string) {
  return createHmac('sha256', authSecret()).update(token).digest('hex');
}

export function newOpaqueToken() {
  return randomBytes(32).toString('base64url');
}

export function sessionCookieName() {
  return process.env.NODE_ENV === 'production' ? PROD_COOKIE_NAME : DEV_COOKIE_NAME;
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(sessionCookieName(), token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DAYS * 24 * 60 * 60,
    priority: 'high',
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(sessionCookieName(), '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function createSession(userId: string, request: Request) {
  const token = newOpaqueToken();
  await query('DELETE FROM sessions WHERE expires_at <= now()');
  await query(`
    INSERT INTO sessions (token_hash, user_id, expires_at, user_agent, ip_hash)
    VALUES ($1, $2, now() + ($3 * interval '1 day'), $4, $5)
  `, [
    hashToken(token),
    userId,
    SESSION_DAYS,
    request.headers.get('user-agent')?.slice(0, 500) ?? null,
    privacyHash(clientAddress(request)),
  ]);
  await query(`
    DELETE FROM sessions
    WHERE user_id = $1
      AND token_hash IN (
        SELECT token_hash FROM sessions WHERE user_id = $1
        ORDER BY created_at DESC OFFSET 10
      )
  `, [userId]);
  return token;
}

export async function currentSessionToken() {
  return (await cookies()).get(sessionCookieName())?.value ?? null;
}

export async function revokeCurrentSession() {
  const token = await currentSessionToken();
  if (token) await query('DELETE FROM sessions WHERE token_hash = $1', [hashToken(token)]);
}

export async function getCurrentUser() {
  const token = await currentSessionToken();
  if (!token) return null;

  const result = await query<UserRow>(`
    SELECT u.id, u.email, u.name, u.first_name, u.last_name, u.role, u.status,
      u.school_id, u.school_name, u.company_name, u.contact_name, u.industry,
      u.experience, u.education, u.skills, u.phone, u.auth_provider,
      u.password_hash IS NOT NULL AS has_password, u.email_verified_at, u.created_at
    FROM sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = $1
      AND s.expires_at > now()
      AND u.deleted_at IS NULL
      AND u.status = 'active'
      AND u.email_verified_at IS NOT NULL
  `, [hashToken(token)]);

  if (!result.rows[0]) return null;
  await query(`UPDATE sessions SET last_seen_at = now() WHERE token_hash = $1 AND last_seen_at < now() - interval '5 minutes'`, [hashToken(token)]);
  return toUserProfile(result.rows[0]);
}

export async function requireUser(allowedRoles?: readonly Role[] | ReadonlySet<Role>) {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, 'authentication_required', 'Please sign in to continue.');
  if (allowedRoles && !new Set(allowedRoles).has(user.role)) {
    throw new ApiError(403, 'forbidden', 'You do not have permission to perform this action.');
  }
  return user;
}

export async function writeAuditLog(
  client: Pick<PoolClient, 'query'> | null,
  request: Request,
  actorUserId: string | null,
  action: string,
  targetType?: string,
  targetId?: string,
  metadata: Record<string, unknown> = {},
) {
  const statement = `
    INSERT INTO audit_logs (actor_user_id, action, target_type, target_id, metadata, ip_hash)
    VALUES ($1, $2, $3, $4, $5::jsonb, $6)
  `;
  const values = [actorUserId, action, targetType ?? null, targetId ?? null, JSON.stringify(metadata), privacyHash(clientAddress(request))];
  if (client) await client.query(statement, values);
  else await query(statement, values);
}
