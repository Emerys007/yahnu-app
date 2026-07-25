"use client";

import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { WaitlistForm } from "@/components/auth/waitlist-form";
import { useCountry } from "@/context/country-context";
import { useLocalization } from "@/context/localization-context";

export default function LoginPage() {
  const { country } = useCountry();
  const { language } = useLocalization();
  const isLaunchCountry = country.code === "CI";

  return (
    <AuthShell
      eyebrow={{ fr: "Votre prochaine étape", en: "Your next move" }}
      title={{
        fr: "Retrouvez votre élan professionnel.",
        en: "Pick up your professional momentum.",
      }}
      description={{
        fr: "Reprenez votre parcours là où vous l’avez laissé : profil, candidatures et connexions avec l’écosystème ivoirien.",
        en: "Continue where you left off: your profile, applications and connections across Côte d’Ivoire’s career ecosystem.",
      }}
      points={[
        { fr: "Vos candidatures au même endroit", en: "Your applications in one place" },
        { fr: "Des opportunités d’Abidjan à San-Pédro", en: "Opportunities from Abidjan to San-Pédro" },
        { fr: "Un accès protégé à votre espace", en: "Secure access to your space" },
      ]}
    >
      <div className="[&>div:nth-child(2)]:hidden [&>form]:mt-7 [&_a]:font-semibold [&_a]:decoration-primary/35 [&_a]:underline-offset-4">
        {isLaunchCountry ? <>
          <div className="mb-7 text-left">
            <span className="section-kicker">{language === "fr" ? "Connexion" : "Sign in"}</span>
            <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
              {language === "fr" ? "Ravi de vous revoir" : "Welcome back"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {language === "fr"
                ? "Connectez-vous pour retrouver votre profil et vos opportunités."
                : "Sign in to return to your profile and opportunities."}
            </p>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4" role="status" aria-live="polite">
                <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-64 animate-pulse rounded bg-muted" />
                <div className="mt-7 h-11 animate-pulse rounded-xl bg-muted" />
                <div className="h-11 animate-pulse rounded-xl bg-muted" />
                <span className="sr-only">{language === "fr" ? "Chargement du formulaire de connexion" : "Loading sign-in form"}</span>
              </div>
            }
          >
            <LoginForm />
          </Suspense>
        </> : (
          <WaitlistForm />
        )}
      </div>
    </AuthShell>
  );
}
