import { NextResponse } from 'next/server';
import { z } from 'zod';

import { clearSessionCookie, hashToken, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { sendEmailChangeNotice } from '@/lib/server/email';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const schema = z.object({ token: z.string().min(20).max(500) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const { token } = schema.parse(await readJson(request));
    await enforceRateLimit(request, 'verify_email', 10, 60 * 60);

    const tokenHash = hashToken(token);
    const emailChange = await transaction(async (client) => {
      const result = await client.query<{
        user_id: string;
        purpose: 'verify_email' | 'change_email';
        target_email: string | null;
        pending_email: string | null;
        current_email: string;
        name: string;
      }>(`
        SELECT t.user_id, t.purpose, t.target_email, u.pending_email,
          u.email AS current_email, u.name
        FROM auth_tokens t
        JOIN users u ON u.id = t.user_id AND u.deleted_at IS NULL
        WHERE t.token_hash = $1
          AND t.purpose IN ('verify_email', 'change_email')
          AND t.used_at IS NULL AND t.expires_at > now()
        FOR UPDATE OF t, u
      `, [tokenHash]);
      const record = result.rows[0];
      if (!record) throw new ApiError(400, 'invalid_verification_token', 'This verification link is invalid or has expired.');

      if (record.purpose === 'change_email') {
        if (!record.target_email || record.pending_email !== record.target_email) {
          throw new ApiError(400, 'invalid_verification_token', 'This email change is no longer pending.');
        }
        try {
          const update = await client.query(`
            UPDATE users
            SET email = $1, pending_email = NULL, email_verified_at = now(),
              google_sub = NULL, auth_provider = 'password'
            WHERE id = $2 AND pending_email = $1 AND deleted_at IS NULL
          `, [record.target_email, record.user_id]);
          if (update.rowCount !== 1) throw new ApiError(400, 'invalid_verification_token', 'This email change is no longer pending.');
        } catch (error) {
          if ((error as { code?: string }).code === '23505') throw new ApiError(409, 'email_in_use', 'That email address is already in use.');
          throw error;
        }
        await client.query('DELETE FROM sessions WHERE user_id = $1', [record.user_id]);
        await client.query('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [record.user_id]);
        await writeAuditLog(client, request, record.user_id, 'auth.change_email', 'user', record.user_id);
        return { oldEmail: record.current_email, newEmail: record.target_email, name: record.name };
      } else {
        await client.query('UPDATE users SET email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $1', [record.user_id]);
        await client.query('UPDATE auth_tokens SET used_at = now() WHERE token_hash = $1', [tokenHash]);
        await writeAuditLog(client, request, record.user_id, 'auth.verify_email', 'user', record.user_id);
        return null;
      }
    });

    if (emailChange) {
      try {
        await sendEmailChangeNotice(emailChange.oldEmail, emailChange.name, emailChange.newEmail);
      } catch (error) {
        console.error('Email address changed, but the security notice could not be delivered:', error instanceof ApiError ? error.code : 'unexpected_error');
      }
      const response = NextResponse.json({ data: { verified: true, reauthenticationRequired: true } }, {
        headers: { 'Cache-Control': 'no-store, max-age=0' },
      });
      clearSessionCookie(response);
      return response;
    }

    return jsonOk({ verified: true, reauthenticationRequired: false });
  } catch (error) {
    return handleApiError(error);
  }
}
