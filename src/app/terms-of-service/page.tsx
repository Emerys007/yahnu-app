"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import { DynamicLegalContent } from "@/components/legal/dynamic-legal-content";

export default function TermsOfServicePage() {
  const { t } = useLocalization();

  return (
     <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
            <Button asChild variant="ghost" className="mb-4 px-0">
                <Link href="/">
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    {t('legal.back_to_home')}
                </Link>
            </Button>
            <DynamicLegalContent pageId="terms-of-service" fallback={{ title: t('legal.terms_title'), lastUpdated: t('legal.terms_last_updated'), content: t('legal.terms_content') }} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
