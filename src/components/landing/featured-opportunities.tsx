"use client";

import Link from "next/link";
import { ArrowUpRight, MapPin, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { opportunities } from "@/lib/opportunities";
import { useLocalization } from "@/context/localization-context";

export function FeaturedOpportunities() {
  const { language } = useLocalization();
  const locale = language === "fr" ? "fr" : "en";
  const content = locale === "fr"
    ? { eyebrow: "Opportunités sélectionnées", title: "Des rôles conçus pour votre prochain mouvement.", body: "Des employeurs engagés recherchent des talents qui combinent ambition, savoir-faire et perspective régionale.", action: "Voir toutes les offres", remote: "À distance", hybrid: "Hybride", onsite: "Sur site" }
    : { eyebrow: "Selected opportunities", title: "Roles built for your next move.", body: "Committed employers are looking for talent with ambition, craft, and a regional point of view.", action: "Browse all roles", remote: "Remote", hybrid: "Hybrid", onsite: "On-site" };
  const label = (workplace: "remote" | "hybrid" | "on-site") => workplace === "on-site" ? content.onsite : content[workplace];

  return (
    <section className="bg-background py-20 sm:py-24">
      <div className="container mx-auto">
        <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />{content.eyebrow}</div>
            <h2 className="mt-3 max-w-xl text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{content.title}</h2>
            <p className="mt-4 max-w-lg text-lg leading-8 text-muted-foreground">{content.body}</p>
            <Button variant="outline" className="mt-7 rounded-xl" asChild><Link href="/jobs">{content.action}<ArrowUpRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {opportunities.filter((opportunity) => opportunity.featured).slice(0, 3).map((opportunity, index) => (
              <Link key={opportunity.slug} href={`/jobs/${opportunity.slug}`} className="group rounded-3xl border border-border/70 bg-card p-5 transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10">
                <span className="text-xs font-medium text-muted-foreground">0{index + 1}</span>
                <h3 className="mt-6 font-semibold leading-6 group-hover:text-primary">{opportunity.title[locale]}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{opportunity.company}</p>
                <div className="mt-6 space-y-2 text-xs text-muted-foreground">
                  <p className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{opportunity.location[locale]}</p>
                  <Badge variant="secondary" className="rounded-full font-normal">{label(opportunity.workplace)}</Badge>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
