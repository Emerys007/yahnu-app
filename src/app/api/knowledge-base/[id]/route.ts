import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import { isValidatedBlogHtml } from '@/lib/blog-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';
import { sourceHash } from '@/lib/server/source-hash';

const editorRoles: ReadonlySet<Role> = new Set(['admin', 'super_admin', 'content_manager', 'content_moderator', 'support_staff']);
const paramsSchema = z.object({ id: z.string().trim().min(1).max(160) });
const scopeSchema = z.enum(['published', 'all']).default('published');
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

const mapArticle = (row: ArticleRow) => ({
  id: row.id,
  title: row.title,
  category: row.category,
  content: row.content_html,
  status: row.status,
  createdAt: new Date(row.created_at).toISOString(),
  updatedAt: new Date(row.updated_at).toISOString(),
});

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const { id } = paramsSchema.parse(await context.params);
    const scope = scopeSchema.parse(new URL(request.url).searchParams.get('scope') ?? undefined);
    await requireUser(scope === 'all' ? editorRoles : undefined);
    const result = await query<ArticleRow>(`
      SELECT id, title, category, content_html, status, created_at, updated_at
      FROM knowledge_base_articles
      WHERE id = $1 AND ($2::text = 'all' OR status = 'published')
      LIMIT 1
    `, [id, scope]);
    if (!result.rows[0]) throw new ApiError(404, 'article_not_found', 'This article no longer exists.');
    return jsonOk({ article: mapArticle(result.rows[0]) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(editorRoles);
    const { id } = paramsSchema.parse(await context.params);
    const input = inputSchema.parse(await readJson(request));
    const sourcePayload = { ...input, origin: 'render' };
    const row = await transaction(async (client) => {
      const result = await client.query<ArticleRow>(`
        UPDATE knowledge_base_articles
        SET title = $1, category = $2, content_html = $3, status = $4,
          source_payload = $5::jsonb, source_hash = $6
        WHERE id = $7
        RETURNING id, title, category, content_html, status, created_at, updated_at
      `, [input.title, input.category, input.content, input.status, JSON.stringify(sourcePayload), sourceHash(sourcePayload), id]);
      if (!result.rows[0]) throw new ApiError(404, 'article_not_found', 'This article no longer exists.');
      await writeAuditLog(client, request, actor.uid, 'knowledge_base.update', 'knowledge_base_article', id, { status: input.status });
      return result.rows[0];
    });
    return jsonOk({ article: mapArticle(row) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(editorRoles);
    const { id } = paramsSchema.parse(await context.params);
    await transaction(async (client) => {
      const result = await client.query('DELETE FROM knowledge_base_articles WHERE id = $1', [id]);
      if (!result.rowCount) throw new ApiError(404, 'article_not_found', 'This article no longer exists.');
      await writeAuditLog(client, request, actor.uid, 'knowledge_base.delete', 'knowledge_base_article', id);
    });
    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
