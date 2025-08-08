"use client";

import { LegalPageLayout } from "@/components/legal/legal-page-layout";

export default function PrivacyPolicyPage() {
  return (
    <LegalPageLayout
      titleKey="legal.privacy_title"
      lastUpdatedKey="legal.privacy_last_updated"
      contentKey="legal.privacy_content"
    />
  );
}