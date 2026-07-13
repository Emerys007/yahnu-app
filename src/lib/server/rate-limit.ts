import 'server-only';

import { ApiError, clientAddress, privacyHash } from '@/lib/server/http';
import { query } from '@/lib/server/db';

type RateLimitRow = { count: number; reset_at: Date };

export async function enforceRateLimitSubject(scope: string, limit: number, windowSeconds: number, subject: string) {
  const subjectHash = privacyHash(subject.toLowerCase());
  await query(`DELETE FROM rate_limits WHERE reset_at < now() - interval '1 day'`);
  const result = await query<RateLimitRow>(`
    INSERT INTO rate_limits (scope, subject_hash, count, reset_at)
    VALUES ($1, $2, 1, now() + ($3 * interval '1 second'))
    ON CONFLICT (scope, subject_hash) DO UPDATE SET
      count = CASE WHEN rate_limits.reset_at <= now() THEN 1 ELSE rate_limits.count + 1 END,
      reset_at = CASE WHEN rate_limits.reset_at <= now() THEN now() + ($3 * interval '1 second') ELSE rate_limits.reset_at END
    RETURNING count, reset_at
  `, [scope, subjectHash, windowSeconds]);

  const current = result.rows[0];
  if (current && current.count > limit) {
    const retryAfter = Math.max(1, Math.ceil((new Date(current.reset_at).getTime() - Date.now()) / 1000));
    throw new ApiError(429, 'rate_limited', `Too many attempts. Try again in ${retryAfter} seconds.`);
  }
}

export async function enforceRateLimit(request: Request, scope: string, limit: number, windowSeconds: number, identity?: string) {
  const address = clientAddress(request);
  const subject = identity ? `${address}:${identity}` : address;
  await enforceRateLimitSubject(scope, limit, windowSeconds, subject);
}
