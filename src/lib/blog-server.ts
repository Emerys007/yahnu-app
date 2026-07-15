import 'server-only';

import { createHash } from 'node:crypto';
import { z } from 'zod';

import {
  BLOG_SLUG_PATTERN,
  BLOG_STATUSES,
  blogHtmlToPlainText,
  isSafeBlogImageUrl,
  type BlogPost,
  type BlogPostInput,
  type BlogStatus,
} from '@/lib/blog';
import { query } from '@/lib/server/db';

const allowedTags = new Set([
  'a', 'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre',
  'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li',
]);
const forbiddenMarkup = /<\s*(?:script|iframe|object|embed|style|link|meta|form|input|button|svg|math)\b|(?:\s|\/)on[a-z]+\s*=|\s(?:style|srcdoc)\s*=/i;
const tagPattern = /<\/?\s*([a-z][a-z0-9-]*)\b[^>]*>/gi;
const hrefPattern = /\shref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/gi;

function decodeUrlForValidation(value: string) {
  return value
    .replace(/&#x0*([0-9a-f]+);?/gi, (_match, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#0*([0-9]+);?/g, (_match, decimal: string) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&colon;/gi, ':')
    .replace(/&tab;|&newline;/gi, '')
    .replace(/[\u0000-\u0020\u007f]+/g, '')
    .toLowerCase();
}

export function isValidatedBlogHtml(value: string) {
  if (forbiddenMarkup.test(value)) return false;

  tagPattern.lastIndex = 0;
  for (let match = tagPattern.exec(value); match; match = tagPattern.exec(value)) {
    if (!allowedTags.has(match[1].toLowerCase())) return false;
  }

  hrefPattern.lastIndex = 0;
  for (let match = hrefPattern.exec(value); match; match = hrefPattern.exec(value)) {
    const href = decodeUrlForValidation(match[1] ?? match[2] ?? match[3] ?? '');
    if (!/^(?:https?:|mailto:|\/(?!\/)|#)/.test(href)) return false;
  }

  return true;
}

const optionalImageUrl = z.union([
  z.string().trim().max(2_048).refine(isSafeBlogImageUrl, 'Utilisez une URL HTTPS ou un chemin local valide.'),
  z.null(),
]).transform((value) => value || null);

export const blogPostInputSchema = z.object({
  title: z.string().trim().min(3).max(240),
  slug: z.string().trim().min(3).max(120).regex(BLOG_SLUG_PATTERN, 'Le slug doit contenir uniquement des lettres minuscules, des chiffres et des tirets.'),
  author: z.string().trim().min(2).max(160),
  excerpt: z.string().trim().min(10).max(500),
  contentHtml: z.string().trim().min(1).max(200_000)
    .refine((value) => blogHtmlToPlainText(value).length >= 50, 'Le contenu doit comporter au moins 50 caractères.')
    .refine(isValidatedBlogHtml, 'Le contenu contient du balisage non autorisé.'),
  status: z.enum(BLOG_STATUSES),
  imageUrl: optionalImageUrl.default(null),
}).strict();

export const blogPostPatchSchema = blogPostInputSchema.partial().refine(
  (value) => Object.keys(value).length > 0,
  'Au moins un champ doit être modifié.',
);

export type BlogPostRow = {
  id: string;
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  content_html: string;
  status: BlogStatus;
  image_url: string | null;
  created_by: string | null;
  image_asset_id: string | null;
  published_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

export const blogPostSelectColumns = `
  b.id,
  b.slug,
  b.title,
  b.author,
  b.excerpt,
  b.content_html,
  b.status,
  b.image_url,
  b.created_by,
  b.image_asset_id,
  b.published_at,
  b.created_at,
  b.updated_at
`;

// List views intentionally omit the potentially large article body. The
// placeholder preserves BlogPostRow's shape so serialization stays consistent.
export const blogPostListSelectColumns = `
  b.id,
  b.slug,
  b.title,
  b.author,
  b.excerpt,
  ''::text AS content_html,
  b.status,
  b.image_url,
  b.created_by,
  b.image_asset_id,
  b.published_at,
  b.created_at,
  b.updated_at
`;

export function serializeBlogPost(row: BlogPostRow): BlogPost {
  const imageUrl = row.image_url?.trim() ?? '';
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    author: row.author,
    excerpt: row.excerpt,
    contentHtml: row.content_html,
    status: row.status,
    imageUrl: imageUrl && isSafeBlogImageUrl(imageUrl) ? imageUrl : null,
    createdBy: row.created_by,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

export async function getPublishedBlogPosts(limit = 24, offset = 0) {
  const safeLimit = Math.max(1, Math.min(100, Math.trunc(limit)));
  const safeOffset = Math.max(0, Math.min(100_000, Math.trunc(offset)));
  const result = await query<BlogPostRow>(`
    SELECT ${blogPostListSelectColumns}
    FROM blog_posts b
    WHERE b.status = 'published'
    ORDER BY b.published_at DESC NULLS LAST, b.created_at DESC
    LIMIT $1
    OFFSET $2
  `, [safeLimit, safeOffset]);
  return result.rows.map(serializeBlogPost);
}

export async function getPublishedBlogPostBySlug(slug: string) {
  if (!BLOG_SLUG_PATTERN.test(slug) || slug.length > 120) return null;
  const result = await query<BlogPostRow>(`
    SELECT ${blogPostSelectColumns}
    FROM blog_posts b
    WHERE b.slug = $1 AND b.status = 'published'
    LIMIT 1
  `, [slug]);
  return result.rows[0] ? serializeBlogPost(result.rows[0]) : null;
}

export function mergeBlogPostInput(current: BlogPostInput, patch: Partial<BlogPostInput>) {
  return blogPostInputSchema.parse({ ...current, ...patch });
}

export function mediaAssetIdFromBlogImageUrl(value: string | null) {
  if (!value) return null;
  const match = /^\/api\/media\/([A-Za-z0-9_-]+)$/.exec(value);
  return match?.[1] ?? null;
}

export function blogWriteSourceMetadata(input: BlogPostInput, actorUserId: string) {
  const sourcePayload = {
    origin: 'render',
    actorUserId,
    title: input.title,
    slug: input.slug,
    author: input.author,
    excerpt: input.excerpt,
    content: input.contentHtml,
    status: input.status,
    imageUrl: input.imageUrl,
  };
  return {
    sourcePayload,
    sourceHash: createHash('sha256').update(JSON.stringify(sourcePayload)).digest('hex'),
  };
}

export function isPostgresUniqueViolation(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === '23505');
}
