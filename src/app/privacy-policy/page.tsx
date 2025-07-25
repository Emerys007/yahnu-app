"use client";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      titleKey="legal_privacy_title"
      lastUpdatedKey="legal_privacy_last_updated"
      contentKey="legal_privacy_content"
    />
  );
}
