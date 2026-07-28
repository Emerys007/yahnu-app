"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  GraduationCap,
  PlusCircle,
  RefreshCw,
  School,
  Sparkles,
  UserRoundSearch,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { InstitutionReferences } from "@/components/market/institution-references";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { cn } from "@/lib/utils";

export type DirectoryOrganization = {
  id: string;
  slug: string;
  name: string;
  industry: string | null;
  openJobCount: number;
};

type DirectoryKind = "company" | "school";
type Locale = "fr" | "en";

type DirectoryCopy = {
  eyebrow: string;
  title: string;
  subtitle: string;
  passageLabel: string;
  passageTitle: string;
  passageBody: string;
  audienceCards: readonly {
    label: string;
    title: string;
    body: string;
  }[];
  activeAccount: string;
  networkOrganization: string;
  cardDescription: string;
  oneJob: string;
  manyJobs: (count: number) => string;
  discover: string;
  unavailableTitle: string;
  unavailableBody: string;
  retry: string;
  directoryLabel: string;
  oneResult: string;
  manyResults: (count: number) => string;
  alphabetical: string;
  emptyTitle: string;
  emptyBody: string;
  ctaTitle: string;
  ctaBody: string;
  ctaAction: string;
};

const copy: Record<Locale, Record<DirectoryKind, DirectoryCopy>> = {
  fr: {
    company: {
      eyebrow: "Réseau professionnel ivoirien",
      title: "Rencontrer les entreprises qui font avancer la Côte d’Ivoire.",
      subtitle:
        "Explorez leurs métiers, comprenez leur activité et repérez les opportunités réellement ouvertes aux jeunes talents.",
      passageLabel: "Le passage vers l’emploi",
      passageTitle: "Voir plus qu’un logo avant de postuler.",
      passageBody:
        "Yahnu donne aux candidats et aux employeurs le même point de départ : un contexte clair, des attentes lisibles et une prochaine action utile.",
      audienceCards: [
        {
          label: "Pour les jeunes diplômés",
          title: "Comprendre avant de postuler",
          body: "Consultez le secteur, le profil public et les offres ouvertes pour choisir une entreprise qui correspond à votre projet.",
        },
        {
          label: "Pour les employeurs",
          title: "Recruter avec plus de contexte",
          body: "Présentez votre activité, publiez des besoins clairs et laissez les candidats se positionner en connaissance de cause.",
        },
      ],
      activeAccount: "Profil publié",
      networkOrganization: "Entreprise ivoirienne",
      cardDescription: "Profil employeur publié sur Yahnu",
      oneJob: "1 offre ouverte",
      manyJobs: (count) => `${count} offres ouvertes`,
      discover: "Découvrir l’entreprise",
      unavailableTitle: "L’annuaire fait une courte pause",
      unavailableBody: "La connexion n’a pas abouti. Actualisez la page dans quelques instants.",
      retry: "Réessayer",
      directoryLabel: "Annuaire Yahnu",
      oneResult: "1 entreprise à découvrir",
      manyResults: (count) => `${count} entreprises à découvrir`,
      alphabetical: "Profils publiés par ordre alphabétique",
      emptyTitle: "L’annuaire se construit",
      emptyBody: "Les premiers comptes d’entreprises ivoiriennes apparaîtront ici dès leur publication.",
      ctaTitle: "Faites découvrir votre entreprise aux talents ivoiriens",
      ctaBody:
        "Créez votre espace, présentez vos métiers et publiez des opportunités utiles aux jeunes diplômés, d’Abidjan aux villes de l’intérieur.",
      ctaAction: "Créer un compte entreprise",
    },
    school: {
      eyebrow: "Campus & avenir en Côte d’Ivoire",
      title: "Découvrir les établissements qui préparent la relève.",
      subtitle:
        "Retrouvez les écoles et universités actives sur Yahnu, et les passerelles qu’elles construisent entre le campus et le premier emploi.",
      passageLabel: "Le lien après le diplôme",
      passageTitle: "Un campus reste utile quand ses diplômés avancent.",
      passageBody:
        "Yahnu transforme la fin des études en continuité : les diplômés gardent un repère et les établissements restent engagés dans leur insertion.",
      audienceCards: [
        {
          label: "Pour les jeunes diplômés",
          title: "Garder un point d’appui",
          body: "Retrouvez le profil de votre établissement et restez relié à l’écosystème qui peut soutenir vos premiers pas professionnels.",
        },
        {
          label: "Pour les établissements",
          title: "Accompagner au-delà du campus",
          body: "Présentez vos formations, valorisez votre communauté diplômée et rapprochez-la des employeurs de Côte d’Ivoire.",
        },
      ],
      activeAccount: "Profil publié",
      networkOrganization: "Établissement ivoirien",
      cardDescription: "Découvrez son profil institutionnel et son engagement auprès de sa communauté diplômée.",
      oneJob: "1 opportunité ouverte",
      manyJobs: (count) => `${count} opportunités ouvertes`,
      discover: "Découvrir l’établissement",
      unavailableTitle: "L’annuaire fait une courte pause",
      unavailableBody: "La connexion n’a pas abouti. Actualisez la page dans quelques instants.",
      retry: "Réessayer",
      directoryLabel: "Annuaire Yahnu",
      oneResult: "1 établissement à découvrir",
      manyResults: (count) => `${count} établissements à découvrir`,
      alphabetical: "Profils publiés par ordre alphabétique",
      emptyTitle: "L’annuaire se construit",
      emptyBody: "Les premiers comptes d’établissements ivoiriens apparaîtront ici dès leur publication.",
      ctaTitle: "Accompagnez vos diplômés au-delà du campus",
      ctaBody:
        "Donnez de la visibilité à vos formations, gardez le lien avec vos alumni et rapprochez votre établissement des employeurs du pays.",
      ctaAction: "Créer un compte établissement",
    },
  },
  en: {
    company: {
      eyebrow: "Ivorian professional network",
      title: "Meet the employers moving Côte d’Ivoire forward.",
      subtitle:
        "Explore their work, understand what they do and find opportunities that are genuinely open to early-career talent.",
      passageLabel: "The path into work",
      passageTitle: "See more than a logo before you apply.",
      passageBody:
        "Yahnu gives candidates and employers the same starting point: useful context, clear expectations and an obvious next action.",
      audienceCards: [
        {
          label: "For young graduates",
          title: "Understand before applying",
          body: "Review the sector, public profile and open roles so you can choose an employer that fits your direction.",
        },
        {
          label: "For employers",
          title: "Recruit with better context",
          body: "Explain your work, publish clear needs and let candidates make an informed decision about where they can contribute.",
        },
      ],
      activeAccount: "Published profile",
      networkOrganization: "Ivorian employer",
      cardDescription: "Employer profile published on Yahnu",
      oneJob: "1 open role",
      manyJobs: (count) => `${count} open roles`,
      discover: "View employer",
      unavailableTitle: "The directory is taking a short break",
      unavailableBody: "The connection did not complete. Refresh this page in a few moments.",
      retry: "Try again",
      directoryLabel: "Yahnu directory",
      oneResult: "1 employer to discover",
      manyResults: (count) => `${count} employers to discover`,
      alphabetical: "Published profiles shown in alphabetical order",
      emptyTitle: "The directory is growing",
      emptyBody: "The first Ivorian employer accounts will appear here as soon as they are published.",
      ctaTitle: "Introduce your organisation to Ivorian talent",
      ctaBody:
        "Create your space, explain your work and publish useful opportunities for young graduates in Abidjan and across the country.",
      ctaAction: "Create an employer account",
    },
    school: {
      eyebrow: "Campus & careers in Côte d’Ivoire",
      title: "Discover the institutions preparing the next generation.",
      subtitle:
        "Find schools and universities active on Yahnu, and the bridges they are building between campus and a first job.",
      passageLabel: "The link after graduation",
      passageTitle: "A campus stays useful when its graduates move forward.",
      passageBody:
        "Yahnu turns the end of study into continuity: graduates keep a point of reference and institutions stay involved in their transition to work.",
      audienceCards: [
        {
          label: "For young graduates",
          title: "Keep a point of support",
          body: "Find your institution’s profile and stay connected to the ecosystem that can support your first professional steps.",
        },
        {
          label: "For institutions",
          title: "Support beyond campus",
          body: "Present your programmes, champion your graduate community and connect it with employers across Côte d’Ivoire.",
        },
      ],
      activeAccount: "Published profile",
      networkOrganization: "Ivorian institution",
      cardDescription: "Explore its institutional profile and commitment to its graduate community.",
      oneJob: "1 open opportunity",
      manyJobs: (count) => `${count} open opportunities`,
      discover: "View institution",
      unavailableTitle: "The directory is taking a short break",
      unavailableBody: "The connection did not complete. Refresh this page in a few moments.",
      retry: "Try again",
      directoryLabel: "Yahnu directory",
      oneResult: "1 institution to discover",
      manyResults: (count) => `${count} institutions to discover`,
      alphabetical: "Published profiles shown in alphabetical order",
      emptyTitle: "The directory is growing",
      emptyBody: "The first Ivorian institution accounts will appear here as soon as they are published.",
      ctaTitle: "Support your graduates beyond campus",
      ctaBody:
        "Showcase your programmes, stay connected with alumni and bring your institution closer to employers across the country.",
      ctaAction: "Create an institution account",
    },
  },
};

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "Y"
  );
}

