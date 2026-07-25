import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { isValidatedBlogHtml } from '@/lib/blog-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sourceHash } from '@/lib/server/source-hash';

const editorRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']);
const scopeSchema = z.enum(['published', 'all']).default('all');
const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(30),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
});
const inputSchema = z.object({
  title: z.string().trim().min(1).max(180),
  category: z.string().trim().min(1).max(100),
  content: z.string().trim().min(50).max(100_000)
    .refine(isValidatedBlogHtml, 'Le contenu contient du balisage non autorisé.'),
  status: z.enum(['draft', 'published']).default('published'),
}).strict();

type ArticleRow = {
  id: string;
  title: string;
  category: string;
  content_html: string;
  status: 'draft' | 'published';
  created_at: Date | string;
  updated_at: Date | string;
};

type ArticleListRow = Omit<ArticleRow, 'content_html'> & {
  content_preview: string;
};

const mapArticle = (row: ArticleRow) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  content: row.content_html,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

const mapArticleSummary = (row: ArticleListRow) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  contentPreview: row.content_preview,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const scope = scopeSchema.parse(url.searchParams.get('scope') ?? undefined);
    const { limit, offset } = listQuerySchema.parse({
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });
    await requireUser(scope === 'all' ? editorRoles : undefined);
    const result = await query<ArticleListRow>(`
      SELECT id, title, category,
        LEFT(regexp_replace(content_html, '<[^>]*>', ' ', 'g'), 480) AS content_preview,
        status, created_at, updated_at
      FROM knowledge_base_articles
      WHERE ($1::text = 'all' OR status = 'published')
      ORDER BY updated_at DESC, id DESC
      LIMIT $2 OFFSET $3
    `, [scope, limit + 1, offset]);
    const hasMore = result.rows.length > limit;
    return jsonOk({
      articles: result.rows.slice(0, limit).map(mapArticleSummary),
      hasMore,
      nextOffset: hasMore ? offset + limit : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(editorRoles);
    const input = inputSchema.parse(await readJson(request));
    const id = randomUUID();
    const sourcePayload = { ...input, origin: 'render' };
    const row = await transaction(async (client) => {
      const result = await client.query<ArticleRow>(`
        INSERT INTO knowledge_base_articles (id, title, category, content_html, status, created_by, source_payload, source_hash)
        VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8)
        RETURNING id, title, category, content_html, status, created_at, updated_at
      `, [id, input.title, input.category, input.content, input.status, actor.uid, JSON.stringify(sourcePayload), sourceHash(sourcePayload)]);
      await writeAuditLog(client, request, actor.uid, 'knowledge_base.create', 'knowledge_base_article', id, { status: input.status });
      return result.rows[0];
    });
    return jsonOk({ article: mapArticle(row) }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
