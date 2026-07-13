import { z } from 'zod';

import { hashToken, writeAuditLog } from '@/lib/server/auth';
import { transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { hashPassword, validatePassword } from '@/lib/server/password';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  token: z.string().min(20).max(500),
  password: z.string().min(1).max(128),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const input = schema.parse(await readJson(request));
    const passwordError = validatePassword(input.password);
    if (passwordError) throw new ApiError(422, 'weak_password', passwordError);
    await enforceRateLimit(request, 'password_reset', 8, 60 * 60);
    const passwordHash = await hashPassword(input.password);

    await transaction(async (client) => {
      const token = await client.query<{ user_id: string }>(`
        SELECT user_id FROM auth_tokens
        WHERE token_hash = $1 AND purpose = 'reset_password' AND used_at IS NULL AND expires_at > now()
        FOR UPDATE
      `, [hashToken(input.token)]);
      const record = token.rows[0];
      if (!record) throw new ApiError(400, 'invalid_reset_token', 'This reset link is invalid or has expired.');

      const updatedUser = await client.query(`
        UPDATE users
        SET password_hash = $1,
            auth_provider = CASE WHEN auth_provider = 'migrated' THEN 'password' ELSE auth_provider END,
            pending_email = NULL,
            email_verified_at = COALESCE(email_verified_at, now())
        WHERE id = $2 AND deleted_at IS NULL
      `, [passwordHash, record.user_id]);
      if (updatedUser.rowCount !== 1) {
        throw new ApiError(400, 'invalid_reset_token', 'This reset link is invalid or has expired.');
      }
      await client.query('UPDATE auth_tokens SET used_at = now() WHERE user_id = $1 AND used_at IS NULL', [record.user_id]);
      await client.query('DELETE FROM sessions WHERE user_id = $1', [record.user_id]);
      await writeAuditLog(client, request, record.user_id, 'auth.password_reset', 'user', record.user_id);
    });

    return jsonOk({ reset: true });
  } catch (error) {
    return handleApiError(error);
  }
}
