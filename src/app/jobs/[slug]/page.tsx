"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, BriefcaseBusiness, Building2, CheckCircle2, Clock3, MapPin, Share2, Sparkles } from "lucide-react";
import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/context/localization-context";
import { getOpportunity } from "@/lib/opportunities";

const workplaceLabels = {
  en: { remote: "Remote", hybrid: "Hybrid", "on-site": "On-site" },
  fr: { remote: "À distance", hybrid: "Hybride", "on-site": "Sur site" },
};

export default function JobDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { language } = useLocalization();
  const locale = language === "fr" ? "fr" : "en";
  const opportunity = getOpportunity(slug);

  if (!opportunity) notFound();

  const content = locale === "fr"
    ? { back: "Retour aux offres", overview: "À propos du poste", impact: "Ce que vous ferez", apply: "Créer mon profil pour postuler", note: "Yahnu met en relation des candidats qualifiés avec des employeurs engagés. Créez votre profil pour poursuivre cette opportunité.", employment: "Contrat", workplace: "Mode de travail", posted: "Publié", share: "Partager" }
    : { back: "Back to opportunities", overview: "About this role", impact: "What you’ll do", apply: "Create profile to apply", note: "Yahnu connects qualified candidates with committed employers. Create your profile to continue with this opportunity.", employment: "Employment", workplace: "Workplace", posted: "Posted", share: "Share" };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="border-b bg-[radial-gradient(circle_at_92%_0%,hsl(var(--primary)/0.18),transparent_22rem),linear-gradient(180deg,hsl(var(--secondary)/0.45),hsl(var(--background)))]">
          <div className="container mx-auto py-10 sm:py-14">
            <Link href="/jobs" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"><ArrowLeft className="h-4 w-4" />{content.back}</Link>
            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
              <div>
                <div className="mb-4 flex flex-wrap items-center gap-2"><Badge className="rounded-full bg-primary/10 text-primary hover:bg-primary/10">{opportunity.category[locale]}</Badge><span className="text-sm text-muted-foreground">{content.posted} · {new Date(`${opportunity.posted}T00:00:00Z`).toLocaleDateString(locale === "fr" ? "fr-FR" : "en-US", { day: "numeric", month: "long", year: "numeric" })}</span></div>
                <h1 className="max-w-3xl text-4xl font-bold tracking-[-0.045em] sm:text-5xl">{opportunity.title[locale]}</h1>
                <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg text-muted-foreground"><Building2 className="h-5 w-5 text-primary" />{opportunity.company}<span className="hidden sm:inline">·</span><span className="flex items-center gap-1"><MapPin className="h-4 w-4" />{opportunity.location[locale]}</span></p>
              </div>
              <Button variant="outline" className="rounded-xl" onClick={() => navigator.share?.({ title: opportunity.title[locale], url: window.location.href })}><Share2 className="mr-2 h-4 w-4" />{content.share}</Button>
            </div>
          </div>
        </section>

        <section className="container mx-auto grid gap-10 py-12 lg:grid-cols-[minmax(0,1fr)_21rem] lg:py-16">
          <article className="max-w-3xl">
            <h2 className="text-2xl font-semibold tracking-tight">{content.overview}</h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">{opportunity.summary[locale]}</p>
            <h2 className="mt-12 text-2xl font-semibold tracking-tight">{content.impact}</h2>
            <ul className="mt-5 space-y-4">
              {opportunity.responsibilities[locale].map((responsibility) => <li key={responsibility} className="flex gap-3 text-muted-foreground"><CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> <span className="leading-7">{responsibility}</span></li>)}
            </ul>
            <div className="mt-12 flex flex-wrap gap-2">{opportunity.tags.map((tag) => <Badge key={tag} variant="secondary" className="rounded-full px-3 py-1">{tag}</Badge>)}</div>
          </article>
          <aside className="h-fit rounded-3xl border border-border/70 bg-card p-6 shadow-sm lg:sticky lg:top-28">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BriefcaseBusiness className="h-5 w-5" /></div>
            <h2 className="mt-5 text-lg font-semibold">{opportunity.company}</h2>
            <div className="mt-5 space-y-4 border-y py-5 text-sm">
              <p className="flex items-start gap-3"><MapPin className="mt-0.5 h-4 w-4 text-primary" /><span><strong className="block text-foreground">{content.workplace}</strong>{workplaceLabels[locale][opportunity.workplace]}</span></p>
              <p className="flex items-start gap-3"><Clock3 className="mt-0.5 h-4 w-4 text-primary" /><span><strong className="block text-foreground">{content.employment}</strong>{opportunity.type[locale]}</span></p>
            </div>
            <Button className="mt-6 w-full rounded-xl" size="lg" asChild><Link href={`/signup?role=graduate&opportunity=${opportunity.slug}`}>{content.apply}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <p className="mt-4 flex gap-2 text-xs leading-5 text-muted-foreground"><Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />{content.note}</p>
          </aside>
        </section>
      </main>
      <Footer />
    </div>
  );
}
