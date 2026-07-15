export const BLOG_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const BLOG_STATUSES = ['draft', 'published'] as const;
export type BlogStatus = (typeof BLOG_STATUSES)[number];

export type BlogPost = {
  id: string;
  slug: string;
  title: string;
  author: string;
  excerpt: string;
  contentHtml: string;
  status: BlogStatus;
  imageUrl: string | null;
  createdBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BlogPostInput = Pick<
  BlogPost,
  'slug' | 'title' | 'author' | 'excerpt' | 'contentHtml' | 'status' | 'imageUrl'
>;

const localImagePath = /^\/(?!\/)(?!\.\.(?:\/|$))(?!.*\/\.\.(?:\/|$))[^?#\\\u0000-\u001f]+$/;

export function isSafeBlogImageUrl(value: string) {
  const candidate = value.trim();
  if (!candidate) return true;
  if (localImagePath.test(candidate)) return true;

  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' && Boolean(url.hostname);
  } catch {
    return false;
  }
}

export function slugifyBlogTitle(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
    .replace(/-+$/g, '');
}

export function blogHtmlToPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
