import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { defaultImpactPageContent, type ImpactPageContent } from '@/lib/impact-content';
import {
  getManagedMarketOpportunities,
  marketOpportunityPageSchema,
} from '@/lib/market-opportunities-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction, query } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const contentRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);

const supportedPageIds = new Set([
  'about-us',
  'impact',
  'market-opportunities',
  'privacy-policy',
  'terms-of-service',
]);
const unsafeHtml = /<\s*(?:script|iframe|object|embed|style|link|meta|form)\b|(?:\s|\/)on[a-z]+\s*=|(?:href|src)\s*=\s*["']?\s*(?:javascript|vbscript|data)\s*:/i;
const richText = z.string().max(100_000).refine((value) => !unsafeHtml.test(value), {
  message: 'Content contains markup that is not allowed.',
});
const localImagePath = /^\/(?!\/)(?!\.\.(?:\/|$))(?!.*\/\.\.(?:\/|$))[^?#\\\u0000-\u001f]+$/;

const teamMemberSchema = z.object({
  name: z.string().trim().min(1).max(160),
  role: z.string().trim().min(1).max(160),
  imageUrl: z.string().trim().max(2_048).refine((value) => value === '' || localImagePath.test(value), {
    message: 'Use an image from the public folder, such as /images/person.jpg.',
  }),
}).strict();

const aboutPageSchema = z.object({
  aboutTitle: z.string().trim().min(1).max(300),
  aboutSubtitle: z.string().trim().min(1).max(2_000),
  storyTitle: z.string().trim().min(1).max(300),
  storyContent1: richText,
  storyContent2: richText,
  missionTitle: z.string().trim().min(1).max(300),
  missionContent: richText,
  visionTitle: z.string().trim().min(1).max(300),
  visionContent: richText,
  valuesTitle: z.string().trim().min(1).max(300),
  valuesContent: richText,
  teamMembers: z.array(teamMemberSchema).max(50).optional(),
}).strict();

const legalPageSchema = z.object({
  title: z.string().trim().min(1).max(300),
  lastUpdated: z.string().trim().min(1).max(100),
  content: richText,
}).strict();

const impactMetricSchema = z.object({
  value: z.string().trim().min(1).max(40),
  label: z.string().trim().min(1).max(160),
  detail: z.string().trim().min(1).max(600),
}).strict();

const impactLocaleSchema = z.object({
  heroTitle: z.string().trim().min(1).max(300),
  heroSubtitle: z.string().trim().min(1).max(2_000),
  metrics: z.array(impactMetricSchema).min(1).max(8),
  methodologyTitle: z.string().trim().min(1).max(300),
  methodologyBody: z.string().trim().min(1).max(5_000),
  reportingCadence: z.string().trim().min(1).max(2_000),
  currentStatus: z.string().trim().min(1).max(2_000),
}).strict();

const impactPageSchema = z.object({
  fr: impactLocaleSchema,
  en: impactLocaleSchema,
}).strict();

// The original Impact editor stored a flat French object and exposed
// `pilotLabel` as editable content. Normalize that record on read/write,
// discard the legacy label, and add English defaults without a DB migration.
const storedImpactLocaleSchema = impactLocaleSchema.extend({
  pilotLabel: z.string().trim().min(1).max(300).optional(),
}).strict().transform(({ pilotLabel: _legacyPilotLabel, ...content }) => content);

const storedLocalizedImpactPageSchema = z.object({
  fr: storedImpactLocaleSchema,
  en: storedImpactLocaleSchema.optional(),
}).strict();

const updateSchema = z.object({
  data: z.record(z.unknown()),
  expectedUpdatedAt: z.string().datetime().nullable().optional(),
}).strict();

type PageRow = {
  id: string;
  data: Record<string, unknown>;
  updated_at: Date | string;
};

function validatePageId(pageId: string) {
  if (!supportedPageIds.has(pageId)) {
    throw new ApiError(404, 'page_not_found', 'Page not found.');
  }
}

function normalizeImpactPageData(data: Record<string, unknown>): ImpactPageContent | null {
  const localized = storedLocalizedImpactPageSchema.safeParse(data);
  if (localized.success) {
    return {
      fr: localized.data.fr,
      en: localized.data.en ?? defaultImpactPageContent.en,
    };
  }

  const legacyFrench = storedImpactLocaleSchema.safeParse(data);
  if (legacyFrench.success) {
    return {
      fr: legacyFrench.data,
      en: defaultImpactPageContent.en,
    };
  }

  return null;
}

function parsePageData(pageId: string, data: Record<string, unknown>) {
  if (pageId === 'about-us') return aboutPageSchema.parse(data);
  if (pageId === 'impact') {
    const impact = normalizeImpactPageData(data);
    // Re-run the current schema when compatibility parsing fails so callers
    // receive useful Zod field errors.
    return impact ?? impactPageSchema.parse(data);
  }
  if (pageId === 'market-opportunities') return marketOpportunityPageSchema.parse(data);
  return legalPageSchema.parse(data);
}

function safeParsePageData(pageId: string, data: Record<string, unknown>) {
  if (pageId === 'about-us') return aboutPageSchema.safeParse(data);
  if (pageId === 'market-opportunities') return marketOpportunityPageSchema.safeParse(data);
  return legalPageSchema.safeParse(data);
}

function serializePage(row: PageRow) {
  return {
    id: row.id,
    data: row.data,
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  try {
    const { pageId } = await context.params;
    validatePageId(pageId);

    // Employer source URLs are intentionally available only to the editorial
    // team here. Public cards use the sanitized market-opportunities endpoint.
    if (pageId === 'market-opportunities') {
      await requireUser(contentRoles);
      const catalog = await getManagedMarketOpportunities();
      return jsonOk({
        page: {
          id: pageId,
          data: { opportunities: catalog.opportunities },
          updatedAt: catalog.updatedAt,
          managed: catalog.managed,
        },
      });
    }

    const result = await query<PageRow>('SELECT id, data, updated_at FROM pages WHERE id = $1', [pageId]);
    const page = result.rows[0];

    if (page) {
      if (pageId === 'impact') {
        const impact = normalizeImpactPageData(page.data);
        if (!impact) {
          console.error(`Stored page content failed validation: ${pageId}`);
          throw new ApiError(500, 'invalid_page_content', 'This page is temporarily unavailable.');
        }
        page.data = impact;
      } else {
        const parsed = safeParsePageData(pageId, page.data);
        if (!parsed.success) {
          console.error(`Stored page content failed validation: ${pageId}`, parsed.error.flatten());
          throw new ApiError(500, 'invalid_page_content', 'This page is temporarily unavailable.');
        }
        page.data = parsed.data;
      }
    }

    return jsonOk({ page: page ? serializePage(page) : null });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ pageId: string }> },
) {
  try {
    assertSameOrigin(request);
    const user = await requireUser(contentRoles);
    const { pageId } = await context.params;
    validatePageId(pageId);
    const input = updateSchema.parse(await readJson(request));
    const data = parsePageData(pageId, input.data);

    const page = await transaction(async (client) => {
      await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`page:${pageId}`]);

      if (pageId === 'market-opportunities') {
        const currentResult = await client.query<Pick<PageRow, 'updated_at'>>(
          'SELECT updated_at FROM pages WHERE id = $1 FOR UPDATE',
          [pageId],
        );
        const currentUpdatedAt = currentResult.rows[0]
          ? new Date(currentResult.rows[0].updated_at).toISOString()
          : null;
        if (currentUpdatedAt !== (input.expectedUpdatedAt ?? null)) {
          throw new ApiError(
            409,
            'page_conflict',
            'This catalog changed after you opened it. Refresh before saving.',
          );
        }
      }

      const result = await client.query<PageRow>(`
        INSERT INTO pages (id, data, updated_by)
        VALUES ($1, $2::jsonb, $3)
        ON CONFLICT (id) DO UPDATE SET
          data = EXCLUDED.data,
          updated_by = EXCLUDED.updated_by
        RETURNING id, data, updated_at
      `, [pageId, JSON.stringify(data), user.uid]);
      const updated = result.rows[0];
      await writeAuditLog(client, request, user.uid, 'page.update', 'page', pageId);
      return updated;
    });

    return jsonOk({ page: serializePage(page) });
  } catch (error) {
    return handleApiError(error);
  }
}
