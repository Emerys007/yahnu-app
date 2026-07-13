import { z } from 'zod';

import { hashToken, newOpaqueToken } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { sendPasswordResetEmail } from '@/lib/server/email';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
}).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'password_forgot_ip', 20, 60 * 60);
    const { email } = schema.parse(await readJson(request));
    await enforceRateLimit(request, 'password_forgot_account_ip', 4, 60 * 60, email);

    const user = await query<{ id: string; name: string; email: string }>(`
      SELECT id, name, email FROM users WHERE lower(email) = $1 AND deleted_at IS NULL LIMIT 1
    `, [email]);

    let debugUrl: string | undefined;
    const record = user.rows[0];
    if (record) {
      const token = newOpaqueToken();
      await transaction(async (client) => {
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [record.id]);
        await client.query(`DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'reset_password' AND used_at IS NULL`, [record.id]);
        await client.query(`
          INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at)
          VALUES ($1, $2, 'reset_password', now() + interval '1 hour')
        `, [hashToken(token), record.id]);
      });
      try {
        debugUrl = (await sendPasswordResetEmail(record.email, record.name, token)).debugUrl;
      } catch (error) {
        console.error('Unable to deliver password reset email:', error);
      }
    }

    return jsonOk({
      accepted: true,
      message: 'If an account exists for that address, a secure reset link is on its way.',
      ...(process.env.NODE_ENV !== 'production' && debugUrl ? { debugUrl } : {}),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
