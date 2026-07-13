"use client";

import { useEffect, useState } from 'react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SafeRichText } from '@/components/ui/safe-rich-text';
import { apiFetch } from '@/lib/api-client';

type LegalContent = { title: string; lastUpdated: string; content: string };

function isLegalContent(value: unknown): value is LegalContent {
  if (!value || typeof value !== 'object') return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.title === 'string'
    && typeof candidate.lastUpdated === 'string'
    && typeof candidate.content === 'string';
}

export function DynamicLegalContent({ pageId, fallback }: { pageId: 'privacy-policy' | 'terms-of-service'; fallback: LegalContent }) {
  const [managedContent, setManagedContent] = useState<LegalContent | null>(null);
  const content = managedContent ?? fallback;

  useEffect(() => {
    const controller = new AbortController();
    apiFetch<{ data: { page: { data: unknown } | null } }>(`/api/pages/${pageId}`, { signal: controller.signal })
      .then((response) => {
        if (isLegalContent(response.data.page?.data)) setManagedContent(response.data.page.data);
      })
      .catch((error) => {
        if (!controller.signal.aborted) console.error(`Unable to load ${pageId} content.`, error);
      });
    return () => controller.abort();
  }, [pageId]);

  return (
    <Card className="p-6 md:p-8">
      <CardHeader>
        <CardTitle className="text-4xl font-bold">{content.title}</CardTitle>
        <CardDescription>{content.lastUpdated}</CardDescription>
      </CardHeader>
      <CardContent>
        <SafeRichText html={content.content} className="prose-lg prose-h2:mt-8 prose-h2:mb-4 prose-h2:text-2xl prose-h2:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-h3:text-xl prose-h3:font-semibold prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-li:mb-2 prose-strong:font-semibold" />
      </CardContent>
    </Card>
  );
}
