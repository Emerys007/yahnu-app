import 'server-only';

export const MAX_BLOG_IMAGE_BYTES = 5 * 1024 * 1024;
export const BLOG_IMAGE_CONTENT_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const;
export type BlogImageContentType = (typeof BLOG_IMAGE_CONTENT_TYPES)[number];

const contentTypeExtensions: Record<BlogImageContentType, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

function startsWith(bytes: Uint8Array, signature: readonly number[]) {
  return signature.every((byte, index) => bytes[index] === byte);
}

export function detectBlogImageContentType(bytes: Uint8Array): BlogImageContentType | null {
  if (bytes.length >= 3 && startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (bytes.length >= 8 && startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (
    bytes.length >= 12
    && startsWith(bytes, [0x52, 0x49, 0x46, 0x46])
    && startsWith(bytes.subarray(8), [0x57, 0x45, 0x42, 0x50])
  ) return 'image/webp';
  if (
    bytes.length >= 6
    && (startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x37, 0x61])
      || startsWith(bytes, [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]))
  ) return 'image/gif';
  return null;
}

export function extensionForBlogImage(contentType: BlogImageContentType) {
  return contentTypeExtensions[contentType];
}

export function cleanOriginalFilename(value: string) {
  const leaf = value.split(/[\\/]/).pop() ?? 'image';
  const cleaned = leaf
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[";]/g, '')
    .trim()
    .slice(0, 240);
  return cleaned || 'image';
}

