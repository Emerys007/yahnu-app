"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Bookmark, BriefcaseBusiness, Check, Heart, MapPin, Search, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { opportunities, type Opportunity } from "@/lib/opportunities";

type Language = "en" | "fr";

const copy = {
  en: {
    eyebrow: "Opportunity board",
    title: "Find work that moves your future forward.",
    description: "Explore roles from trusted employers, then save the ones that fit your next chapter.",
    search: "Search role, company, or skill",
    workplace: "Workplace",
    allWorkplaces: "All workplaces",
    allTypes: "All employment types",
    type: "Employment type",
    remote: "Remote",
    hybrid: "Hybrid",
    onsite: "On-site",
    results: "roles matched",
    result: "role matched",
    clear: "Clear filters",
    noResults: "No opportunities match those filters yet.",
    noResultsBody: "Try a broader skill or clear a filter to see the full opportunity board.",
    save: "Save role",
    saved: "Saved",
    view: "View role",
    featured: "Featured",
    filters: "Filters",
  },
  fr: {
    eyebrow: "Offres d’emploi",
    title: "Trouvez un travail qui fait avancer votre avenir.",
    description: "Explorez des postes proposés par des employeurs de confiance, puis enregistrez ceux qui correspondent à votre prochain chapitre.",
    search: "Rechercher un poste, une entreprise ou une compétence",
    workplace: "Mode de travail",
    allWorkplaces: "Tous les modes de travail",
    allTypes: "Tous les types de contrat",
    type: "Type de contrat",
    remote: "À distance",
    hybrid: "Hybride",
    onsite: "Sur site",
    results: "postes trouvés",
    result: "poste trouvé",
    clear: "Effacer les filtres",
    noResults: "Aucune offre ne correspond encore à ces filtres.",
    noResultsBody: "Essayez une compétence plus générale ou effacez un filtre pour voir toutes les offres.",
    save: "Enregistrer",
    saved: "Enregistré",
    view: "Voir le poste",
    featured: "À la une",
    filters: "Filtres",
  },
} as const;

function workplaceLabel(workplace: Opportunity["workplace"], language: Language) {
  const labels = copy[language];
  return workplace === "on-site" ? labels.onsite : labels[workplace];
}

function relativeDate(date: string, language: Language) {
  const days = Math.max(1, Math.round((Date.now() - new Date(`${date}T00:00:00Z`).getTime()) / 86_400_000));
  if (language === "fr") return `Publié il y a ${days} j`;
  return `Posted ${days}d ago`;
}

