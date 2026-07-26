"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, SearchX } from "lucide-react";

import { OpportunityDetail } from "@/components/market/opportunity-detail";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import { apiFetch } from "@/lib/api-client";
import type { VerifiedMarketOpportunity } from "@/lib/ivory-coast-market";

export function ManagedOpportunityDetail({ slug }: { slug: string }) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const [opportunity, setOpportunity] = useState<VerifiedMarketOpportunity | null>(null);
  const [unavailable, setUnavailable] = useState(false);
  const returnPath = `/opportunities/${slug}`;

  useEffect(() => {
    if (!loading && !user) {
      router.replace(`/login?next=${encodeURIComponent(returnPath)}`);
    }
  }, [loading, returnPath, router, user]);

  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    setUnavailable(false);
    apiFetch<{ data: { opportunity: VerifiedMarketOpportunity } }>(
      `/api/market-opportunities/${encodeURIComponent(slug)}`,
      { signal: controller.signal },
    )
      .then((response) => setOpportunity(response.data.opportunity))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error("Unable to load this verified opportunity.", error);
          setUnavailable(true);
        }
      });
    return () => controller.abort();
  }, [slug, user]);

  if (unavailable) {
    return (
      <section className="page-shell grid min-h-[58vh] place-items-center py-16">
        <Card className="w-full max-w-2xl border-terra/20 bg-terra/[0.04] text-center">
          <CardContent className="p-7 sm:p-10">
            <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-terra/10 text-terra">
              <SearchX className="h-7 w-7" aria-hidden="true" />
            </span>
            <h1 className="mt-6 font-headline text-3xl font-semibold">
              {locale === "fr" ? "Cette opportunité n’est plus disponible." : "This opportunity is no longer available."}
            </h1>
            <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">
              {locale === "fr"
                ? "Elle a expiré ou sa source doit être vérifiée de nouveau. Consultez les annonces encore actives."
                : "It has expired or its source needs to be checked again. Browse the opportunities that are still active."}
            </p>
            <Button asChild className="mt-6">
              <Link href="/jobs">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                {locale === "fr" ? "Voir les opportunités actives" : "View active opportunities"}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>
    );
  }

  if (loading || !user || !opportunity) {
    return (
      <div className="grid min-h-[55vh] place-items-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <p className="mt-3 text-sm text-muted-foreground">
            {locale === "fr" ? "Ouverture de votre accès sécurisé…" : "Opening secure access…"}
          </p>
        </div>
      </div>
    );
  }

  return <OpportunityDetail opportunity={opportunity} />;
}
