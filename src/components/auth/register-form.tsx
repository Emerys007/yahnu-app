"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Loader2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, type UserProfile } from "@/context/auth-context";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiClientError } from "@/lib/api-client";

type SchoolOption = {
  id: string;
  name: string;
};

type SchoolsResponse = {
  data: {
    schools: SchoolOption[];
  };
};

const industrySectors = [
  { value: "Agriculture", fr: "Agriculture et agro-industrie", en: "Agriculture and agribusiness" },
  { value: "Finance & Banking", fr: "Banque et services financiers", en: "Banking and financial services" },
  { value: "Information Technology", fr: "Numérique et technologies", en: "Digital and technology" },
  { value: "Telecommunications", fr: "Télécommunications", en: "Telecommunications" },
  { value: "Mining & Resources", fr: "Mines et ressources", en: "Mining and resources" },
  { value: "Construction & Real Estate", fr: "Construction et immobilier", en: "Construction and real estate" },
  { value: "Retail & Commerce", fr: "Commerce et distribution", en: "Retail and commerce" },
  { value: "Transportation & Logistics", fr: "Transport et logistique", en: "Transport and logistics" },
  { value: "Tourism & Hospitality", fr: "Tourisme et hôtellerie", en: "Tourism and hospitality" },
  { value: "Health & Pharmaceuticals", fr: "Santé et pharmacie", en: "Health and pharmaceuticals" },
  { value: "Education", fr: "Éducation et formation", en: "Education and training" },
  { value: "Energy", fr: "Énergie", en: "Energy" },
] as const;