function OrganizationCard({
  organization,
  kind,
  text,
}: {
  organization: DirectoryOrganization;
  kind: DirectoryKind;
  text: DirectoryCopy;
}) {
  const isCompany = kind === "company";
  const detail = isCompany
    ? organization.openJobCount === 1
      ? text.oneJob
      : text.manyJobs(organization.openJobCount)
    : text.cardDescription;

  return (
    <Card className="group relative flex h-full flex-col overflow-hidden border-border/70 shadow-soft transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-lift">
      <div className="h-1.5 bg-gradient-to-r from-terra via-background to-primary" aria-hidden="true" />
      <CardHeader className="space-y-5 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              "grid h-14 w-14 place-items-center rounded-2xl text-lg font-extrabold ring-1",
              isCompany
                ? "bg-terra/10 text-terra ring-terra/20"
                : "bg-primary/[0.08] text-primary ring-primary/15",
            )}
            aria-hidden="true"
          >
            {initials(organization.name)}
          </div>
          <Badge variant="outline" className="border-primary/20 bg-primary/[0.07] text-primary">
            {text.activeAccount}
          </Badge>
        </div>
        <div className="space-y-2">
          <Badge variant="secondary">{organization.industry || text.networkOrganization}</Badge>
          <CardTitle className="text-xl leading-snug">{organization.name}</CardTitle>
          <CardDescription className="inline-flex items-start gap-1.5 leading-6">
            {isCompany ? (
              <BriefcaseBusiness className="mt-1 h-4 w-4 shrink-0 text-terra" aria-hidden="true" />
            ) : (
              <GraduationCap className="mt-1 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
            )}
            {detail}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="mt-auto px-5 pb-5 sm:px-6 sm:pb-6">
        <Button asChild className="w-full" variant="outline">
          <Link href={`/${isCompany ? "companies" : "schools"}/${encodeURIComponent(organization.slug)}`}>
            {text.discover}
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

