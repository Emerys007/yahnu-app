"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { AlertTriangle, ArrowRight, Clock3, Loader2, ShieldCheck, UserRoundCheck } from "lucide-react";

import { AuthShell } from "@/components/auth/auth-shell";
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
import { useAuth, type Role, type UserProfile } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiClientError } from "@/lib/api-client";

function createAdminRegisterSchema(language: "fr" | "en") {
  const fr = language === "fr";
  return z
    .object({
      firstName: z.string().trim().min(2, {
        message: fr ? "Indiquez un prénom d’au moins 2 caractères." : "Enter a first name with at least 2 characters.",
      }),
      lastName: z.string().trim().min(2, {
        message: fr ? "Indiquez un nom d’au moins 2 caractères." : "Enter a last name with at least 2 characters.",
      }),
      password: z
        .string()
        .min(12, { message: fr ? "Utilisez au moins 12 caractères." : "Use at least 12 characters." })
        .max(128, { message: fr ? "Utilisez 128 caractères maximum." : "Use no more than 128 characters." })
        .regex(/^(?=.*[A-Za-z])(?=.*\d)/, {
          message: fr ? "Ajoutez au moins une lettre et un chiffre." : "Add at least one letter and one number.",
        }),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: fr ? "Les deux mots de passe ne correspondent pas." : "The two passwords do not match.",
      path: ["confirmPassword"],
    });
}

type AdminRegisterValues = z.infer<ReturnType<typeof createAdminRegisterSchema>>;

type InviteData = {
  maskedEmail: string;
  role: Role;
  expiresAt: string;
};

