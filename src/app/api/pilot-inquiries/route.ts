import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import {
  isLikelyAutomatedInquiry,
  pilotInquiryStatuses,
  pilotInquirySubmissionSchema,
} from '@/lib/pilot-inquiries';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { enforceRateLimit, enforceRateLimitSubject } from '@/lib/server/rate-limit';

const intakeRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'support_staff']);
const listSchema = z.object({
  status: z.enum(['all', ...pilotInquiryStatuses]).default('all'),
  limit: z.coerce.number().int().min(1).max(200).default(50),
  offset: z.coerce.number().int().min(0).max(1_000_000).default(0),
}).strict();

type PilotInquiryRow = {
  id: string;
  kind: string;
  full_name: string;
  email: string;
  phone: string | null;
  organization_name: string;
  organization_type: string;
  role_title: string | null;
  city: string | null;
  country_code: string;
  participant_estimate: number | null;
  timeline: string;
  message: string;
  locale: 'fr' | 'en';
  source: string;
  campaign: string | null;
  status: string;
  internal_notes: string | null;
  consented_at: Date | string;
  retention_expires_at: Date | string;
  created_at: Date | string;
  updated_at: Date | string;
};

function serializeInquiry(row: PilotInquiryRow) {
  return {
    id: row.id,
    kind: row.kind,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? undefined,
    organizationName: row.organization_name,
    organizationType: row.organization_type,
    roleTitle: row.role_title ?? undefined,
    city: row.city ?? undefined,
    countryCode: row.country_code,
    participantEstimate: row.participant_estimate ?? undefined,
    timeline: row.timeline,
    message: row.message,
    locale: row.locale,
    source: row.source,
    campaign: row.campaign ?? undefined,
    status: row.status,
    internalNotes: row.internal_notes ?? undefined,
    consentedAt: new Date(row.consented_at).toISOString(),
    retentionExpiresAt: new Date(row.retention_expires_at).toISOString(),
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

async function purgeExpiredInquiries() {
  await query('DELETE FROM pilot_inquiries WHERE retention_expires_at <= now()');
}

export async function GET(request: Request) {
  try {
    await requireUser(intakeRoles);
    const url = new URL(request.url);
    const input = listSchema.parse({
      status: url.searchParams.get('status') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    await purgeExpiredInquiries();

    const [inquiries, summary] = await Promise.all([
      query<PilotInquiryRow>(`
        SELECT id, kind, full_name, email, phone, organization_name, organization_type,
          role_title, city, country_code, participant_estimate, timeline, message,
          locale, source, campaign, status, internal_notes, consented_at,
          retention_expires_at, created_at, updated_at
        FROM pilot_inquiries
        WHERE ($1 = 'all' OR status = $1)
        ORDER BY
          CASE status
            WHEN 'new' THEN 0
            WHEN 'reviewing' THEN 1
            WHEN 'contacted' THEN 2
            WHEN 'qualified' THEN 3
            ELSE 4
          END,
          created_at DESC
        LIMIT $2 OFFSET $3
      `, [input.status, input.limit + 1, input.offset]),
      query<Record<(typeof pilotInquiryStatuses)[number], string>>(`
        SELECT
          count(*) FILTER (WHERE status = 'new')::text AS new,
          count(*) FILTER (WHERE status = 'reviewing')::text AS reviewing,
          count(*) FILTER (WHERE status = 'contacted')::text AS contacted,
          count(*) FILTER (WHERE status = 'qualified')::text AS qualified,
          count(*) FILTER (WHERE status = 'closed')::text AS closed
        FROM pilot_inquiries
      `),
    ]);
    const counts = summary.rows[0];

    return jsonOk({
      inquiries: inquiries.rows.slice(0, input.limit).map(serializeInquiry),
      hasMore: inquiries.rows.length > input.limit,
      nextOffset: input.offset + Math.min(input.limit, inquiries.rows.length),
      summary: Object.fromEntries(
        pilotInquiryStatuses.map((status) => [status, Number(counts?.[status] ?? 0)]),
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    await enforceRateLimit(request, 'pilot-inquiry-ip-hour', 8, 60 * 60);
    const input = pilotInquirySubmissionSchema.parse(await readJson(request, 12 * 1024));
    const reference = randomUUID();

    // Honeypot submissions receive the same neutral acknowledgement but are
    // never persisted. This gives simple bots no signal to adapt against.
    if (isLikelyAutomatedInquiry(input)) {
      return jsonOk({ accepted: true, reference, receivedAt: new Date().toISOString() }, { status: 201 });
    }

    await enforceRateLimit(request, 'pilot-inquiry-email-ip-day', 3, 24 * 60 * 60, input.email);
    await enforceRateLimitSubject('pilot-inquiry-email-day', 5, 24 * 60 * 60, input.email);

    const received = await transaction(async (client) => {
      await client.query('DELETE FROM pilot_inquiries WHERE retention_expires_at <= now()');
      const result = await client.query<{ created_at: Date | string }>(`
        INSERT INTO pilot_inquiries (
          id, kind, full_name, email, phone, organization_name, organization_type,
          role_title, city, country_code, participant_estimate, timeline, message,
          locale, source, campaign, consented_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, now()
        )
        RETURNING created_at
      `, [
        reference,
        input.kind,
        input.fullName,
        input.email,
        input.phone ?? null,
        input.organizationName,
        input.organizationType,
        input.roleTitle ?? null,
        input.city ?? null,
        input.countryCode,
        input.participantEstimate ?? null,
        input.timeline,
        input.message,
        input.locale,
        input.source,
        input.campaign ?? null,
      ]);
      await writeAuditLog(client, request, null, 'pilot_inquiry.create', 'pilot_inquiry', reference, {
        kind: input.kind,
        organizationType: input.organizationType,
        countryCode: input.countryCode,
        source: input.source,
      });
      return result.rows[0].created_at;
    });

    return jsonOk({
      accepted: true,
      reference,
      receivedAt: new Date(received).toISOString(),
    }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
