import { createHash, randomBytes } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';

import { hashToken, newOpaqueToken } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { externalUrl } from '@/lib/server/email';
import { ApiError, handleApiError } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const OAUTH_COOKIE = 'yahnu_oauth_state';

function safeReturnTo(value: string | null) {
  return value
    && value.length <= 2_048
    && value.startsWith('/')
    && !value.startsWith('//')
    && !/[\u0000-\u001f\u007f]/.test(value)
    ? value
    : '/dashboard';
}

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId || !process.env.GOOGLE_CLIENT_SECRET) {
      throw new ApiError(503, 'google_auth_disabled', 'Google sign-in is not configured.');
    }
    await enforceRateLimit(request, 'google_oauth_start_ip', 20, 10 * 60);

    const state = newOpaqueToken();
    const nonce = newOpaqueToken();
    const verifier = randomBytes(48).toString('base64url');
    const challenge = createHash('sha256').update(verifier).digest('base64url');
    await query(`DELETE FROM oauth_flows WHERE expires_at <= now()`);
    await query(`
      INSERT INTO oauth_flows (state_hash, code_verifier, nonce, return_to, expires_at)
      VALUES ($1, $2, $3, $4, now() + interval '10 minutes')
    `, [hashToken(state), verifier, nonce, safeReturnTo(request.nextUrl.searchParams.get('returnTo'))]);

    const parameters = new URLSearchParams({
      client_id: clientId,
      redirect_uri: externalUrl('/api/auth/google/callback'),
      response_type: 'code',
      scope: 'openid email profile',
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: 'S256',
      prompt: 'select_account',
    });
    const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${parameters}`);
    response.cookies.set(OAUTH_COOKIE, state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/api/auth/google/callback',
      maxAge: 10 * 60,
    });
    return response;
  } catch (error) {
    return handleApiError(error);
  }
}
