import { createRemoteJWKSet, jwtVerify } from 'jose';
import { NextRequest, NextResponse } from 'next/server';

import type { UserRow } from '@/lib/server/auth';
import { createSession, hashToken, setSessionCookie, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { externalUrl } from '@/lib/server/email';

const GOOGLE_KEYS = createRemoteJWKSet(new URL('https://www.googleapis.com/oauth2/v3/certs'));
const OAUTH_COOKIE = 'yahnu_oauth_state';

type GoogleClaims = {
  sub: string;
  email: string;
  email_verified?: boolean;
  name?: string;
  given_name?: string;
  family_name?: string;
  nonce?: string;
};

type GoogleUserRow = UserRow & { google_sub: string | null };

function redirectWithError(code: string) {
  const response = NextResponse.redirect(externalUrl(`/login?auth=${encodeURIComponent(code)}`));
  response.cookies.set(OAUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/auth/google/callback',
    maxAge: 0,
  });
  return response;
}

export async function GET(request: NextRequest) {
  const state = request.nextUrl.searchParams.get('state');
  const code = request.nextUrl.searchParams.get('code');
  const cookieState = request.cookies.get(OAUTH_COOKIE)?.value;
  if (!state || state.length > 500 || !code || code.length > 5_000 || !cookieState || state !== cookieState) {
    return redirectWithError('google_state_invalid');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    if (!clientId || !clientSecret) return redirectWithError('google_auth_disabled');

    const flowResult = await query<{ code_verifier: string; nonce: string; return_to: string }>(`
      DELETE FROM oauth_flows
      WHERE state_hash = $1 AND expires_at > now()
      RETURNING code_verifier, nonce, return_to
    `, [hashToken(state)]);
    const flow = flowResult.rows[0];
    if (!flow) return redirectWithError('google_state_invalid');

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: externalUrl('/api/auth/google/callback'),
        grant_type: 'authorization_code',
        code_verifier: flow.code_verifier,
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!tokenResponse.ok) return redirectWithError('google_exchange_failed');
    const tokens = await tokenResponse.json() as { id_token?: string };
    if (!tokens.id_token) return redirectWithError('google_exchange_failed');

    const verified = await jwtVerify(tokens.id_token, GOOGLE_KEYS, {
      audience: clientId,
      issuer: ['https://accounts.google.com', 'accounts.google.com'],
    });
    const claims = verified.payload as unknown as GoogleClaims;
    if (!claims.sub || !claims.email || !claims.email_verified || claims.nonce !== flow.nonce) {
      return redirectWithError('google_identity_invalid');
    }

    const email = claims.email.toLowerCase();
    const user = await transaction(async (client) => {
      const existing = await client.query<GoogleUserRow>(`
        SELECT id, email, google_sub, name, first_name, last_name, role, status, school_id,
          school_name, company_name, contact_name, industry, experience, education,
          skills, phone, auth_provider, email_verified_at, created_at
        FROM users
        WHERE (google_sub = $1 OR lower(email) = $2) AND deleted_at IS NULL
        ORDER BY CASE WHEN google_sub = $1 THEN 0 ELSE 1 END
        LIMIT 1 FOR UPDATE
      `, [claims.sub, email]);
      const row = existing.rows[0];

      if (row) {
        if (row.google_sub && row.google_sub !== claims.sub) {
          throw new Error('This email is already linked to another Google identity.');
        }
        await client.query(`
          UPDATE users SET google_sub = COALESCE(google_sub, $1), auth_provider = 'google',
            email_verified_at = COALESCE(email_verified_at, now())
          WHERE id = $2
        `, [claims.sub, row.id]);
      }
      if (row) await writeAuditLog(client, request, row.id, 'auth.google', 'user', row.id);
      return row;
    });

    if (!user) return redirectWithError('google_registration_required');
    if (user.status === 'pending') return redirectWithError(user.role === 'graduate' ? 'pending_graduate' : 'pending_org');
    if (user.status === 'suspended' || user.status === 'declined') return redirectWithError(user.status);

    await query('UPDATE users SET last_login_at = now() WHERE id = $1', [user.id]);
    const session = await createSession(user.id, request);
    const response = NextResponse.redirect(externalUrl(flow.return_to));
    response.cookies.set(OAUTH_COOKIE, '', { path: '/api/auth/google/callback', maxAge: 0 });
    setSessionCookie(response, session);
    return response;
  } catch (error) {
    console.error('Google authentication failed:', error);
    return redirectWithError('google_signin_failed');
  }
}
