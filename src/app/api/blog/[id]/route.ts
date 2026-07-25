import { z } from 'zod';

import type { BlogPostInput } from '@/lib/blog';
import type { Role } from '@/lib/auth-types';
import {
  blogPostSelectColumns,
  blogPostPatchSchema,
  blogWriteSourceMetadata,
  isPostgresUniqueViolation,
  mergeBlogPostInput,
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
const identifierSchema = z.string().trim().min(1).max(200).regex(/^[A-Za-z0-9_-]+$/);
const scopeSchema = z.enum(['published', 'all']).default('published');

function asInput(row: BlogPostRow): BlogPostInput {
  return {
    title: row.title,
    slug: row.slug,
    author: row.author,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    status: row.status,
    imageUrl: row.image_url,
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const identifier = identifierSchema.parse((await context.params).id);
    const scope = scopeSchema.parse(new URL(request.url).searchParams.get('scope') ?? undefined);
    if (scope === 'all') await requireUser(blogEditorRoles);

    const result = await query<BlogPostRow>(`
      SELECT ${blogPostSelectColumns}
      FROM blog_posts b
      WHERE (b.id = $1 OR b.slug = $1)
        ${scope === 'published' ? "AND b.status = 'published'" : ''}
      ORDER BY CASE WHEN b.id = $1 THEN 0 ELSE 1 END
      LIMIT 1
    `, [identifier]);
    const post = result.rows[0];
    if (!post) throw new ApiError(404, 'blog_post_not_found', 'Article introuvable.');
    return jsonOk({ post: serializeBlogPost(post) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(blogEditorRoles);
    const id = identifierSchema.parse((await context.params).id);
    const patch = blogPostPatchSchema.parse(await readJson(request, 256 * 1024));

    const updated = await transaction(async (client) => {
      const currentResult = await client.query<BlogPostRow>(`
        SELECT ${blogPostSelectColumns}
        FROM blog_posts b
        WHERE b.id = $1
        FOR UPDATE
      `, [id]);
      const current = currentResult.rows[0];
      if (!current) throw new ApiError(404, 'blog_post_not_found', 'Article introuvable.');

      const input = mergeBlogPostInput(asInput(current), patch);
      const imageAssetId = mediaAssetIdFromBlogImageUrl(input.imageUrl);
      if (imageAssetId) {
        const media = await client.query('SELECT 1 FROM media_assets WHERE id = $1', [imageAssetId]);
        if (!media.rows[0]) throw new ApiError(422, 'invalid_image', 'L’image sélectionnée n’existe plus.');
      }
      const { sourcePayload, sourceHash } = blogWriteSourceMetadata(input, actor.uid);
      await client.query(`
        UPDATE blog_posts SET
          slug = $2,
          title = $3,
          author = $4,
          excerpt = $5,
          content_html = $6,
          status = $7,
          image_url = $8,
          image_asset_id = $9,
          source_payload = $10::jsonb,
          source_hash = $11,
          source_updated_at = now(),
          published_at = CASE
            WHEN $7 <> 'published' THEN NULL
            WHEN status <> 'published' OR published_at IS NULL THEN now()
            ELSE published_at
          END
        WHERE id = $1
      `, [
        id, input.slug, input.title, input.author, input.excerpt,
        input.contentHtml, input.status, input.imageUrl, imageAssetId,
        JSON.stringify(sourcePayload), sourceHash,
      ]);
      const result = await client.query<BlogPostRow>(`
        SELECT ${blogPostSelectColumns}
        FROM blog_posts b
        WHERE b.id = $1
      `, [id]);
      const post = result.rows[0];
      await writeAuditLog(client, request, actor.uid, 'blog.update', 'blog_post', id, {
        slug: post.slug,
        fromStatus: current.status,
        toStatus: post.status,
      });
      return post;
    });

    return jsonOk({ post: serializeBlogPost(updated) });
  } catch (error) {
    if (isPostgresUniqueViolation(error)) {
      return handleApiError(new ApiError(409, 'slug_already_exists', 'Ce slug est déjà utilisé par un autre article.'));
    }
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    assertSameOrigin(request);
    const actor = await requireUser(blogEditorRoles);
    const id = identifierSchema.parse((await context.params).id);

    await transaction(async (client) => {
      const result = await client.query<Pick<BlogPostRow, 'id' | 'slug' | 'status'>>(`
        DELETE FROM blog_posts
        WHERE id = $1
        RETURNING id, slug, status
      `, [id]);
      const deleted = result.rows[0];
      if (!deleted) throw new ApiError(404, 'blog_post_not_found', 'Article introuvable.');
      await writeAuditLog(client, request, actor.uid, 'blog.delete', 'blog_post', id, {
        slug: deleted.slug,
        status: deleted.status,
      });
    });

    return jsonOk({ deleted: true });
  } catch (error) {
    return handleApiError(error);
  }
}
