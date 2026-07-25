import { NextResponse } from 'next/server';

import { clearSessionCookie, revokeCurrentSession } from '@/lib/server/auth';
import { assertSameOrigin, handleApiError } from '@/lib/server/http';

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
  } catch (error) {
    return handleApiError(error);
  }

  try {
    await revokeCurrentSession();
    const response = NextResponse.json({ data: { signedOut: true } }, {
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
    clearSessionCookie(response);
    return response;
  } catch (error) {
    console.error('Unable to revoke the server-side session during sign out:', error);
    const response = NextResponse.json({
      error: { code: 'logout_incomplete', message: 'The browser session was cleared, but server cleanup could not be confirmed.' },
    }, {
      status: 503,
      headers: { 'Cache-Control': 'no-store, max-age=0' },
    });
    clearSessionCookie(response);
    return response;
  }
}
