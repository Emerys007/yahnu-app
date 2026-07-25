"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleAlert, KeyRound, Loader2, Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalization } from "@/context/localization-context";
import { apiFetch, ApiClientError } from "@/lib/api-client";

type RecoveryErrorCode = "email_unavailable" | "rate_limited" | "request_failed";

export default function ForgotPasswordPage() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<RecoveryErrorCode | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);
  const errorMessage =
    error === "email_unavailable"
      ? fr
        ? "Le service d’envoi Yahnu est temporairement indisponible. Aucun lien n’a été envoyé."
        : "Yahnu’s email service is temporarily unavailable. No link was sent."
      : error === "rate_limited"
        ? fr
          ? "Trop de demandes ont été envoyées. Patientez un moment avant de réessayer."
          : "Too many requests were sent. Wait a moment before trying again."
        : fr
          ? "Le lien n’a pas pu être demandé. Vérifiez votre connexion puis réessayez."
          : "The link could not be requested. Check your connection and try again.";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: { debugUrl?: string } }>("/api/auth/password/forgot", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setDebugUrl(response.data.debugUrl ?? null);
      setSent(true);
    } catch (submissionError) {
      const code = submissionError instanceof ApiClientError ? submissionError.code : "request_failed";
      if (code === "email_unavailable") {
        setError(code);
      } else if (code === "rate_limited") {
        setError(code);
      } else {
        setError("request_failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={{ fr: "Continuité du compte", en: "Account continuity" }}
      title={{ fr: "Votre compte vous suit.", en: "Your account moves with you." }}
      description={{
        fr: "Yahnu a changé d’infrastructure, pas votre place dans la communauté. Réactivez votre accès en toute sécurité.",
        en: "Yahnu changed infrastructure, not your place in the community. Restore your access securely.",
      }}
      points={[
        { fr: "Même adresse e-mail qu’avant", en: "Use the same email address as before" },
        { fr: "Lien valable pendant une heure", en: "Link valid for one hour" },
        { fr: "Réponse neutre pour garder votre compte confidentiel", en: "Neutral response to keep your account private" },
      ]}
    >
      <div className="mb-7">
        <span className="section-kicker">{fr ? "Mot de passe" : "Password"}</span>
        <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Réactiver ou sécuriser mon accès" : "Restore or secure my access"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Les mots de passe de l’ancienne version n’ont pas été transférés. Si votre compte existait déjà, saisissez la même adresse e-mail pour en créer un nouveau."
            : "Passwords from the previous version were not transferred. If you already had an account, enter the same email address to create a new password."}
        </p>
      </div>

      {sent ? (
        <div className="space-y-5" role="status" aria-live="polite">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">{fr ? "Consultez votre boîte mail" : "Check your inbox"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {fr
                ? "Si un compte correspond à cette adresse, un lien sécurisé vient d’être envoyé. Pensez aussi au dossier des indésirables."
                : "If an account matches that address, a secure link has been sent. Remember to check your spam folder too."}
            </p>
          </div>
          {debugUrl && (
            <Button asChild variant="outline" className="w-full">
              <Link href={debugUrl}>{fr ? "Ouvrir le lien de test local" : "Open local test link"}</Link>
            </Button>
          )}
          <Button asChild className="w-full">
            <Link href="/login">
              {fr ? "Revenir à la connexion" : "Back to sign in"}
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
      ) : (
        <form className="space-y-5" onSubmit={handleSubmit} aria-busy={isSubmitting}>
          <div className="flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.07] p-4">
            <KeyRound className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
            <p className="text-sm leading-relaxed text-foreground">
              {fr
                ? "Compte de l’ancienne version : utilisez ici votre adresse habituelle, sans tenter de retrouver l’ancien mot de passe."
                : "Previous-version account: use your usual email address here; you do not need to recover the old password."}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">{fr ? "Adresse e-mail" : "Email address"}</Label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                placeholder="awa.kone@exemple.ci"
                required
                autoComplete="email"
                inputMode="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={isSubmitting}
                className="pl-10"
                aria-describedby={error ? "email-help recovery-error" : "email-help"}
              />
            </div>
            <p id="email-help" className="text-xs text-muted-foreground">
              {fr ? "Exemple : awa.kone@exemple.ci" : "Example: awa.kone@exemple.ci"}
            </p>
          </div>
          {error && (
            <div
              id="recovery-error"
              className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-foreground"
              role="alert"
            >
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden="true" />
              <div>
                <p>{errorMessage}</p>
                {error === "email_unavailable" && (
                  <p className="mt-2">
                    <a href="mailto:contact@yahnu.org" className="font-semibold underline underline-offset-4">
                      {fr ? "Écrire à contact@yahnu.org" : "Email contact@yahnu.org"}
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            {isSubmitting ? (fr ? "Envoi en cours…" : "Sending…") : fr ? "Recevoir un lien sécurisé" : "Send a secure link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              {fr ? "Je me souviens de mon mot de passe" : "I remember my password"}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
