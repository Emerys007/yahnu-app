"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, Loader2, MailCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocalization } from "@/context/localization-context";
import { apiFetch, ApiClientError } from "@/lib/api-client";

export default function ResendVerificationPage() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: { debugUrl?: string } }>("/api/auth/verify/resend", {
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
            ? "Trop de liens ont été demandés. Patientez avant de réessayer."
            : "Too many links were requested. Wait before trying again."
          : fr
            ? "La demande n’a pas abouti. Vérifiez votre connexion puis réessayez."
            : "The request did not go through. Check your connection and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      eyebrow={{ fr: "Vérification", en: "Verification" }}
      title={{ fr: "Votre adresse, votre identité.", en: "Your address, your identity." }}
      description={{
        fr: "Une adresse vérifiée permet à votre établissement, aux entreprises et à Yahnu de vous retrouver au bon endroit.",
        en: "A verified address helps your school, employers and Yahnu reach the right person.",
      }}
      points={[
        { fr: "Lien valable pendant 24 heures", en: "Link valid for 24 hours" },
        { fr: "Envoi neutre pour protéger votre compte", en: "Neutral response to protect your account" },
        { fr: "Un seul clic pour confirmer", en: "One click to confirm" },
      ]}
    >
      <div className="mb-7">
        <span className="section-kicker">{fr ? "Adresse e-mail" : "Email address"}</span>
        <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Recevoir un nouveau lien" : "Get a new link"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Indiquez l’adresse utilisée lors de votre inscription à Yahnu."
            : "Enter the address you used when creating your Yahnu account."}
        </p>
      </div>

      {sent ? (
        <div className="space-y-5" role="status" aria-live="polite">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h3 className="font-headline text-xl font-semibold">{fr ? "La demande est enregistrée" : "Request received"}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {fr
                ? "Si un compte non vérifié correspond à cette adresse, un nouveau lien vient d’être envoyé. Vérifiez aussi les indésirables."
                : "If an unverified account matches that address, a new link has been sent. Check your spam folder too."}
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
        <form className="space-y-5" onSubmit={submit} aria-busy={submitting}>
          <div className="space-y-2">
            <Label htmlFor="email">{fr ? "Adresse e-mail" : "Email address"}</Label>
            <div className="relative">
              <MailCheck className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                inputMode="email"
                placeholder="koffi.yao@exemple.ci"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={submitting}
                className="pl-10"
                aria-describedby="verification-email-help"
              />
            </div>
            <p id="verification-email-help" className="text-xs text-muted-foreground">
              {fr ? "Exemple : koffi.yao@exemple.ci" : "Example: koffi.yao@exemple.ci"}
            </p>
          </div>
          {error && (
            <p className="rounded-xl border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MailCheck aria-hidden="true" />}
            {submitting ? (fr ? "Envoi en cours…" : "Sending…") : fr ? "Envoyer un nouveau lien" : "Send a new link"}
          </Button>
          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
              {fr ? "Mon adresse est déjà vérifiée" : "My address is already verified"}
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}