export function PublicOrganizationDirectory({
  kind,
  organizations,
  unavailable,
}: {
  kind: DirectoryKind;
  organizations: DirectoryOrganization[];
  unavailable: boolean;
}) {
  const router = useRouter();
  const { language } = useLocalization();
  const locale: Locale = language === "en" ? "en" : "fr";
  const text = copy[locale][kind];
  const isCompany = kind === "company";
  const audienceIcons = isCompany ? [UserRoundSearch, Building2] : [GraduationCap, School];
  const resultLabel =
    organizations.length === 1 ? text.oneResult : text.manyResults(organizations.length);
  const signupHref = isCompany ? "/signup?type=company" : "/signup?type=school";
  const EmptyIcon = isCompany ? Building2 : GraduationCap;
  const CtaIcon = isCompany ? PlusCircle : School;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-ivory py-14 dark:bg-background sm:py-20">
          <div className="lagoon-grid absolute inset-0 opacity-40" aria-hidden="true" />
          <div className="page-shell relative grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div className="max-w-3xl">
              <span className="section-kicker">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                {text.eyebrow}
              </span>
              <h1 className="display-title mt-5 max-w-4xl text-4xl sm:text-5xl lg:text-6xl">{text.title}</h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
                {text.subtitle}
              </p>
            </div>

            <aside
              className="surface-glass overflow-hidden rounded-[1.75rem]"
              aria-labelledby={`${kind}-passage-title`}
            >
              <div className="border-b p-5 sm:p-7">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-primary">
                  {text.passageLabel}
                </p>
                <h2 id={`${kind}-passage-title`} className="mt-3 font-headline text-2xl font-semibold sm:text-3xl">
                  {text.passageTitle}
                </h2>
                <p className="mt-3 leading-7 text-muted-foreground">{text.passageBody}</p>
              </div>
              <div className="grid sm:grid-cols-2">
                {text.audienceCards.map((item, index) => {
                  const Icon = audienceIcons[index];
                  return (
                    <article
                      key={item.label}
                      className={cn(
                        "p-5 sm:p-7",
                        index === 1 && "border-t sm:border-l sm:border-t-0",
                      )}
                    >
                      <div
                        className={cn(
                          "grid h-10 w-10 place-items-center rounded-xl",
                          index === 0
                            ? "bg-terra/10 text-terra"
                            : "bg-primary/[0.08] text-primary",
                        )}
                      >
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                        {item.label}
                      </p>
                      <h3 className="mt-2 font-headline text-xl font-semibold">{item.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.body}</p>
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>
        </section>

        {!isCompany ? <InstitutionReferences /> : null}

        <section className="page-shell py-10 sm:py-14" aria-labelledby={`${kind}-directory-title`}>
          {unavailable ? (
            <Card className="mx-auto max-w-xl border-terra/25" role="status">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <RefreshCw className="mx-auto h-9 w-9 text-terra" aria-hidden="true" />
                <h2 id={`${kind}-directory-title`} className="mt-4 text-xl font-semibold">
                  {text.unavailableTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.unavailableBody}</p>
                <Button
                  type="button"
                  className="mt-6 w-full sm:w-auto"
                  variant="outline"
                  onClick={() => router.refresh()}
                >
                  {text.retry}
                </Button>
              </CardContent>
            </Card>
          ) : organizations.length ? (
            <>
              <div className="mb-6 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">
                    {text.directoryLabel}
                  </p>
                  <h2 id={`${kind}-directory-title`} className="mt-1 text-2xl font-bold">
                    {resultLabel}
                  </h2>
                </div>
                <p className="text-sm text-muted-foreground">{text.alphabetical}</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {organizations.map((organization) => (
                  <OrganizationCard
                    key={organization.id}
                    organization={organization}
                    kind={kind}
                    text={text}
                  />
                ))}
              </div>
            </>
          ) : (
            <Card className="mx-auto max-w-xl">
              <CardContent className="px-5 py-12 text-center sm:px-8">
                <EmptyIcon className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
                <h2 id={`${kind}-directory-title`} className="mt-4 text-xl font-semibold">
                  {text.emptyTitle}
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text.emptyBody}</p>
              </CardContent>
            </Card>
          )}

          <Card className="ci-pattern mt-10 overflow-hidden border-primary/20 bg-primary/[0.06] sm:mt-14">
            <CardContent className="flex flex-col items-center px-5 py-9 text-center sm:p-10">
              <div
                className={cn(
                  "grid h-14 w-14 place-items-center rounded-2xl shadow-soft",
                  isCompany
                    ? "bg-terra text-terra-foreground"
                    : "bg-primary text-primary-foreground",
                )}
              >
                <CtaIcon className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="mt-5 text-2xl font-bold">{text.ctaTitle}</h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {text.ctaBody}
              </p>
              <Button
                asChild
                size="lg"
                variant={isCompany ? "terra" : "default"}
                className="mt-6 h-auto min-h-12 w-full whitespace-normal py-3 text-center sm:w-auto"
              >
                <Link href={signupHref}>
                  {text.ctaAction}
                  <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
