import { z } from 'zod';

import { hashToken, newOpaqueToken } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { sendVerificationEmail } from '@/lib/server/email';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';

const schema = z.object({ email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()) }).strict();

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'verify_resend_ip', 15, 60 * 60);
    const { email } = schema.parse(await readJson(request));
    await enforceRateLimit(request, 'verify_resend_account_ip', 3, 60 * 60, email);
    const result = await query<{ id: string; email: string; name: string }>(`
      SELECT id, email, name FROM users
      WHERE lower(email) = $1 AND email_verified_at IS NULL AND deleted_at IS NULL
      LIMIT 1
    `, [email]);

    let debugUrl: string | undefined;
    const user = result.rows[0];
    if (user) {
      const token = newOpaqueToken();
      await transaction(async (client) => {
        await client.query('SELECT id FROM users WHERE id = $1 FOR UPDATE', [user.id]);
        await client.query(`DELETE FROM auth_tokens WHERE user_id = $1 AND purpose = 'verify_email' AND used_at IS NULL`, [user.id]);
        await client.query(`INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at) VALUES ($1, $2, 'verify_email', now() + interval '24 hours')`, [hashToken(token), user.id]);
      });
      try {
        debugUrl = (await sendVerificationEmail(user.email, user.name, token)).debugUrl;
      } catch (error) {
        console.error('Unable to resend verification email:', error);
      }
    }

    return jsonOk({ accepted: true, ...(debugUrl ? { debugUrl } : {}) });
  } catch (error) {
    return handleApiError(error);
  }
}