export function OpportunityExplorer({ language = "en" }: { language?: Language }) {
  const labels = copy[language];
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = React.useState(searchParams.get("q") || "");
  const [workplace, setWorkplace] = React.useState(searchParams.get("workplace") || "all");
  const [employmentType, setEmploymentType] = React.useState(searchParams.get("type") || "all");
  const [saved, setSaved] = React.useState<string[]>([]);

  React.useEffect(() => {
    const stored = window.localStorage.getItem("yahnu-saved-opportunities");
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) setSaved(parsed.filter((item): item is string => typeof item === "string"));
    } catch {
      window.localStorage.removeItem("yahnu-saved-opportunities");
    }
  }, []);

  React.useEffect(() => {
    const params = new URLSearchParams();
    if (query.trim()) params.set("q", query.trim());
    if (workplace !== "all") params.set("workplace", workplace);
    if (employmentType !== "all") params.set("type", employmentType);
    const nextUrl = params.size ? `${pathname}?${params.toString()}` : pathname;
    router.replace(nextUrl, { scroll: false });
  }, [employmentType, pathname, query, router, workplace]);

  const filtered = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return opportunities.filter((opportunity) => {
      const searchable = [
        opportunity.title[language],
        opportunity.company,
        opportunity.location[language],
        opportunity.category[language],
        opportunity.tags.join(" "),
      ].join(" ").toLocaleLowerCase();
      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (workplace === "all" || opportunity.workplace === workplace) &&
        (employmentType === "all" || opportunity.type[language] === employmentType)
      );
    });
  }, [employmentType, language, query, workplace]);

  const typeOptions = React.useMemo(
    () => [...new Set(opportunities.map((opportunity) => opportunity.type[language]))],
    [language]
  );

  const clearFilters = () => {
    setQuery("");
    setWorkplace("all");
    setEmploymentType("all");
  };

  const toggleSaved = (slug: string) => {
    setSaved((current) => {
      const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
      window.localStorage.setItem("yahnu-saved-opportunities", JSON.stringify(next));
      return next;
    });
  };

  const hasFilters = query || workplace !== "all" || employmentType !== "all";

  return (
    <section className="relative overflow-hidden bg-[radial-gradient(circle_at_88%_8%,hsl(var(--primary)/0.18),transparent_24rem),linear-gradient(180deg,hsl(var(--secondary)/0.5),hsl(var(--background))_42%)]">
      <div className="container mx-auto py-12 sm:py-16">
        <div className="max-w-3xl">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-background/75 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary shadow-sm">
            <Sparkles className="h-3.5 w-3.5" /> {labels.eyebrow}
          </div>
          <h1 className="max-w-2xl text-4xl font-bold tracking-[-0.04em] text-foreground sm:text-5xl">{labels.title}</h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">{labels.description}</p>
        </div>

        <div className="mt-8 rounded-3xl border border-border/70 bg-background/85 p-3 shadow-[0_20px_70px_-32px_rgba(15,23,42,0.35)] backdrop-blur sm:p-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_11rem_12rem_auto]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={query} onChange={(event) => setQuery(event.target.value)} className="h-12 rounded-2xl border-transparent bg-muted/70 pl-11 shadow-none focus-visible:bg-background" placeholder={labels.search} aria-label={labels.search} />
            </div>
            <Select value={workplace} onValueChange={setWorkplace}>
              <SelectTrigger className="h-12 rounded-2xl border-transparent bg-muted/70 shadow-none"><SelectValue placeholder={labels.workplace} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allWorkplaces}</SelectItem>
                <SelectItem value="remote">{labels.remote}</SelectItem>
                <SelectItem value="hybrid">{labels.hybrid}</SelectItem>
                <SelectItem value="on-site">{labels.onsite}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={employmentType} onValueChange={setEmploymentType}>
              <SelectTrigger className="h-12 rounded-2xl border-transparent bg-muted/70 shadow-none"><SelectValue placeholder={labels.type} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{labels.allTypes}</SelectItem>
                {typeOptions.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-12 rounded-2xl" onClick={clearFilters} disabled={!hasFilters}>
              <X className="mr-2 h-4 w-4" />{labels.clear}
            </Button>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
          <p className="flex items-center gap-2 text-sm font-medium text-muted-foreground"><SlidersHorizontal className="h-4 w-4" />{filtered.length} {filtered.length === 1 ? labels.result : labels.results}</p>
          <p className="flex items-center gap-2 text-sm text-muted-foreground"><Bookmark className="h-4 w-4 text-primary" />{saved.length} {language === "fr" ? "enregistré(s) sur cet appareil" : "saved on this device"}</p>
        </div>

        {filtered.length ? (
          <div className="mt-5 grid gap-4">
            {filtered.map((opportunity) => {
              const isSaved = saved.includes(opportunity.slug);
              return (
                <article key={opportunity.slug} className="group relative overflow-hidden rounded-3xl border border-border/70 bg-card p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-6">
                  <div className="absolute inset-y-0 left-0 w-1 bg-primary opacity-0 transition-opacity group-hover:opacity-100" />
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary"><BriefcaseBusiness className="h-5 w-5" /></div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {opportunity.featured && <Badge className="rounded-full bg-primary/10 px-2.5 text-primary hover:bg-primary/10">{labels.featured}</Badge>}
                        <span className="text-xs text-muted-foreground">{relativeDate(opportunity.posted, language)}</span>
                      </div>
                      {opportunity.illustrative && (
                        <Badge variant="outline" className="mt-2 rounded-full">
                          {language === "fr" ? "Exemple illustratif" : "Illustrative example"}
                        </Badge>
                      )}
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-foreground"><Link className="outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring" href={opportunity.href}>{opportunity.title[language]}</Link></h2>
                      <p className="mt-1 font-medium text-muted-foreground">{opportunity.company}</p>
                      <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">{opportunity.summary[language]}</p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge variant="secondary" className="rounded-full font-normal"><MapPin className="mr-1 h-3.5 w-3.5" />{opportunity.location[language]}</Badge>
                        <Badge variant="secondary" className="rounded-full font-normal">{workplaceLabel(opportunity.workplace, language)}</Badge>
                        <Badge variant="secondary" className="rounded-full font-normal">{opportunity.type[language]}</Badge>
                      </div>
                    </div>
                    <div className="relative z-10 flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                      <Button variant="ghost" size="icon" className={cn("rounded-full", isSaved && "text-primary") } onClick={() => toggleSaved(opportunity.slug)} aria-label={isSaved ? labels.saved : labels.save}>
                        {isSaved ? <Heart className="h-4 w-4 fill-current" /> : <Heart className="h-4 w-4" />}
                      </Button>
                      <Button asChild variant="outline" className="rounded-xl"><Link href={opportunity.href}>{labels.view}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-border bg-card/60 px-6 py-16 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-muted"><Search className="h-5 w-5 text-muted-foreground" /></div>
            <h2 className="mt-5 text-lg font-semibold">{labels.noResults}</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">{labels.noResultsBody}</p>
            <Button variant="outline" className="mt-5 rounded-xl" onClick={clearFilters}><Check className="mr-2 h-4 w-4" />{labels.clear}</Button>
          </div>
        )}
      </div>
    </section>
  );
}