export default function AdminRegistrationPage() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const tokenParam = params.token;
  const token = Array.isArray(tokenParam) ? tokenParam[0] : tokenParam ?? "";
  const schema = React.useMemo(() => createAdminRegisterSchema(language), [language]);

  const [isLoading, setIsLoading] = React.useState(false);
  const [isValidating, setIsValidating] = React.useState(true);
  const [inviteData, setInviteData] = React.useState<InviteData | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();

    async function validateToken() {
      if (!token) {
        setError(fr ? "Ce lien d’invitation est incomplet." : "This invitation link is incomplete.");
        setIsValidating(false);
        return;
      }

      try {
        const response = await apiFetch<{ data: InviteData }>(`/api/invites/${encodeURIComponent(token)}`, {
          signal: controller.signal,
        });
        if (!controller.signal.aborted) setInviteData(response.data);
      } catch (validationError) {
        if (controller.signal.aborted) return;
        const invalid = validationError instanceof ApiClientError && validationError.code === "invalid_invitation";
        setError(
          invalid
            ? fr
              ? "Cette invitation a expiré ou a déjà été utilisée. Demandez un nouveau lien à votre administrateur Yahnu."
              : "This invitation has expired or was already used. Ask your Yahnu administrator for a new link."
            : fr
              ? "L’invitation n’a pas pu être vérifiée. Vérifiez votre connexion puis réessayez."
              : "The invitation could not be checked. Check your connection and try again.",
        );
      } finally {
        if (!controller.signal.aborted) setIsValidating(false);
      }
    }

    void validateToken();
    return () => controller.abort();
  }, [fr, token]);

  const form = useForm<AdminRegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: AdminRegisterValues) {
    if (!inviteData) return;
    setIsLoading(true);

    try {
      const name = `${values.firstName} ${values.lastName}`;
      const profileData: Omit<UserProfile, "uid" | "status"> = {
        name,
        firstName: values.firstName,
        lastName: values.lastName,
        email: null,
        role: inviteData.role,
      };

      const registration = await signUp(profileData, values.password, token);

      toast({
        title: fr ? "Compte équipe créé" : "Team account created",
        description:
          registration.emailDelivery === "failed"
            ? fr
              ? "Le compte est créé, mais l’e-mail de vérification n’a pas pu être envoyé. Contactez un administrateur Yahnu."
              : "The account was created, but the verification email could not be sent. Contact a Yahnu administrator."
            : fr
              ? "Vérifiez votre adresse e-mail, puis connectez-vous à votre espace Yahnu."
              : "Verify your email address, then sign in to your Yahnu space.",
      });

      if (registration.debugUrl) {
        window.location.assign(registration.debugUrl);
        return;
      }
      router.push("/login");
    } catch (registrationError) {
      const code = registrationError instanceof ApiClientError ? registrationError.code : "request_failed";
      const invalidInvite = code === "invalid_invitation";
      toast({
        title: fr ? "Le compte n’a pas été créé" : "The account was not created",
        description: invalidInvite
          ? fr
            ? "Cette invitation n’est plus valable. Demandez un nouveau lien à votre administrateur Yahnu."
            : "This invitation is no longer valid. Ask your Yahnu administrator for a new link."
          : fr
            ? "Vérifiez les informations saisies et votre connexion, puis réessayez."
            : "Check the information you entered and your connection, then try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  const roleNames: Record<Role, { fr: string; en: string }> = {
    admin: { fr: "Administrateur", en: "Administrator" },
    super_admin: { fr: "Superadministrateur", en: "Super administrator" },
    content_manager: { fr: "Responsable éditorial", en: "Content manager" },
    content_moderator: { fr: "Modérateur de contenu", en: "Content moderator" },
    support_staff: { fr: "Équipe d’assistance", en: "Support team" },
    graduate: { fr: "Jeune diplômé", en: "Graduate" },
    company: { fr: "Entreprise", en: "Employer" },
    school: { fr: "Établissement", en: "School" },
  };

  const expiryLabel = inviteData
    ? new Intl.DateTimeFormat(fr ? "fr-CI" : "en-CI", {
        dateStyle: "long",
        timeStyle: "short",
        timeZone: "Africa/Abidjan",
      }).format(new Date(inviteData.expiresAt))
    : null;

  return (
    <AuthShell
      wide
      eyebrow={{ fr: "Équipe Yahnu", en: "Yahnu team" }}
      title={{ fr: "Construire la confiance, de l’intérieur.", en: "Build trust from the inside." }}
      description={{
        fr: "Cet espace d’invitation est réservé aux personnes appelées à faire vivre la plateforme au quotidien.",
        en: "This invitation space is reserved for the people who help run the platform every day.",
      }}
      points={[
        { fr: "Accès lié à un rôle précis", en: "Access tied to a specific role" },
        { fr: "Invitation vérifiée avant inscription", en: "Invitation checked before registration" },
        { fr: "Mot de passe renforcé dès le départ", en: "Strong password from day one" },
      ]}
    >
      {isValidating ? (
        <div className="flex min-h-80 flex-col items-center justify-center gap-4 text-center" role="status" aria-live="polite">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Loader2 className="h-7 w-7 animate-spin" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-headline text-2xl font-semibold">{fr ? "Vérification de l’invitation" : "Checking invitation"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {fr ? "Nous confirmons le rôle et la validité du lien." : "We’re confirming the role and link validity."}
            </p>
          </div>
        </div>
      ) : error ? (
        <div className="space-y-5 text-left" role="alert">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AlertTriangle className="h-7 w-7" aria-hidden="true" />
          </div>
          <div>
            <h2 className="font-headline text-2xl font-semibold tracking-[-0.03em]">
              {fr ? "Invitation non disponible" : "Invitation unavailable"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{error}</p>
          </div>
          <Button asChild variant="outline" className="w-full">
            <Link href="/">{fr ? "Retourner à l’accueil" : "Return home"}</Link>
          </Button>
        </div>
      ) : inviteData ? (
        <>
          <div className="mb-7">
            <span className="section-kicker">{fr ? "Invitation validée" : "Invitation verified"}</span>
            <h2 className="mt-4 font-headline text-3xl font-semibold tracking-[-0.04em]">
              {fr ? "Finaliser mon accès" : "Complete my access"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {fr
                ? `Vous rejoignez Yahnu comme ${roleNames[inviteData.role].fr.toLocaleLowerCase("fr-CI")}.`
                : `You’re joining Yahnu as ${roleNames[inviteData.role].en.toLocaleLowerCase("en")}.`}
            </p>
          </div>

          <div className="mb-6 grid gap-3 rounded-2xl border border-primary/15 bg-primary/[0.06] p-4 text-sm">
            <p className="flex items-start gap-3">
              <UserRoundCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{fr ? "Rôle" : "Role"}</span>
                <span className="font-semibold">{roleNames[inviteData.role][language]}</span>
              </span>
            </p>
            {expiryLabel && (
              <p className="flex items-start gap-3">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-terra" aria-hidden="true" />
                <span>
                  <span className="block text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">{fr ? "Lien valable jusqu’au" : "Link valid until"}</span>
                  <span className="font-semibold">{expiryLabel} GMT</span>
                </span>
              </p>
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-busy={isLoading} noValidate>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fr ? "Prénom" : "First name"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Awa" autoComplete="given-name" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{fr ? "Nom" : "Last name"}</FormLabel>
                      <FormControl>
                        <Input placeholder="Koné" autoComplete="family-name" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormItem>
                <FormLabel>{fr ? "Adresse e-mail invitée" : "Invited email address"}</FormLabel>
                <FormControl>
                  <Input type="text" value={inviteData.maskedEmail} disabled aria-label={fr ? "Adresse e-mail masquée de l’invitation" : "Masked invitation email address"} />
                </FormControl>
              </FormItem>

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? "Mot de passe" : "Password"}</FormLabel>
                    <FormControl>
                      <PasswordInput
                        autoComplete="new-password"
                        {...field}
                        disabled={isLoading}
                        onSuggest={(suggestion) => {
                          form.setValue("password", suggestion);
                          form.setValue("confirmPassword", suggestion, { shouldValidate: true });
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fr ? "Confirmer le mot de passe" : "Confirm password"}</FormLabel>
                    <FormControl>
                      <PasswordInput autoComplete="new-password" {...field} disabled={isLoading} hideSuggestions />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className="rounded-xl border border-border/70 bg-secondary/55 p-3 text-xs leading-relaxed text-muted-foreground">
                {fr
                  ? "Utilisez au moins 12 caractères avec une lettre et un chiffre. Le bouton étincelle peut générer une proposition forte."
                  : "Use at least 12 characters with a letter and a number. The sparkle button can generate a strong suggestion."}
              </p>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ShieldCheck aria-hidden="true" />}
                {isLoading ? (fr ? "Création du compte…" : "Creating account…") : fr ? "Créer mon accès équipe" : "Create my team access"}
                {!isLoading && <ArrowRight aria-hidden="true" />}
              </Button>
            </form>
          </Form>
        </>
      ) : null}
    </AuthShell>
  );
}
