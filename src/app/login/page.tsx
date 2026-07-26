"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";

import { AuthShell, type LocalizedText } from "@/components/auth/auth-shell";
import { LoginForm } from "@/components/auth/login-form";
import { WaitlistForm } from "@/components/auth/waitlist-form";
import { useCountry } from "@/context/country-context";
import { useLocalization } from "@/context/localization-context";
import { safeDashboardReturnTo } from "@/lib/auth-navigation";

const memberExperience = {
  eyebrow: { fr: "Votre prochaine étape", en: "Your next move" },
  title: {
    fr: "Retrouvez votre élan professionnel.",
    en: "Pick up your professional momentum.",
  },
  description: {
    fr: "Reprenez votre parcours là où vous l’avez laissé : profil, candidatures et connexions avec l’écosystème ivoirien.",
    en: "Continue where you left off: your profile, applications and connections across Côte d’Ivoire’s career ecosystem.",
  },
  points: [
    { fr: "Vos candidatures au même endroit", en: "Your applications in one place" },
    { fr: "Des opportunités d’Abidjan à San-Pédro", en: "Opportunities from Abidjan to San-Pédro" },
    { fr: "Un accès protégé à votre espace", en: "Secure access to your space" },
  ],
} satisfies {
  eyebrow: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  points: LocalizedText[];
};

const adminExperience = {
  eyebrow: { fr: "Accès privilégié", en: "Privileged access" },
  title: {
    fr: "Pilotez Yahnu sans détour.",
    en: "Lead Yahnu without detours.",
  },
  description: {
    fr: "Un point d’entrée direct et sécurisé pour superviser le réseau Yahnu, ses partenaires et ses opérations en Côte d’Ivoire.",
    en: "A direct, secure entry point for overseeing the Yahnu network, its partners and operations in Côte d’Ivoire.",
  },
  points: [
    { fr: "Accès direct au panneau d’administration", en: "Direct access to the administration panel" },
    { fr: "Contrôles d’accès fondés sur votre rôle", en: "Role-based access controls" },
    { fr: "Activité opérationnelle centralisée", en: "Centralized operational activity" },
  ],
} satisfies typeof memberExperience;

function LoginExperience() {
  const { country } = useCountry();
  const { language } = useLocalization();
  const searchParams = useSearchParams();
  const isLaunchCountry = country.code === "CI";
  const requestedPath = safeDashboardReturnTo(searchParams.get("next"));
  const isAdminEntry = searchParams.get("entry") === "admin"
    || requestedPath?.startsWith("/dashboard/admin") === true;
  const experience = isAdminEntry ? adminExperience : memberExperience;

  return (
    <AuthShell
      eyebrow={experience.eyebrow}
      title={experience.title}
      description={experience.description}
      points={experience.points}
      imagePosition={isAdminEntry ? "58% center" : "center"}
    >
      {isLaunchCountry ? (
        <LoginForm adminEntry={isAdminEntry} />
      ) : (
        <WaitlistForm />
      )}
    </AuthShell>
  );
}

function LoginPageFallback() {
  const { language } = useLocalization();

  return (
    <AuthShell
      eyebrow={memberExperience.eyebrow}
      title={memberExperience.title}
      description={memberExperience.description}
      points={memberExperience.points}
    >
      <div className="space-y-4" role="status" aria-live="polite">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-muted" />
        <div className="h-4 w-64 max-w-full animate-pulse rounded bg-muted" />
        <div className="mt-7 h-20 animate-pulse rounded-2xl bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
        <div className="h-11 animate-pulse rounded-xl bg-muted" />
        <span className="sr-only">
          {language === "fr" ? "Chargement du formulaire de connexion" : "Loading sign-in form"}
        </span>
      </div>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<LoginPageFallback />}>
      <LoginExperience />
    </Suspense>
  );
}
