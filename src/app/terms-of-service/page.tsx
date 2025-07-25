"use client";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function TermsOfServicePage() {
  return (
    <LegalPageLayout
      titleKey="legal_terms_title"
      lastUpdatedKey="legal_terms_last_updated"
      contentKey="legal_terms_content"
    />
  );
}
