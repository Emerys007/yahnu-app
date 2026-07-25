"use client";

import { Suspense } from "react";

import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterForm } from "@/components/auth/register-form";
import { WaitlistForm } from "@/components/auth/waitlist-form";
import { useCountry } from "@/context/country-context";
import { useLocalization } from "@/context/localization-context";

export default function SignupPage() {
  const { country } = useCountry();
  const { language } = useLocalization();
  const isLaunchCountry = country.code === "CI";

  return (
    <AuthShell
      wide
      imagePosition="58% center"
      eyebrow={{ fr: "Un réseau, trois forces", en: "One network, three forces" }}
      title={{
        fr: "Faites avancer le talent ivoirien.",
        en: "Move Ivorian talent forward.",
      }}
      description={{
        fr: "Jeunes diplômés, entreprises et établissements se retrouvent dans un espace pensé pour les réalités du marché ivoirien.",
        en: "Graduates, employers and schools meet in one space built around the realities of Côte d’Ivoire’s job market.",
      }}
      points={[
        { fr: "Diplômé : construisez un profil qui vous ressemble", en: "Graduate: build a profile that feels like you" },
        { fr: "Entreprise : rencontrez des talents prometteurs", en: "Employer: meet promising talent" },
        { fr: "Établissement : accompagnez chaque promotion", en: "School: support every graduating class" },
      ]}
    >
      <div className="[&>div:nth-child(2)]:hidden [&>form]:mt-7 [&_a]:font-semibold [&_a]:decoration-primary/35 [&_a]:underline-offset-4">
        {isLaunchCountry ? <>
          <div className="mb-7 text-left">
            <span className="section-kicker">{language === "fr" ? "Inscription" : "Create an account"}</span>
            <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
              {language === "fr" ? "Créer mon espace Yahnu" : "Create my Yahnu space"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {language === "fr"
                ? "Choisissez le profil qui correspond à votre rôle dans l’écosystème ivoirien."
                : "Choose the profile that matches your role in Côte d’Ivoire’s career ecosystem."}
            </p>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4" role="status" aria-live="polite">
                <div className="h-8 w-56 animate-pulse rounded-lg bg-muted" />
                <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted" />
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-11 animate-pulse rounded-xl bg-muted" />
                ))}
                <span className="sr-only">{language === "fr" ? "Chargement du formulaire d’inscription" : "Loading registration form"}</span>
              </div>
            }
          >
            <RegisterForm />
          </Suspense>
        </> : (
          <WaitlistForm />
        )}
      </div>
    </AuthShell>
  );
}
