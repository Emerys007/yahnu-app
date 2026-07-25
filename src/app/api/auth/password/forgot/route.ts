import { randomInt } from 'node:crypto';
import { z } from 'zod';

import { hashToken, newOpaqueToken } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { assertEmailDeliveryConfigured, sendPasswordResetEmail } from '@/lib/server/email';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import {
  PASSWORD_FORGOT_RESPONSE_JITTER_MS,
  PASSWORD_RESET_ISSUANCE_DEBOUNCE_MINUTES,
  waitForNeutralRecoveryTiming,
} from '@/lib/server/password-recovery-policy.mjs';
import { consumeRateLimitSubject, enforceRateLimit } from '@/lib/server/rate-limit';

const schema = z.object({
  email: z.string().trim().email().max(320).transform((value) => value.toLowerCase()),
}).strict();

function accepted(debugUrl?: string) {
  return jsonOk({
    accepted: true,
    message: 'If an account exists for that address, a secure reset link is on its way.',
    ...(debugUrl ? { debugUrl } : {}),
  });
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'password_forgot_ip', 20, 60 * 60);
    const { email } = schema.parse(await readJson(request));
    await enforceRateLimit(request, 'password_forgot_account_ip', 4, 60 * 60, email);
    const startedAt = Date.now();

    // This check depends only on global service configuration, never on the
    // submitted address, so an honest 503 cannot reveal whether an account exists.
    assertEmailDeliveryConfigured();

    // These privacy-hashed, address-only limits stop distributed clients from
    // bypassing the IP+address limit. Exhaustion is intentionally returned as
    // the same accepted response rather than revealing address-specific state.
    const hourly = await consumeRateLimitSubject('password_forgot_email_hour', 3, 60 * 60, email);
    const daily = await consumeRateLimitSubject('password_forgot_email_day', 6, 24 * 60 * 60, email);
    const jitter = randomInt(0, PASSWORD_FORGOT_RESPONSE_JITTER_MS + 1);
    if (!hourly.allowed || !daily.allowed) {
      await waitForNeutralRecoveryTiming(startedAt, jitter);
      return accepted();
    }

    const user = await query<{ id: string; name: string; email: string }>(`
      SELECT id, name, email FROM users WHERE lower(email) = $1 AND deleted_at IS NULL LIMIT 1
    `, [email]);

    let debugUrl: string | undefined;
    const record = user.rows[0];
    if (record) {
      const token = newOpaqueToken();
      const issued = await transaction(async (client) => {
        const lockedUser = await client.query(
          'SELECT id FROM users WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
          [record.id],
        );
        if (lockedUser.rowCount !== 1) return false;

        const recentToken = await client.query(`
          SELECT 1 FROM auth_tokens
          WHERE user_id = $1
            AND purpose = 'reset_password'
            AND used_at IS NULL
            AND expires_at > now()
            AND created_at > now() - ($2 * interval '1 minute')
          LIMIT 1
        `, [record.id, PASSWORD_RESET_ISSUANCE_DEBOUNCE_MINUTES]);
        if (recentToken.rowCount) return false;

        // Preserve older, still-valid links instead of letting a later request
        // invalidate a graduate's in-flight recovery attempt.
        await client.query(`
          DELETE FROM auth_tokens
          WHERE user_id = $1
            AND purpose = 'reset_password'
            AND (used_at IS NOT NULL OR expires_at <= now())
        `, [record.id]);
        await client.query(`
          INSERT INTO auth_tokens (token_hash, user_id, purpose, expires_at)
          VALUES ($1, $2, 'reset_password', now() + interval '1 hour')
        `, [hashToken(token), record.id]);
        return true;
      });

      if (issued) {
        try {
          debugUrl = (await sendPasswordResetEmail(record.email, record.name, token)).debugUrl;
        } catch {
          // Runtime provider failures remain indistinguishable from an unknown
          // address to prevent account enumeration.
          console.error('Unable to deliver password reset email after request acceptance.');
        }
      }
    }

    await waitForNeutralRecoveryTiming(
      startedAt,
      randomInt(0, PASSWORD_FORGOT_RESPONSE_JITTER_MS + 1),
    );
    return accepted(debugUrl);
  } catch (error) {
    return handleApiError(error);
  }
}
