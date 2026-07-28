"use client";

import * as React from "react";
import DOMPurify from "dompurify";
import { cn } from "@/lib/utils";

const sanitizerOptions = {
  ALLOWED_TAGS: ['a', 'p', 'br', 'strong', 'em', 'u', 's', 'blockquote', 'code', 'pre', 'h1', 'h2', 'h3', 'h4', 'ul', 'ol', 'li'],
  ALLOWED_ATTR: ['href', 'title'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/(?!\/)|#)/i,
  FORBID_TAGS: ['style', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'script'],
};

export function sanitizeRichText(html: string) {
  if (typeof window === "undefined" || typeof DOMPurify.sanitize !== "function") return ""
  return DOMPurify.sanitize(html, sanitizerOptions)
}

function richTextToPlainText(html: string) {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#(?:39|x27);/gi, "'")
    .replace(/\s+/g, " ")
    .trim()
}

export function SafeRichText({ html, className }: { html: string; className?: string }) {
  const [cleanHtml, setCleanHtml] = React.useState<string | null>(null)

  React.useEffect(() => {
    setCleanHtml(sanitizeRichText(html))
  }, [html])

  if (cleanHtml === null) {
    return <div className={cn("prose max-w-none dark:prose-invert", className)}>{richTextToPlainText(html)}</div>
  }

  return <div className={cn("prose max-w-none dark:prose-invert", className)} dangerouslySetInnerHTML={{ __html: cleanHtml }} />;
}
