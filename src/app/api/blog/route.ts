import { randomUUID } from 'node:crypto';
import { z } from 'zod';

import type { Role } from '@/lib/auth-types';
import {
  blogPostListSelectColumns,
  blogPostSelectColumns,
  blogPostInputSchema,
  blogWriteSourceMetadata,
  isPostgresUniqueViolation,
  mediaAssetIdFromBlogImageUrl,
  serializeBlogPost,
  type BlogPostRow,
} from '@/lib/blog-server';
import { requireUser, writeAuditLog } from '@/lib/server/auth';
import { query, transaction } from '@/lib/server/db';
import { ApiError, assertSameOrigin, handleApiError, jsonOk, readJson } from '@/lib/server/http';

const blogEditorRoles: ReadonlySet<Role> = new Set([
  'admin',
  'super_admin',
  'content_manager',
  'content_moderator',
]);

const listSchema = z.object({
  scope: z.enum(['published', 'all']).default('published'),
  q: z.string().trim().max(100).default(''),
  limit: z.coerce.number().int().min(1).max(100).default(24),
  offset: z.coerce.number().int().min(0).max(100_000).default(0),
}).strict();

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const input = listSchema.parse({
      scope: url.searchParams.get('scope') ?? undefined,
      q: url.searchParams.get('q') ?? undefined,
      limit: url.searchParams.get('limit') ?? undefined,
      offset: url.searchParams.get('offset') ?? undefined,
    });

    if (input.scope === 'all') await requireUser(blogEditorRoles);

    const filters = input.scope === 'published'
      ? "b.status = 'published'"
      : 'TRUE';
    const search = input.q
      ? "AND (b.title ILIKE $1 OR b.author ILIKE $1 OR b.excerpt ILIKE $1)"
      : '';
    const requestedRows = input.limit + 1;
    const values = input.q
      ? [`%${input.q}%`, requestedRows, input.offset]
      : [requestedRows, input.offset];
    const limitParameter = input.q ? '$2' : '$1';
    const offsetParameter = input.q ? '$3' : '$2';
    const result = await query<BlogPostRow>(`
      SELECT ${blogPostListSelectColumns}
      FROM blog_posts b
      WHERE ${filters} ${search}
      ORDER BY
        CASE WHEN b.status = 'published' THEN 0 ELSE 1 END,
        b.published_at DESC NULLS LAST,
        b.created_at DESC
      LIMIT ${limitParameter}
      OFFSET ${offsetParameter}
    `, values);

    return jsonOk({
      posts: result.rows.slice(0, input.limit).map(serializeBlogPost),
      hasMore: result.rows.length > input.limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(blogEditorRoles);
    const input = blogPostInputSchema.parse(await readJson(request, 256 * 1024));
    const imageAssetId = mediaAssetIdFromBlogImageUrl(input.imageUrl);
    const { sourcePayload, sourceHash } = blogWriteSourceMetadata(input, actor.uid);

    const created = await transaction(async (client) => {
      if (imageAssetId) {
        const media = await client.query('SELECT 1 FROM media_assets WHERE id = $1', [imageAssetId]);
        if (!media.rows[0]) throw new ApiError(422, 'invalid_image', 'L’image sélectionnée n’existe plus.');
      }
      const id = randomUUID();
      await client.query(`
        INSERT INTO blog_posts (
          id, slug, title, author, excerpt, content_html, status, image_url,
          created_by, image_asset_id, published_at, source_payload,
          source_hash, source_updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
          CASE WHEN $7 = 'published' THEN now() ELSE NULL END,
          $11::jsonb, $12, now()
        )
      `, [
        id, input.slug, input.title, input.author, input.excerpt,
        input.contentHtml, input.status, input.imageUrl, actor.uid,
        imageAssetId,
        JSON.stringify(sourcePayload), sourceHash,
      ]);
      const result = await client.query<BlogPostRow>(`
        SELECT ${blogPostSelectColumns}
        FROM blog_posts b
        WHERE b.id = $1
      `, [id]);
      const post = result.rows[0];
      await writeAuditLog(client, request, actor.uid, 'blog.create', 'blog_post', post.id, {
        slug: post.slug,
        status: post.status,
      });
      return post;
    });

    return jsonOk({ post: serializeBlogPost(created) }, { status: 201 });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return handleApiError(new ApiError(409, 'slug_already_exists', 'Ce slug est déjà utilisé par un autre article.'));
    }
    return handleApiError(error);
  }
}
