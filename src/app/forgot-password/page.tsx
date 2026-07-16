"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalization } from "@/context/localization-context";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

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
      const rateLimited = submissionError instanceof ApiClientError && submissionError.code === "rate_limited";
      setError(
        rateLimited
          ? fr
            ? "Trop de demandes ont été envoyées. Patientez un moment avant de réessayer."
            : "Too many requests were sent. Wait a moment before trying again."
          : fr
            ? "Le lien n’a pas pu être demandé. Vérifiez votre connexion puis réessayez."
            : "The link could not be requested. Check your connection and try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={{ fr: "Accès au compte", en: "Account access" }}
      title={{ fr: "Un contretemps, pas un arrêt.", en: "A small setback, not a stop." }}
      description={{
        fr: "Demandez un lien sécurisé et reprenez votre parcours Yahnu en quelques minutes.",
        en: "Request a secure link and get back to your Yahnu journey in a few minutes.",
      }}
      points={[
        { fr: "Lien valable pendant une heure", en: "Link valid for one hour" },
        { fr: "Anciennes sessions fermées après modification", en: "Old sessions closed after the change" },
        { fr: "Votre adresse reste confidentielle", en: "Your address remains private" },
      ]}
    >
      <div className="mb-7">
        <span className="section-kicker">{fr ? "Mot de passe" : "Password"}</span>
        <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Retrouver mon accès" : "Recover my access"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Saisissez l’adresse utilisée pour votre compte. La réponse reste volontairement discrète pour protéger vos informations."
            : "Enter the address used for your account. The response stays intentionally discreet to protect your information."}
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
                aria-describedby="email-help"
              />
            </div>
            <p id="email-help" className="text-xs text-muted-foreground">
              {fr ? "Exemple : awa.kone@exemple.ci" : "Example: awa.kone@exemple.ci"}
            </p>
          </div>
          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
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
