"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, KeyRound, Loader2, ShieldAlert } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useLocalization } from "@/context/localization-context";
import { apiFetch, ApiClientError } from "@/lib/api-client";

function ResetPasswordForm() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) {
      setError(fr ? "Les deux mots de passe ne correspondent pas." : "The two passwords do not match.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/auth/password/reset", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
      setDone(true);
    } catch (submissionError) {
      const code = submissionError instanceof ApiClientError ? submissionError.code : "request_failed";
      const messages: Record<string, { fr: string; en: string }> = {
        invalid_reset_token: {
          fr: "Ce lien n’est plus valable. Demandez un nouveau lien pour continuer.",
          en: "This link is no longer valid. Request a new one to continue.",
        },
        weak_password: {
          fr: "Choisissez au moins 12 caractères avec une lettre et un chiffre.",
          en: "Choose at least 12 characters with a letter and a number.",
        },
        rate_limited: {
          fr: "Trop de tentatives ont été effectuées. Patientez avant de réessayer.",
          en: "Too many attempts were made. Wait before trying again.",
        },
      };
      const message = messages[code] ?? {
        fr: "Le mot de passe n’a pas pu être modifié. Vérifiez votre connexion puis réessayez.",
        en: "The password could not be changed. Check your connection and try again.",
      };
      setError(message[language]);
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-left" role="status" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-semibold tracking-[-0.03em]">
            {fr ? "Votre accès est sécurisé" : "Your access is secure"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {fr
              ? "Votre mot de passe a été modifié. Toutes les anciennes sessions ont été fermées pour protéger votre compte."
              : "Your password was changed. All older sessions were closed to protect your account."}
          </p>
        </div>
        <Button asChild className="w-full">
          <Link href="/login">
            {fr ? "Me connecter" : "Sign in"}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="space-y-5 text-left" role="alert">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-semibold tracking-[-0.03em]">
            {fr ? "Ce lien est incomplet" : "This link is incomplete"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {fr
              ? "Utilisez le lien reçu dans votre e-mail ou demandez-en un nouveau."
              : "Use the link from your email or request a new one."}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/forgot-password">{fr ? "Demander un nouveau lien" : "Request a new link"}</Link>
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="mb-7">
        <span className="section-kicker">{fr ? "Sécurité" : "Security"}</span>
        <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Créer un nouveau mot de passe" : "Create a new password"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Ce lien est à usage unique et expire après une heure."
            : "This link works once and expires after one hour."}
        </p>
      </div>
      <form className="space-y-5" onSubmit={submit} aria-busy={submitting}>
        <div className="space-y-2">
          <Label htmlFor="password">{fr ? "Nouveau mot de passe" : "New password"}</Label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
            disabled={submitting}
            onSuggest={(suggestion) => {
              setPassword(suggestion);
              setConfirmation(suggestion);
            }}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="confirmation">{fr ? "Confirmer le mot de passe" : "Confirm password"}</Label>
          <PasswordInput
            id="confirmation"
            value={confirmation}
            onChange={(event) => setConfirmation(event.target.value)}
            minLength={12}
            maxLength={128}
            required
            autoComplete="new-password"
            disabled={submitting}
            hideSuggestions
          />
        </div>
        <div className="grid gap-2 rounded-xl border border-primary/15 bg-primary/[0.06] p-3 text-xs text-muted-foreground">
          <p className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {fr ? "12 caractères minimum" : "At least 12 characters"}
          </p>
          <p className="flex items-center gap-2">
            <Check className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
            {fr ? "Au moins une lettre et un chiffre" : "At least one letter and one number"}
          </p>
        </div>
        {error && (
          <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          {submitting ? (fr ? "Mise à jour…" : "Updating…") : fr ? "Sécuriser mon compte" : "Secure my account"}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const { language } = useLocalization();
  return (
    <AuthShell
      eyebrow={{ fr: "Accès protégé", en: "Protected access" }}
      title={{ fr: "Une nouvelle clé pour repartir.", en: "A new key to move forward." }}
      description={{
        fr: "Protégez votre espace Yahnu avant de retrouver vos opportunités et vos échanges.",
        en: "Protect your Yahnu space before returning to your opportunities and conversations.",
      }}
    >
      <Suspense
        fallback={
          <div className="flex min-h-72 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{language === "fr" ? "Vérification du lien…" : "Checking the link…"}</p>
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  );
}
