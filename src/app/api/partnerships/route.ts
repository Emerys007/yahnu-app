import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import { serializePartnership, type PartnershipRow } from '@/lib/careers-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit } from '@/lib/server/rate-limit';
import { sourceHash } from '@/lib/server/source-hash';

const partnershipRoles = new Set<'company' | 'school'>(['company', 'school']);
const listSchema = z.object({
  status: z.string().trim().max(100).default('all'),
  direction: z.enum(['all', 'incoming', 'outgoing']).default('all'),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();
const createSchema = z.object({ partnerId: z.string().trim().min(1).max(1_500) }).strict();

const partnershipSelect = `
  partnership.id, partnership.requester_id,
  requester.name AS requester_name, requester.role AS requester_role,
  requester.company_name AS requester_company_name,
  requester.school_name AS requester_school_name,
  partnership.partner_id, partner.name AS partner_name, partner.role AS partner_role,
  partner.company_name AS partner_company_name, partner.school_name AS partner_school_name,
  partnership.organization_name, partnership.status,
  partnership.created_at, partnership.updated_at
`;

export async function GET(request: Request) {
  try {
    const actor = await requireUser(partnershipRoles);
    const url = new URL(request.url);
    const input = listSchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      direction: url.searchParams.get('direction') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    const result = await query<PartnershipRow>(`
      SELECT ${partnershipSelect}
      FROM partnerships partnership
      LEFT JOIN users requester ON requester.id = partnership.requester_id AND requester.deleted_at IS NULL
      LEFT JOIN users partner ON partner.id = partnership.partner_id AND partner.deleted_at IS NULL
      WHERE (partnership.requester_id = $1 OR partnership.partner_id = $1)
        AND ($2 = 'all' OR partnership.status = $2)
        AND ($3 = 'all'
          OR ($3 = 'incoming' AND partnership.partner_id = $1)
          OR ($3 = 'outgoing' AND partnership.requester_id = $1))
      ORDER BY
        CASE WHEN partnership.status = 'pending' THEN 0 WHEN partnership.status = 'accepted' THEN 1 ELSE 2 END,
        partnership.updated_at DESC,
        partnership.id
      LIMIT $4 OFFSET $5
    `, [actor.uid, input.status, input.direction, input.limit + 1, input.offset]);
    return jsonOk({
      partnerships: result.rows.slice(0, input.limit).map((row) => serializePartnership(row, actor.uid)),
      hasMore: result.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, result.rows.length),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(partnershipRoles);
    await enforceRateLimit(request, 'partnership-create', 20, 24 * 60 * 60, actor.uid);
    const input = createSchema.parse(await readJson(request, 4 * 1024));
    if (input.partnerId === actor.uid) throw new ApiError(422, 'invalid_partner', 'Select another organization.');

    const created = await transaction(async (client) => {
      const pair = [actor.uid, input.partnerId].sort().join(':');
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`partnership:${pair}`]);
      const targetResult = await client.query<{
        id: string;
        name: string;
        role: 'company' | 'school';
        company_name: string | null;
        school_name: string | null;
      }>(`
        SELECT id, name, role, company_name, school_name
        FROM users
        WHERE id = $1 AND deleted_at IS NULL AND status = 'active'
          AND role = $2
        FOR SHARE
      `, [input.partnerId, actor.role === 'company' ? 'school' : 'company']);
      const target = targetResult.rows[0];
      if (!target) throw new ApiError(404, 'partner_not_found', 'That organization is not available.');

      const existing = await client.query(`
        SELECT 1 FROM partnerships
        WHERE status IN ('pending', 'accepted')
          AND ((requester_id = $1 AND partner_id = $2)
            OR (requester_id = $2 AND partner_id = $1))
        LIMIT 1
      `, [actor.uid, target.id]);
      if (existing.rows[0]) throw new ApiError(409, 'partnership_exists', 'A pending or active partnership already exists.');

      const id = randomUUID();
      const organizationName = actor.companyName || actor.schoolName || actor.name || 'Yahnu organization';
      const metadata = { origin: 'render', requesterId: actor.uid, partnerId: target.id };
      await client.query(`
        INSERT INTO partnerships (
          id, requester_id, requester_ref, partner_id, partner_ref,
          organization_name, contact_email, status, source_payload,
          source_hash, source_updated_at
        ) VALUES ($1, $2, $2, $3, $3, $4, $5, 'pending', $6::jsonb, $7, now())
      `, [id, actor.uid, target.id, organizationName, actor.email, JSON.stringify(metadata), sourceHash(metadata)]);

      const notificationId = randomUUID();
      const notificationSource = { origin: 'render', partnershipId: id, recipientId: target.id };
      await client.query(`
        INSERT INTO notifications (
          id, user_id, recipient_ref, created_by, actor_ref, type,
          title, body, link, payload, source_payload, source_hash
        ) VALUES ($1, $2, $2, $3, $3, 'partnership',
          'Partnership request', $4, '/dashboard/partnerships', $5::jsonb, $5::jsonb, $6)
      `, [
        notificationId,
        target.id,
        actor.uid,
        `${organizationName} sent your organization a partnership request.`,
        JSON.stringify(notificationSource),
        sourceHash(notificationSource),
      ]);
      await writeAuditLog(client, request, actor.uid, 'partnership.create', 'partnership', id, { partnerId: target.id });

      const result = await client.query<PartnershipRow>(`
        SELECT ${partnershipSelect}
        FROM partnerships partnership
        LEFT JOIN users requester ON requester.id = partnership.requester_id
        LEFT JOIN users partner ON partner.id = partnership.partner_id
        WHERE partnership.id = $1
      `, [id]);
      return result.rows[0];
    });

    return jsonOk({ partnership: serializePartnership(created, actor.uid) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
