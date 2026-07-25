import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { hashToken } from '@/lib/server/auth';
import { query } from '@/lib/server/db';
import { ApiError, handleApiError, jsonOk } from '@/lib/server/http';

export const dynamic = 'force-dynamic';

function maskEmail(email: string) {
  const [local, domain] = email.split('@');
  if (!domain) return 'hidden';
  const visible = local.slice(0, Math.min(2, local.length));
  return `${visible}${'*'.repeat(Math.max(2, local.length - visible.length))}@${domain}`;
}

export async function GET(_request: Request, context: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await context.params;
    z.string().min(20).max(500).parse(token);
    const result = await query<{ email: string; role: Role; expires_at: Date }>(`
      SELECT email, role, expires_at FROM invites
      WHERE token_hash = $1 AND status = 'pending' AND expires_at > now()
      LIMIT 1
    `, [hashToken(token)]);
    const invite = result.rows[0];
    if (!invite) throw new ApiError(404, 'invalid_invitation', 'This invitation is invalid or has expired.');
    return jsonOk({ maskedEmail: maskEmail(invite.email), role: invite.role, expiresAt: new Date(invite.expires_at).toISOString() });
  } catch (error) {
    return handleApiError(error);
  }
}

