"use client";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      titleKey="legal.terms_title"
      lastUpdatedKey="legal.terms_last_updated"
      contentKey="legal.terms_content"
    />
  );
}