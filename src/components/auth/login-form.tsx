"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useAuth } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { ApiClientError } from "@/lib/api-client";
import { safeAppReturnTo, safeDashboardReturnTo } from "@/lib/auth-navigation";
import { adminRoles } from "@/lib/auth-types";
import { resolveDashboardDestination, resolvePostLoginDestination } from "@/lib/dashboard-navigation";

function createLoginSchema(language: "fr" | "en") {
  const fr = language === "fr";
  return z.object({
    email: z.string().trim().email({
      message: fr ? "Saisissez une adresse e-mail valide." : "Enter a valid email address.",
    }),
    password: z.string().min(1, {
      message: fr ? "Saisissez votre mot de passe." : "Enter your password.",
    }),
  });
}

type LoginValues = z.infer<ReturnType<typeof createLoginSchema>>;

type LoginFormProps = {
  adminEntry?: boolean;
};

export function LoginForm({ adminEntry = false }: LoginFormProps) {
  const { language } = useLocalization();
  const fr = language === "fr";
  const schema = React.useMemo(() => createLoginSchema(language), [language]);
  const { signIn, signInWithGoogle, googleEnabled } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const requestedReturnTo = safeAppReturnTo(searchParams.get("next"));
  const signupHref = requestedReturnTo
    ? `/signup?next=${encodeURIComponent(requestedReturnTo)}`
    : "/signup";

  const form = useForm<LoginValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  React.useEffect(() => {
    const authError = searchParams?.get("auth");
    if (!authError) return;

    const messages: Record<string, { fr: string; en: string }> = {
      pending_graduate: {
        fr: "Votre compte attend la validation de votre établissement. Contactez son équipe administrative si nécessaire.",
        en: "Your account is awaiting approval from your school. Contact its administrative team if needed.",
      },
      pending_org: {
        fr: "Votre organisation attend la validation de l’équipe Yahnu.",
        en: "Your organisation is awaiting approval from the Yahnu team.",
      },
      suspended: {
        fr: "Ce compte est suspendu. Contactez l’assistance Yahnu pour connaître la marche à suivre.",
        en: "This account is suspended. Contact Yahnu support for next steps.",
      },
      declined: {
        fr: "Cette inscription n’a pas été validée. Contactez l’assistance si vous pensez qu’il s’agit d’une erreur.",
        en: "This registration was not approved. Contact support if you believe this is a mistake.",
      },
      google_auth_disabled: {
        fr: "La connexion Google n’est pas disponible pour le moment. Utilisez votre adresse et votre mot de passe.",
        en: "Google sign-in is not available right now. Use your email address and password.",
      },
      google_registration_required: {
        fr: "Créez d’abord votre compte Yahnu, puis utilisez Google avec la même adresse e-mail.",
        en: "Create your Yahnu account first, then use Google with the same email address.",
      },
    };
    const message = messages[authError] ?? {
      fr: "La connexion Google n’a pas abouti. Réessayez ou utilisez votre mot de passe.",
      en: "Google sign-in did not complete. Try again or use your password.",
    };

    toast({
      title: fr ? "Connexion non terminée" : "Sign-in not completed",
      description: message[language],
      variant: "destructive",
    });
    const nextParameters = new URLSearchParams(searchParams.toString());
    nextParameters.delete("auth");
    const nextQuery = nextParameters.toString();
    router.replace(nextQuery ? `/login?${nextQuery}` : "/login");
  }, [fr, language, router, searchParams, toast]);

  async function onSubmit(values: LoginValues) {
    setIsLoading(true);
    try {
      const authenticatedUser = await signIn(values.email, values.password);
      const requestedPath = searchParams?.get("next");
      const destination = adminEntry
        ? resolveDashboardDestination(authenticatedUser.role, requestedPath)
        : resolvePostLoginDestination(authenticatedUser.role, requestedPath);
      const lacksAdminAccess = adminEntry && !adminRoles.has(authenticatedUser.role);

      toast(lacksAdminAccess ? {
        title: fr ? "Accès administrateur réservé" : "Administrator access restricted",
        description: fr
          ? "Votre connexion est valide, mais ce compte n’a pas de rôle administrateur. Nous ouvrons son espace autorisé."
          : "Your sign-in is valid, but this account does not have an administrator role. We are opening its authorized space.",
      } : {
        title: adminEntry
          ? (fr ? "Accès sécurisé" : "Secure access granted")
          : (fr ? "Connexion réussie" : "Signed in"),
        description: adminEntry
          ? (fr ? "Ouverture du panneau d’administration Yahnu." : "Opening the Yahnu administration panel.")
          : (fr ? "Bienvenue dans votre espace Yahnu." : "Welcome to your Yahnu space."),
      });

      router.replace(destination);
      router.refresh();
    } catch (error: unknown) {
      const code = error instanceof ApiClientError ? error.code : undefined;
      const messages: Record<string, { fr: string; en: string }> = {
        invalid_credentials: {
          fr: "L’adresse ou le mot de passe est incorrect. Vérifiez-les puis réessayez.",
          en: "The email address or password is incorrect. Check them and try again.",
        },
        rate_limited: {
          fr: "Trop de tentatives ont été effectuées. Réinitialisez votre mot de passe pour retrouver immédiatement l’accès, ou patientez avant de réessayer.",
          en: "Too many attempts were made. Reset your password to restore access now, or wait before trying again.",
        },
        pending_graduate: {
          fr: "Votre compte attend la validation de votre établissement. Contactez son équipe administrative si nécessaire.",
          en: "Your account is awaiting approval from your school. Contact its administrative team if needed.",
        },
        pending_org: {
          fr: "Votre organisation attend la validation de l’équipe Yahnu.",
          en: "Your organisation is awaiting approval from the Yahnu team.",
        },
        suspended: {
          fr: "Ce compte est suspendu. Contactez l’assistance Yahnu pour connaître la marche à suivre.",
          en: "This account is suspended. Contact Yahnu support for next steps.",
        },
        declined: {
          fr: "Cette inscription n’a pas été validée. Contactez l’assistance si vous pensez qu’il s’agit d’une erreur.",
          en: "This registration was not approved. Contact support if you believe this is a mistake.",
        },
        email_unverified: {
          fr: "Vérifiez votre adresse avant de vous connecter. Le lien Yahnu se trouve dans votre boîte mail ou vos indésirables.",
          en: "Verify your address before signing in. The Yahnu link is in your inbox or spam folder.",
        },
      };
      const message = (code ? messages[code] : undefined) ?? {
        fr: "La connexion n’a pas abouti. Vérifiez vos informations et votre connexion internet, puis réessayez.",
        en: "Sign-in did not complete. Check your details and internet connection, then try again.",
      };

      toast({
        title: fr ? "Connexion impossible" : "Unable to sign in",
        description: message[language],
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      const requestedPath = searchParams?.get("next");
      await signInWithGoogle(
        (adminEntry ? safeDashboardReturnTo(requestedPath) : safeAppReturnTo(requestedPath)) ?? "/dashboard",
      );
    } catch (error: unknown) {
      const rawMessage = error instanceof Error ? error.message : "request_failed";
      const messages: Record<string, { fr: string; en: string }> = {
        pending_graduate: {
          fr: "Votre compte attend la validation de votre établissement.",
          en: "Your account is awaiting approval from your school.",
        },
        pending_org: {
          fr: "Votre organisation attend la validation de l’équipe Yahnu.",
          en: "Your organisation is awaiting approval from the Yahnu team.",
        },
        suspended: {
          fr: "Ce compte est suspendu. Contactez l’assistance Yahnu.",
          en: "This account is suspended. Contact Yahnu support.",
        },
        email_unverified: {
          fr: "Vérifiez votre adresse e-mail avant de vous connecter.",
          en: "Verify your email address before signing in.",
        },
      };
      const message = messages[rawMessage] ?? {
        fr: "La connexion Google n’a pas abouti. Réessayez ou utilisez votre mot de passe.",
        en: "Google sign-in did not complete. Try again or use your password.",
      };
      toast({
        title: fr ? "Connexion Google impossible" : "Unable to sign in with Google",
        description: message[language],
        variant: "destructive",
      });
      setIsLoading(false);
    }
  }

  return (
    <>
      <div className="text-left">
        <h1 className="font-headline text-3xl font-semibold leading-tight tracking-[-0.04em]">
          {adminEntry
            ? (fr ? "Administration Yahnu" : "Yahnu administration")
            : (fr ? "Ravi de vous revoir" : "Welcome back")}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {adminEntry
            ? (
              fr
                ? "Identifiez-vous pour rejoindre directement votre espace de pilotage."
                : "Sign in to go directly to your operations workspace."
            )
            : (
              fr
                ? "Connectez-vous pour retrouver votre parcours Yahnu."
                : "Sign in to continue your Yahnu journey."
            )}
        </p>
      </div>

      {adminEntry ? (
        <aside
          className="relative mt-6 overflow-hidden rounded-2xl border border-primary/20 bg-[hsl(var(--sidebar-background))] p-4 text-[hsl(var(--sidebar-foreground))] shadow-sm"
          aria-labelledby="admin-access-title"
        >
          <div className="ci-pattern pointer-events-none absolute inset-0 opacity-20" aria-hidden="true" />
          <div className="relative flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground ring-4 ring-white/5">
              <ShieldCheck className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p id="admin-access-title" className="font-headline text-base font-semibold text-white">
                {fr ? "Portail de pilotage protégé" : "Protected operations portal"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/65">
                {fr
                  ? "Après vérification, votre rôle détermine automatiquement les outils et données accessibles."
                  : "After verification, your role automatically determines which tools and data you can access."}
              </p>
            </div>
          </div>
        </aside>
      ) : (
        <aside
          className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.07] p-4 shadow-sm"
          aria-labelledby="legacy-account-title"
        >
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <KeyRound className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p id="legacy-account-title" className="font-headline text-base font-semibold text-foreground">
                {fr ? "Votre compte date d’avant la migration ?" : "Was your account created before the migration?"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {fr
                  ? "Pour protéger vos données, les anciens mots de passe n’ont pas été transférés. Utilisez votre adresse habituelle pour en créer un nouveau."
                  : "To protect your data, old passwords were not transferred. Use your usual email address to create a new one."}
              </p>
              <Button asChild variant="outline" size="sm" className="mt-3 w-full bg-card/80 sm:w-auto">
                <Link href="/forgot-password">
                  {fr ? "Réactiver mon accès" : "Restore my access"}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </aside>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5" aria-busy={isLoading} noValidate>
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fr ? "Adresse e-mail" : "Email address"}</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder={adminEntry ? "administration@yahnu.org" : "awa.kone@exemple.ci"}
                    {...field}
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center gap-3">
                  <FormLabel>{fr ? "Mot de passe" : "Password"}</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="ml-auto rounded-md text-sm font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {fr ? "Mot de passe oublié ?" : "Forgot password?"}
                  </Link>
                </div>
                <FormControl>
                  <PasswordInput {...field} disabled={isLoading} hideSuggestions autoComplete="current-password" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
            {isLoading
              ? (fr ? "Connexion…" : "Signing in…")
              : adminEntry
                ? (fr ? "Ouvrir l’administration" : "Open administration")
                : (fr ? "Accéder à mon espace" : "Open my space")}
          </Button>

          {googleEnabled && (
            <div className="relative py-1" aria-hidden="true">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs font-bold uppercase tracking-[0.12em]">
                <span className="bg-card px-3 text-muted-foreground">{fr ? "Ou" : "Or"}</span>
              </div>
            </div>
          )}

          {googleEnabled && (
            <Button
              variant="outline"
              type="button"
              className="w-full"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            >
              <svg className="h-4 w-4" aria-hidden="true" focusable="false" viewBox="0 0 488 512">
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177 60.4L373 124.9c-32.5-30.3-74.2-48.7-125-48.7-93.1 0-170 73.1-170 180s76.9 180 170 180c101.4 0 148.2-73.3 152.8-112.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              {fr ? "Continuer avec Google" : "Continue with Google"}
            </Button>
          )}
        </form>
      </Form>

      {adminEntry ? (
        <div className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          <Link
            href="/"
            className="inline-flex min-h-11 items-center gap-2 rounded-lg px-3 font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {fr ? "Retour au site public Yahnu" : "Back to the public Yahnu site"}
          </Link>
        </div>
      ) : (
        <div className="mt-6 border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          <p>
            {fr ? "Vous découvrez Yahnu ?" : "New to Yahnu?"}{" "}
            <Link href={signupHref} className="font-semibold text-primary underline-offset-4 hover:underline">
              {fr ? "Créer un compte" : "Create an account"}
            </Link>
          </p>
          <p className="mt-2">
            <Link href="/resend-verification" className="font-semibold text-foreground underline-offset-4 hover:text-primary hover:underline">
              {fr ? "Je n’ai pas reçu mon e-mail de vérification" : "I did not receive my verification email"}
            </Link>
          </p>
        </div>
      )}
    </>
  );
}
