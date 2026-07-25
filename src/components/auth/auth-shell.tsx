"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Globe2, MapPin } from "lucide-react";

import { Logo } from "@/components/ui/logo";
import { useLocalization } from "@/context/localization-context";
import { cn } from "@/lib/utils";

export type LocalizedText = {
  fr: string;
  en: string;
};

type AuthShellProps = {
  children: React.ReactNode;
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  points?: LocalizedText[];
  wide?: boolean;
  imagePosition?: string;
};

export function AuthShell({
  children,
  eyebrow,
  title,
  description,
  points = [
    { fr: "Des profils ancrés dans le réel", en: "Profiles grounded in real experience" },
    { fr: "Des opportunités partout en Côte d’Ivoire", en: "Opportunities across Côte d’Ivoire" },
    { fr: "Un parcours clair, du campus à l’emploi", en: "A clear path from campus to work" },
  ],
  wide = false,
  imagePosition = "center",
}: AuthShellProps) {
  const { language, setLanguage } = useLocalization();
  const pick = (value: LocalizedText) => value[language];

  return (
    <main className="relative min-h-svh overflow-hidden bg-background">
      <div className="ci-pattern pointer-events-none absolute inset-0 opacity-55" aria-hidden="true" />
      <div
        className="pointer-events-none absolute -right-24 top-24 h-72 w-72 rounded-full bg-lagoon/10 blur-3xl"
        aria-hidden="true"
      />

      <header className="absolute inset-x-0 top-0 z-30">
        <div className="mx-auto flex h-20 w-full max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:h-24 lg:px-8">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 rounded-xl text-foreground focus-visible:ring-offset-background"
            aria-label={language === "fr" ? "Retour à l’accueil Yahnu" : "Back to Yahnu home"}
          >
            <Logo className="h-10 w-10 transition-transform duration-300 group-hover:-rotate-3" />
            <span className="font-headline text-xl font-semibold tracking-[-0.04em]">Yahnu</span>
          </Link>

          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-1.5 rounded-full border border-primary/15 bg-card/75 px-3 py-1.5 text-xs font-semibold text-primary backdrop-blur sm:flex">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              Côte d’Ivoire
            </div>
            <div
              className="flex rounded-full border border-border/80 bg-card/80 p-1 shadow-sm backdrop-blur"
              role="group"
              aria-label={language === "fr" ? "Choisir la langue" : "Choose language"}
            >
              <button
                type="button"
                onClick={() => setLanguage("fr")}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  language === "fr" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={language === "fr"}
              >
                FR
              </button>
              <button
                type="button"
                onClick={() => setLanguage("en")}
                className={cn(
                  "min-h-9 rounded-full px-3 text-xs font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  language === "en" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={language === "en"}
              >
                EN
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto grid min-h-svh w-full max-w-[1440px] lg:grid-cols-[minmax(24rem,0.88fr)_minmax(32rem,1.12fr)]">
        <aside className="relative hidden min-h-svh overflow-hidden lg:block">
          <div className="absolute inset-5 overflow-hidden rounded-[2rem] bg-foreground shadow-lift">
            <Image
              src="/images/yahnu-abidjan-hero-v2.webp"
              alt={
                language === "fr"
                  ? "Jeunes diplômés ivoiriens avançant ensemble à Abidjan"
                  : "Young Ivorian graduates moving forward together in Abidjan"
              }
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 0px"
              className="object-cover"
              style={{ objectPosition: imagePosition }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/25 to-foreground/5" aria-hidden="true" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,hsl(var(--primary)/.38),transparent_55%)]" aria-hidden="true" />

            <svg
              className="absolute inset-x-0 bottom-[18rem] h-44 w-full text-white/70"
              viewBox="0 0 720 180"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M-20 145C110 145 138 32 268 55c119 22 131 98 260 56 65-21 98-68 212-50"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="7 10"
              />
              <circle cx="160" cy="76" r="7" fill="hsl(var(--terra))" />
              <circle cx="375" cy="94" r="7" fill="hsl(var(--soleil))" />
              <circle cx="595" cy="90" r="7" fill="hsl(var(--lagoon))" />
            </svg>

            <div className="absolute inset-x-0 bottom-0 p-8 text-white xl:p-10">
              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.14em] backdrop-blur">
                <Globe2 className="h-3.5 w-3.5" aria-hidden="true" />
                {pick(eyebrow)}
              </div>
              <h1 className="max-w-xl font-headline text-4xl font-semibold leading-[0.96] tracking-[-0.045em] xl:text-5xl">
                {pick(title)}
              </h1>
              <p className="mt-4 max-w-lg text-base leading-relaxed text-white/78 xl:text-lg">
                {pick(description)}
              </p>
              <ul className="mt-7 grid gap-3 text-sm text-white/90" aria-label={language === "fr" ? "Les repères Yahnu" : "Yahnu highlights"}>
                {points.map((point) => (
                  <li key={point.fr} className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-terra" aria-hidden="true" />
                    {pick(point)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        <section className="relative flex min-h-svh items-center px-4 pb-10 pt-24 sm:px-6 sm:pb-14 lg:px-10 lg:py-28 xl:px-16">
          <div className={cn("mx-auto w-full", wide ? "max-w-xl" : "max-w-md")}>
            <div className="mb-6 lg:hidden">
              <span className="section-kicker">{pick(eyebrow)}</span>
              <h1 className="mt-4 font-headline text-3xl font-semibold leading-[1.02] tracking-[-0.04em] sm:text-4xl">
                {pick(title)}
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-relaxed text-muted-foreground sm:text-base">
                {pick(description)}
              </p>
            </div>

            <div className="surface-glass rounded-[1.65rem] p-5 sm:p-7 lg:p-8">
              {children}
            </div>

            <div className="mt-5 flex flex-col items-center justify-between gap-3 text-center text-xs text-muted-foreground sm:flex-row sm:text-left">
              <Link href="/" className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 font-semibold hover:text-primary">
                <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                {language === "fr" ? "Retour à l’accueil" : "Back to home"}
              </Link>
              <p>
                {language === "fr" ? "Pensé à Abidjan, pour toute la Côte d’Ivoire." : "Designed in Abidjan, for all of Côte d’Ivoire."}
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