function createRegisterSchema(language: "fr" | "en") {
  const fr = language === "fr";
  const baseSchema = z.object({
    role: z.enum(["graduate", "company", "school"]),
    email: z.string().trim().email({
      message: fr ? "Saisissez une adresse e-mail valide." : "Enter a valid email address.",
    }),
    password: z
      .string()
      .min(12, { message: fr ? "Utilisez au moins 12 caractères." : "Use at least 12 characters." })
      .max(128, { message: fr ? "Utilisez 128 caractères maximum." : "Use no more than 128 characters." })
      .regex(/[A-Za-z]/, {
        message: fr ? "Ajoutez au moins une lettre et un chiffre." : "Add at least one letter and one number.",
      })
      .regex(/\d/, {
        message: fr ? "Ajoutez au moins une lettre et un chiffre." : "Add at least one letter and one number.",
      }),
    confirmPassword: z.string(),
  });

  const graduateSchema = baseSchema.extend({
    role: z.literal("graduate"),
    firstName: z.string().trim().min(2, {
      message: fr ? "Indiquez un prénom d’au moins 2 caractères." : "Enter a first name with at least 2 characters.",
    }),
    lastName: z.string().trim().min(2, {
      message: fr ? "Indiquez un nom d’au moins 2 caractères." : "Enter a last name with at least 2 characters.",
    }),
    schoolId: z.string().min(1, {
      message: fr ? "Sélectionnez votre établissement." : "Select your school.",
    }),
    companyName: z.string().optional(),
    schoolName: z.string().optional(),
    contactName: z.string().optional(),
    industry: z.string().optional(),
  });

  const companySchema = baseSchema.extend({
    role: z.literal("company"),
    companyName: z.string().trim().min(2, {
      message: fr ? "Indiquez le nom de l’entreprise." : "Enter the company name.",
    }),
    contactName: z.string().trim().min(2, {
      message: fr ? "Indiquez le nom de la personne référente." : "Enter the contact person’s name.",
    }),
    industry: z.string().min(1, {
      message: fr ? "Sélectionnez un secteur d’activité." : "Select an industry sector.",
    }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    schoolName: z.string().optional(),
  });

  const schoolSchema = baseSchema.extend({
    role: z.literal("school"),
    schoolName: z.string().trim().min(2, {
      message: fr ? "Indiquez le nom de l’établissement." : "Enter the school name.",
    }),
    contactName: z.string().trim().min(2, {
      message: fr ? "Indiquez le nom de la personne référente." : "Enter the contact person’s name.",
    }),
    companyName: z.string().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    industry: z.string().optional(),
  });

  return z
    .discriminatedUnion("role", [graduateSchema, companySchema, schoolSchema])
    .refine((data) => data.password === data.confirmPassword, {
      message: fr ? "Les deux mots de passe ne correspondent pas." : "The two passwords do not match.",
      path: ["confirmPassword"],
    });
}

type RegisterValues = z.infer<ReturnType<typeof createRegisterSchema>>;

export function RegisterForm() {
  const { language } = useLocalization();
  const fr = language === "fr";
  const schema = React.useMemo(() => createRegisterSchema(language), [language]);
  const { signUp } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = React.useState(false);
  const [schoolsLoading, setSchoolsLoading] = React.useState(true);
  const [schools, setSchools] = React.useState<SchoolOption[]>([]);

  React.useEffect(() => {
    const controller = new AbortController();

    async function fetchSchools() {
      setSchoolsLoading(true);
      try {
        const response = await apiFetch<SchoolsResponse>("/api/schools", { signal: controller.signal });
        setSchools(response.data.schools);
      } catch (error) {
        if (controller.signal.aborted) return;
        console.error("Failed to fetch schools:", error);
        toast({
          title: fr ? "Établissements indisponibles" : "Schools unavailable",
          description: fr
            ? "La liste des établissements n’a pas pu être chargée. Vérifiez votre connexion puis réessayez."
            : "The school list could not be loaded. Check your connection and try again.",
          variant: "destructive",
        });
      } finally {
        if (!controller.signal.aborted) setSchoolsLoading(false);
      }
    }

    void fetchSchools();
    return () => controller.abort();
  }, [fr, toast]);

  const requestedRole = searchParams.get("role");
  const requestedType = searchParams.get("type");
  const defaultRole: RegisterValues["role"] =
    requestedRole === "school_administrator" || requestedType === "school"
      ? "school"
      : requestedRole === "company" || requestedType === "company"
        ? "company"
        : "graduate";

  const form = useForm<RegisterValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: defaultRole,
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      schoolId: "",
      companyName: "",
      schoolName: "",
      contactName: "",
      industry: "",
    },
  });

  const role = form.watch("role");

  async function onSubmit(values: RegisterValues) {
    setIsLoading(true);
    try {
      let profileData: Omit<UserProfile, "uid" | "status">;

      if (values.role === "graduate") {
        profileData = {
          name: `${values.firstName} ${values.lastName}`,
          firstName: values.firstName,
          lastName: values.lastName,
          schoolId: values.schoolId,
          email: values.email,
          role: values.role,
        };
      } else if (values.role === "company") {
        profileData = {
          name: values.companyName,
          companyName: values.companyName,
          contactName: values.contactName,
          industry: values.industry,
          email: values.email,
          role: values.role,
        };
      } else {
        profileData = {
          name: values.schoolName,
          schoolName: values.schoolName,
          contactName: values.contactName,
          email: values.email,
          role: values.role,
        };
      }

      const registration = await signUp(profileData, values.password);
      const approvalMessage =
        values.role === "graduate"
          ? fr
            ? "Votre établissement doit maintenant valider votre profil. Vous recevrez une notification dès son activation."
            : "Your school now needs to approve your profile. You’ll be notified as soon as it becomes active."
          : fr
            ? "L’équipe Yahnu doit maintenant valider votre organisation. Vous recevrez une notification dès son activation."
            : "The Yahnu team now needs to approve your organisation. You’ll be notified as soon as it becomes active.";

      toast({
        title: fr ? "Compte créé" : "Account created",
        description:
          registration.emailDelivery === "failed"
            ? fr
              ? "Le compte est créé, mais l’e-mail de vérification n’a pas pu être envoyé. Demandez un nouveau lien depuis la page de connexion."
              : "The account was created, but the verification email could not be sent. Request a new link from the sign-in page."
            : approvalMessage,
      });

      if (registration.debugUrl) {
        window.location.assign(registration.debugUrl);
        return;
      }
      router.push("/login");
    } catch (error: unknown) {
      const code = error instanceof ApiClientError ? error.code : "request_failed";
      const messages: Record<string, { fr: string; en: string }> = {
        weak_password: {
          fr: "Choisissez au moins 12 caractères avec une lettre et un chiffre.",
          en: "Choose at least 12 characters with a letter and a number.",
        },
        email_in_use: {
          fr: "Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.",
          en: "An account already exists with this address. Sign in or reset your password.",
        },
        school_required: {
          fr: "Sélectionnez votre établissement pour continuer.",
          en: "Select your school to continue.",
        },
        invalid_school: {
          fr: "Cet établissement n’est plus disponible dans la liste. Actualisez la page et choisissez-en un autre.",
          en: "This school is no longer available. Refresh the page and choose another one.",
        },
        company_details_required: {
          fr: "Renseignez le nom de l’entreprise, la personne référente et le secteur d’activité.",
          en: "Enter the company name, contact person and industry sector.",
        },
        school_details_required: {
          fr: "Renseignez le nom de l’établissement et la personne référente.",
          en: "Enter the school name and contact person.",
        },
        rate_limited: {
          fr: "Trop de tentatives ont été effectuées. Patientez avant de réessayer.",
          en: "Too many attempts were made. Wait before trying again.",
        },
      };
      const message = messages[code] ?? {
        fr: "Le compte n’a pas pu être créé. Vérifiez les informations saisies et votre connexion, puis réessayez.",
        en: "The account could not be created. Check your details and connection, then try again.",
      };

      toast({
        title: fr ? "Inscription non terminée" : "Registration not completed",
        description: message[language],
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <div className="text-left">
        <h1 className="font-headline text-3xl font-semibold tracking-[-0.04em]">
          {fr ? "Créer mon espace Yahnu" : "Create my Yahnu space"}
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {fr
            ? "Choisissez le profil qui correspond à votre rôle dans l’écosystème ivoirien."
            : "Choose the profile that matches your role in Côte d’Ivoire’s career ecosystem."}
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" aria-busy={isLoading} noValidate>
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{fr ? "Je représente" : "I am joining as"}</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={fr ? "Choisir un type de profil" : "Choose a profile type"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="graduate">{fr ? "Un jeune diplômé" : "A graduate"}</SelectItem>
                  <SelectItem value="company">{fr ? "Une entreprise" : "An employer"}</SelectItem>
                  <SelectItem value="school">{fr ? "Un établissement" : "A school"}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === "graduate" && (
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
        )}

        {role === "company" && (
          <>
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fr ? "Nom de l’entreprise" : "Company name"}</FormLabel>
                  <FormControl>
                    <Input placeholder={fr ? "Ex. N’Zassa Digital" : "e.g. N’Zassa Digital"} autoComplete="organization" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fr ? "Personne référente" : "Contact person"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Mariam Traoré" autoComplete="name" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "school" && (
          <>
            <FormField
              control={form.control}
              name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fr ? "Nom de l’établissement" : "School name"}</FormLabel>
                  <FormControl>
                    <Input placeholder={fr ? "Ex. Institut supérieur d’Abidjan" : "e.g. Abidjan Higher Institute"} autoComplete="organization" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{fr ? "Personne référente" : "Contact person"}</FormLabel>
                  <FormControl>
                    <Input placeholder="Koffi Yao" autoComplete="name" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === "graduate" && (
          <FormField
            control={form.control}
            name="schoolId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fr ? "École ou université" : "School or university"}</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value}
                  disabled={isLoading || schoolsLoading || schools.length === 0}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          schoolsLoading
                            ? fr
                              ? "Chargement des établissements…"
                              : "Loading schools…"
                            : fr
                              ? "Sélectionner mon établissement"
                              : "Select my school"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {schools.map((school) => (
                      <SelectItem key={school.id} value={school.id}>
                        {school.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!schoolsLoading && schools.length === 0 && (
                  <p className="text-xs leading-relaxed text-destructive" role="status">
                    {fr
                      ? "Aucun établissement n’est disponible pour le moment. Actualisez la page ou réessayez plus tard."
                      : "No school is available right now. Refresh the page or try again later."}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {role === "company" && (
          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{fr ? "Secteur d’activité" : "Industry sector"}</FormLabel>
                <Select onValueChange={field.onChange} value={field.value} disabled={isLoading}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={fr ? "Choisir un secteur" : "Choose a sector"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industrySectors.map((sector) => (
                      <SelectItem key={sector.value} value={sector.value}>
                        {sector[language]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

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
                  placeholder="awa.kone@exemple.ci"
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

        <p className="rounded-xl border border-primary/15 bg-primary/[0.06] p-3 text-xs leading-relaxed text-muted-foreground">
          {fr
            ? "Utilisez au moins 12 caractères avec une lettre et un chiffre. Le bouton étincelle peut générer une proposition forte."
            : "Use at least 12 characters with a letter and a number. The sparkle button can generate a strong suggestion."}
        </p>

        <Button
          type="submit"
          className="w-full"
          disabled={isLoading || (role === "graduate" && (schoolsLoading || schools.length === 0))}
        >
          {isLoading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          {isLoading ? (fr ? "Création du compte…" : "Creating account…") : fr ? "Créer mon espace" : "Create my space"}
        </Button>

        <p className="border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
          {fr ? "Vous avez déjà un compte ?" : "Already have an account?"}{" "}
          <Link href="/login" className="font-semibold text-primary underline-offset-4 hover:underline">
            {fr ? "Se connecter" : "Sign in"}
          </Link>
        </p>
      </form>
    </Form>
  );
}
