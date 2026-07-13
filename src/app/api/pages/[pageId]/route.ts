import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { transaction, query } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const contentRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);

const supportedPageIds = new Set(['about-us', 'privacy-policy', 'terms-of-service']);
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

const updateSchema = z.object({ data: z.record(z.unknown()) }).strict();

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

function parsePageData(pageId: string, data: Record<string, unknown>) {
  return pageId === 'about-us' ? aboutPageSchema.parse(data) : legalPageSchema.parse(data);
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
    const result = await query<PageRow>('SELECT id, data, updated_at FROM pages WHERE id = $1', [pageId]);
    const page = result.rows[0];

    if (page) {
      const parsed = pageId === 'about-us'
        ? aboutPageSchema.safeParse(page.data)
        : legalPageSchema.safeParse(page.data);
      if (!parsed.success) {
        console.error(`Stored page content failed validation: ${pageId}`, parsed.error.flatten());
        throw new ApiError(500, 'invalid_page_content', 'This page is temporarily unavailable.');
      }
      page.data = parsed.data;
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
