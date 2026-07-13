"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { OpportunityExplorer } from "@/components/opportunities/opportunity-explorer";
import { useLocalization } from "@/context/localization-context";

export default function JobsPage() {
  const { language } = useLocalization();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <Suspense fallback={<div className="grid min-h-[60vh] place-items-center"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading opportunities" /></div>}>
          <OpportunityExplorer language={language === "fr" ? "fr" : "en"} />
        </Suspense>
      </main>
      <Footer />
    </div>
  );
}
