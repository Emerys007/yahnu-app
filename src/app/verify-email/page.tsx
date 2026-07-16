"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, CheckCircle2, Loader2, MailCheck, ShieldAlert } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/context/localization-context";
import { apiFetch, ApiClientError } from "@/lib/api-client";

function VerificationAction() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const token = useSearchParams().get("token") ?? "";
  const [state, setState] = useState<"ready" | "loading" | "done">("ready");
  const [error, setError] = useState<string | null>(null);
  const [reauthenticationRequired, setReauthenticationRequired] = useState(false);

  async function verify() {
    setState("loading");
    setError(null);
    try {
      const response = await apiFetch<{ data: { reauthenticationRequired: boolean } }>("/api/auth/verify", {
        method: "POST",
        body: JSON.stringify({ token }),
      });
      setReauthenticationRequired(response.data.reauthenticationRequired);
      setState("done");
    } catch (verificationError) {
      setState("ready");
      const code = verificationError instanceof ApiClientError ? verificationError.code : "request_failed";
      const messages: Record<string, { fr: string; en: string }> = {
        invalid_verification_token: {
          fr: "Ce lien n’est plus valable. Demandez un nouveau lien de vérification.",
          en: "This link is no longer valid. Request a new verification link.",
        },
        email_in_use: {
          fr: "Cette adresse est déjà associée à un autre compte Yahnu.",
          en: "This address is already linked to another Yahnu account.",
        },
        rate_limited: {
          fr: "Trop de tentatives ont été effectuées. Patientez avant de réessayer.",
          en: "Too many attempts were made. Wait before trying again.",
        },
      };
      const message = messages[code] ?? {
        fr: "L’adresse n’a pas pu être vérifiée. Vérifiez votre connexion puis réessayez.",
        en: "The address could not be verified. Check your connection and try again.",
      };
      setError(message[language]);
    }
  }

  if (!token) {
    return (
      <div className="space-y-5" role="alert">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <ShieldAlert className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-semibold tracking-[-0.03em]">
            {fr ? "Le lien est incomplet" : "The link is incomplete"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {fr
              ? "Ouvrez le lien complet reçu dans votre boîte mail ou demandez-en un nouveau."
              : "Open the complete link from your inbox or request a new one."}
          </p>
        </div>
        <Button asChild variant="outline" className="w-full">
          <Link href="/resend-verification">{fr ? "Demander un nouveau lien" : "Request a new link"}</Link>
        </Button>
      </div>
    );
  }

  if (state === "done") {
    return (
      <div className="space-y-5" role="status" aria-live="polite">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
        </div>
        <div>
          <h2 className="font-headline text-2xl font-semibold tracking-[-0.03em]">
            {fr ? "Adresse confirmée" : "Address confirmed"}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {reauthenticationRequired
              ? fr
                ? "Votre nouvelle adresse est enregistrée. Par sécurité, vos anciennes sessions ont été fermées : reconnectez-vous avec cette adresse."
                : "Your new address is saved. For security, older sessions were closed: sign in again with the new address."
              : fr
                ? "Votre adresse est vérifiée. Si votre compte a aussi été approuvé, vous pouvez maintenant vous connecter."
                : "Your address is verified. If your account has also been approved, you can now sign in."}
          </p>
        </div>
        <Button className="w-full" onClick={() => window.location.assign("/login")}>
          {fr ? "Continuer vers la connexion" : "Continue to sign in"}
          <ArrowRight aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-left">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-lagoon/10 text-lagoon">
        <MailCheck className="h-7 w-7" aria-hidden="true" />
      </div>
      <div>
        <span className="section-kicker">{fr ? "Dernière étape" : "Final step"}</span>
        <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Confirmer mon adresse" : "Confirm my address"}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Cette action confirme que l’adresse vous appartient. Le lien ne peut être utilisé qu’une seule fois."
            : "This confirms that the address belongs to you. The link can only be used once."}
        </p>
      </div>
      {error && (
        <div className="space-y-3 rounded-xl border border-destructive/20 bg-destructive/10 p-3" role="alert">
          <p className="text-sm text-destructive">{error}</p>
          <Link href="/resend-verification" className="inline-flex text-sm font-semibold text-destructive underline underline-offset-4">
            {fr ? "Recevoir un autre lien" : "Get another link"}
          </Link>
        </div>
      )}
      <Button className="w-full" onClick={verify} disabled={state === "loading"}>
        {state === "loading" ? <Loader2 className="animate-spin" aria-hidden="true" /> : <MailCheck aria-hidden="true" />}
        {state === "loading" ? (fr ? "Vérification…" : "Verifying…") : fr ? "Vérifier mon adresse" : "Verify my address"}
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  const { language } = useLocalization();
  return (
    <AuthShell
      eyebrow={{ fr: "Confiance", en: "Trust" }}
      title={{ fr: "Une identité claire ouvre les bonnes portes.", en: "A clear identity opens the right doors." }}
      description={{
        fr: "La vérification protège les échanges entre diplômés, établissements et recruteurs ivoiriens.",
        en: "Verification protects conversations between Ivorian graduates, schools and recruiters.",
      }}
    >
      <Suspense
        fallback={
          <div className="flex min-h-72 flex-col items-center justify-center gap-3" role="status" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">{language === "fr" ? "Lecture du lien sécurisé…" : "Reading secure link…"}</p>
          </div>
        }
      >
        <VerificationAction />
      </Suspense>
    </AuthShell>
  );
}
