
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronLeft } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

interface LegalPageLayoutProps {
  titleKey: string;
  lastUpdatedKey: string;
  contentKey: string;
}

export function LegalPageLayout({ titleKey, lastUpdatedKey, contentKey }: LegalPageLayoutProps) {
  const { t } = useLocalization();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1 py-12 px-4">
        <div className="container max-w-4xl mx-auto">
          <Button asChild variant="ghost" className="mb-4 px-0">
            <Link href="/">
              <ChevronLeft className="mr-2 h-4 w-4" />
              {t('Go back to the homepage')}
            </Link>
          </Button>
          <Card className="p-6 md:p-8">
            <CardHeader>
              <CardTitle className="text-4xl font-bold">{t(titleKey)}</CardTitle>
              <CardDescription>{t(lastUpdatedKey)}</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="prose prose-lg max-w-none prose-h2:font-bold prose-h2:text-2xl prose-h2:mt-8 prose-h2:mb-4 prose-h3:font-semibold prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-ul:list-disc prose-ul:pl-6 prose-li:mb-2 prose-strong:font-semibold"
                dangerouslySetInnerHTML={{ __html: t(contentKey) }}
              />
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
