"use client"

export default function myImageLoader({ src, width, quality }) {
  // In development, return the src as-is
  if (process.env.NODE_ENV === "development") {
    return src;
  }

  // For production, return the src directly without processing
  // Since you're using a static deployment, images should be served directly
  return src;
}