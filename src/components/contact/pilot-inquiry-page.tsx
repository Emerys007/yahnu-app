"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Clock3,
  Handshake,
  Loader2,
  Mail,
  MapPin,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { Footer } from "@/components/landing/footer";
import { MainNav } from "@/components/landing/main-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useLocalization } from "@/context/localization-context";
import { ApiClientError, apiFetch } from "@/lib/api-client";
import {
  pilotInquiryCountries,
  type PilotInquirySubmission,
} from "@/lib/pilot-inquiries";

type InquiryKind = PilotInquirySubmission["kind"];
type OrganizationType = PilotInquirySubmission["organizationType"];
type Timeline = PilotInquirySubmission["timeline"];
type InquirySource = PilotInquirySubmission["source"];

type FormState = {
  kind: InquiryKind;
  fullName: string;
  email: string;
  phone: string;
  organizationName: string;
  organizationType: OrganizationType;
  roleTitle: string;
  city: string;
  countryCode: string;
  participantEstimate: string;
  timeline: Timeline;
  message: string;
  consent: boolean;
  website: string;
};

type SuccessResponse = {
  data: {
    accepted: true;
    reference: string;
    receivedAt: string;
  };
};

const copy = {
  fr: {
    eyebrow: "Contact & pilote Yahnu",
    title: "Construisons une passerelle qui mène vraiment à l’emploi.",
    subtitle:
      "Institution, établissement, entreprise ou acteur de l’accompagnement : partagez votre contexte. Votre demande rejoint une file suivie par l’équipe Yahnu — sans compte à créer.",
    facts: [
      ["Une demande structurée", "Votre objectif, votre public et votre calendrier arrivent ensemble.", MessageSquareText],
      ["Un suivi mesurable", "Chaque demande reçoit une référence et un statut de traitement.", Clock3],
      ["Vos données restent utiles", "Nous ne vendons pas vos coordonnées. Le dossier expire après 18 mois, puis est purgé lors de la maintenance ou du prochain accès à la file.", ShieldCheck],
    ],
    emailLabel: "Une question courte ?",
    emailBody: "Vous pouvez aussi nous écrire directement.",
    formEyebrow: "Parlez-nous de votre projet",
    formTitle: "Préparer un premier échange utile",
    required: "Les champs marqués * sont obligatoires.",
    kind: "Votre priorité *",
    kinds: {
      pilot: "Lancer un pilote d’insertion",
      partnership: "Proposer un partenariat",
      employer: "Recruter ou publier des opportunités",
      school: "Accompagner des étudiants ou diplômés",
      product: "Découvrir la plateforme",
      other: "Autre demande",
    },
    fullName: "Nom et prénom *",
    email: "E-mail professionnel *",
    phone: "Téléphone / WhatsApp",
    organizationName: "Organisation *",
    organizationType: "Type d’organisation *",
    organizationTypes: {
      public_institution: "Institution publique / collectivité",
      university: "Université / école",
      company: "Entreprise",
      ngo: "ONG / association",
      funder: "Bailleur / fondation",
      community: "Structure d’accompagnement",
      other: "Autre",
    },
    roleTitle: "Fonction",
    city: "Ville",
    country: "Pays *",
    participants: "Public estimé",
    participantsHint: "Nombre de personnes concernées, si connu",
    timeline: "Horizon souhaité *",
    timelines: {
      now: "Dès que possible",
      three_months: "Dans les 3 prochains mois",
      six_months: "Dans les 6 prochains mois",
      exploring: "Je suis en phase d’exploration",
    },
    message: "Quel problème souhaitez-vous résoudre ? *",
    messageHint:
      "Décrivez le public concerné, l’objectif attendu et les contraintes importantes (30 caractères minimum).",
    consent:
      "J’autorise Yahnu à utiliser ces informations pour étudier ma demande et me recontacter. Je comprends que le dossier expire après 18 mois, puis est purgé lors de la maintenance ou du prochain accès à la file. *",
    privacyPrefix: "En savoir plus dans notre",
    privacyLink: "politique de confidentialité",
    submit: "Envoyer ma demande",
    submitPending: "Envoi sécurisé…",
    rateLimited: "Trop de demandes ont été envoyées récemment. Réessayez plus tard ou écrivez à contact@yahnu.org.",
    genericError: "La demande n’a pas pu être enregistrée. Vérifiez les champs puis réessayez.",
    successEyebrow: "Demande bien reçue",
    successTitle: "Merci — votre projet a maintenant une référence.",
    successBody:
      "L’équipe Yahnu peut désormais qualifier la demande sans perdre le contexte. Conservez cette référence si vous nous écrivez à propos du suivi.",
    reference: "Référence",
    another: "Envoyer une autre demande",
    home: "Retour à l’accueil",
    nextTitle: "Ce qui se passe ensuite",
    nextSteps: [
      "L’équipe vérifie le besoin et les informations partagées.",
      "La demande est qualifiée selon le public, le territoire et l’horizon.",
      "Si un échange est pertinent, Yahnu vous recontacte avec une prochaine étape claire.",
    ],
  },
  en: {
    eyebrow: "Contact & Yahnu pilot",
    title: "Let’s build a bridge that genuinely leads to work.",
    subtitle:
      "Institution, school, employer or support organisation: share your context. Your request enters a tracked Yahnu team queue — no account required.",
    facts: [
      ["A structured request", "Your objective, audience and timeline arrive together.", MessageSquareText],
      ["Measurable follow-up", "Every request receives a reference and a processing status.", Clock3],
      ["Your data stays purposeful", "We do not sell contact data. The record expires after 18 months, then is purged during maintenance or the next queue access.", ShieldCheck],
    ],
    emailLabel: "A quick question?",
    emailBody: "You can also email us directly.",
    formEyebrow: "Tell us about your project",
    formTitle: "Prepare a useful first conversation",
    required: "Fields marked * are required.",
    kind: "Your priority *",
    kinds: {
      pilot: "Launch an employability pilot",
      partnership: "Propose a partnership",
      employer: "Recruit or publish opportunities",
      school: "Support students or graduates",
      product: "Discover the platform",
      other: "Another request",
    },
    fullName: "Full name *",
    email: "Work email *",
    phone: "Phone / WhatsApp",
    organizationName: "Organisation *",
    organizationType: "Organisation type *",
    organizationTypes: {
      public_institution: "Public institution / local authority",
      university: "University / school",
      company: "Company",
      ngo: "NGO / association",
      funder: "Funder / foundation",
      community: "Support organisation",
      other: "Other",
    },
    roleTitle: "Role",
    city: "City",
    country: "Country *",
    participants: "Estimated audience",
    participantsHint: "Number of people concerned, if known",
    timeline: "Preferred timeline *",
    timelines: {
      now: "As soon as possible",
      three_months: "Within the next 3 months",
      six_months: "Within the next 6 months",
      exploring: "I am still exploring",
    },
    message: "What problem would you like to solve? *",
    messageHint:
      "Describe the audience, intended outcome and important constraints (30 characters minimum).",
    consent:
      "I authorise Yahnu to use this information to assess my request and contact me. I understand the record expires after 18 months, then is purged during maintenance or the next queue access. *",
    privacyPrefix: "Learn more in our",
    privacyLink: "privacy policy",
    submit: "Send my request",
    submitPending: "Sending securely…",
    rateLimited: "Too many requests were sent recently. Try again later or email contact@yahnu.org.",
    genericError: "The request could not be saved. Review the fields and try again.",
    successEyebrow: "Request received",
    successTitle: "Thank you — your project now has a reference.",
    successBody:
      "The Yahnu team can now qualify your request without losing its context. Keep this reference if you email us about follow-up.",
    reference: "Reference",
    another: "Send another request",
    home: "Back to home",
    nextTitle: "What happens next",
    nextSteps: [
      "The team checks the need and the information provided.",
      "The request is qualified by audience, territory and timeline.",
      "If a conversation is useful, Yahnu contacts you with a clear next step.",
    ],
  },
} as const;

const defaultForm = (kind: InquiryKind): FormState => ({
  kind,
  fullName: "",
  email: "",
  phone: "",
  organizationName: "",
  organizationType: "public_institution",
  roleTitle: "",
  city: "",
  countryCode: "CI",
  participantEstimate: "",
  timeline: "exploring",
  message: "",
  consent: false,
  website: "",
});

function inquiryKind(value?: string): InquiryKind {
  return value === "partnership" || value === "employer" || value === "school"
    || value === "product" || value === "other"
    ? value
    : "pilot";
}

export function PilotInquiryPage({
  intent,
  source = "contact",
  campaign,
}: {
  intent?: string;
  source?: InquirySource;
  campaign?: string;
}) {
  const { language } = useLocalization();
  const locale = language === "en" ? "en" : "fr";
  const text = copy[locale];
  const [form, setForm] = React.useState<FormState>(() => defaultForm(inquiryKind(intent)));
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState("");
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string[]>>({});
  const [success, setSuccess] = React.useState<SuccessResponse["data"] | null>(null);

  const update = <Key extends keyof FormState>(key: Key, value: FormState[Key]) => {
    setForm((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError("");
    setFieldErrors({});
    try {
      const payload = {
        ...form,
        phone: form.phone || undefined,
        roleTitle: form.roleTitle || undefined,
        city: form.city || undefined,
        participantEstimate: form.participantEstimate
          ? Number(form.participantEstimate)
          : undefined,
        locale,
        source,
        campaign: campaign || undefined,
      };
      const response = await apiFetch<SuccessResponse>("/api/pilot-inquiries", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSuccess(response.data);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (failure) {
      if (failure instanceof ApiClientError) {
        setFieldErrors(failure.fieldErrors ?? {});
        setError(failure.code === "rate_limited" ? text.rateLimited : text.genericError);
      } else {
        setError(text.genericError);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const fieldError = (field: string) => fieldErrors[field]?.[0];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative overflow-hidden border-b bg-ivory py-14 dark:bg-background sm:py-20">
          <div className="lagoon-grid absolute inset-0 opacity-35" aria-hidden="true" />
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-terra/12 blur-3xl" aria-hidden="true" />
          <div className="page-shell relative grid gap-8 lg:grid-cols-[1.15fr_0.85fr] lg:items-end">
            <div>
              <p className="section-kicker"><Sparkles className="h-4 w-4" aria-hidden="true" />{text.eyebrow}</p>
              <h1 className="display-title mt-5 max-w-4xl text-5xl sm:text-6xl lg:text-7xl">{text.title}</h1>
            </div>
            <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">{text.subtitle}</p>
          </div>
        </section>

        <section className="page-shell grid gap-8 py-12 sm:py-16 lg:grid-cols-[0.72fr_1.28fr] lg:items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="grid gap-3">
              {text.facts.map(([title, body, Icon]) => {
                const FactIcon = Icon as typeof ShieldCheck;
                return (
                  <Card key={title} className="border-border/70 bg-card/80">
                    <CardContent className="flex gap-4 p-5">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <FactIcon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="font-semibold">{title}</h2>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">{body}</p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card className="border-primary/20 bg-primary/[0.045]">
              <CardContent className="p-5">
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">{text.emailLabel}</p>
                <p className="mt-2 text-sm text-muted-foreground">{text.emailBody}</p>
                <a
                  href="mailto:contact@yahnu.org"
                  className="mt-4 inline-flex items-center gap-2 break-all font-semibold text-primary underline-offset-4 hover:underline"
                >
                  <Mail className="h-4 w-4 shrink-0" aria-hidden="true" />contact@yahnu.org
                </a>
              </CardContent>
            </Card>
          </aside>

          {success ? (
            <Card className="overflow-hidden border-primary/25 shadow-lift" aria-live="polite">
              <div className="h-2 bg-gradient-to-r from-terra via-primary to-lagoon" aria-hidden="true" />
              <CardContent className="p-6 sm:p-10">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
                </span>
                <p className="mt-8 text-xs font-bold uppercase tracking-[0.16em] text-primary">{text.successEyebrow}</p>
                <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl">{text.successTitle}</h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">{text.successBody}</p>

                <div className="mt-7 rounded-2xl border bg-muted/35 p-5">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">{text.reference}</p>
                  <p className="mt-2 break-all font-mono text-sm font-semibold sm:text-base">{success.reference}</p>
                </div>

                <div className="mt-8">
                  <h3 className="font-display text-xl font-semibold">{text.nextTitle}</h3>
                  <ol className="mt-4 space-y-3">
                    {text.nextSteps.map((step, index) => (
                      <li key={step} className="flex gap-3 text-sm leading-6 text-muted-foreground">
                        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">{index + 1}</span>
                        <span>{step}</span>
                      </li>
                    ))}
                  </ol>
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <Button onClick={() => {
                    setSuccess(null);
                    setForm(defaultForm(inquiryKind(intent)));
                  }}>{text.another}</Button>
                  <Button variant="outline" asChild><Link href="/">{text.home}</Link></Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-border/80 shadow-soft">
              <div className="h-2 bg-gradient-to-r from-terra via-primary to-lagoon" aria-hidden="true" />
              <CardHeader className="p-6 pb-3 sm:p-8 sm:pb-3">
                <Badge variant="outline" className="w-fit border-primary/25 bg-primary/5 text-primary">
                  <Handshake className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />{text.formEyebrow}
                </Badge>
                <CardTitle className="pt-3 font-display text-3xl sm:text-4xl">{text.formTitle}</CardTitle>
                <p className="text-sm text-muted-foreground">{text.required}</p>
              </CardHeader>
              <CardContent className="p-6 pt-4 sm:p-8 sm:pt-5">
                {error && (
                  <Alert variant="destructive" className="mb-6" role="alert">
                    <AlertTitle>{locale === "fr" ? "Envoi impossible" : "Unable to send"}</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <form onSubmit={submit} className="grid gap-5" noValidate>
                  <div className="grid gap-2">
                    <Label htmlFor="inquiry-kind">{text.kind}</Label>
                    <Select value={form.kind} onValueChange={(value: InquiryKind) => update("kind", value)}>
                      <SelectTrigger id="inquiry-kind" aria-invalid={Boolean(fieldError("kind"))}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(Object.keys(text.kinds) as InquiryKind[]).map((kind) => (
                          <SelectItem key={kind} value={kind}>{text.kinds[kind]}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-name">{text.fullName}</Label>
                      <Input
                        id="inquiry-name"
                        autoComplete="name"
                        value={form.fullName}
                        onChange={(event) => update("fullName", event.target.value)}
                        minLength={2}
                        maxLength={120}
                        required
                        aria-invalid={Boolean(fieldError("fullName"))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-email">{text.email}</Label>
                      <Input
                        id="inquiry-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        value={form.email}
                        onChange={(event) => update("email", event.target.value)}
                        maxLength={254}
                        required
                        aria-invalid={Boolean(fieldError("email"))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-phone">{text.phone}</Label>
                      <Input
                        id="inquiry-phone"
                        type="tel"
                        inputMode="tel"
                        autoComplete="tel"
                        placeholder="+225 07 00 00 00 00"
                        value={form.phone}
                        onChange={(event) => update("phone", event.target.value)}
                        maxLength={30}
                        aria-invalid={Boolean(fieldError("phone"))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-role">{text.roleTitle}</Label>
                      <Input
                        id="inquiry-role"
                        autoComplete="organization-title"
                        value={form.roleTitle}
                        onChange={(event) => update("roleTitle", event.target.value)}
                        maxLength={120}
                        aria-invalid={Boolean(fieldError("roleTitle"))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-organization">{text.organizationName}</Label>
                      <Input
                        id="inquiry-organization"
                        autoComplete="organization"
                        value={form.organizationName}
                        onChange={(event) => update("organizationName", event.target.value)}
                        minLength={2}
                        maxLength={180}
                        required
                        aria-invalid={Boolean(fieldError("organizationName"))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-organization-type">{text.organizationType}</Label>
                      <Select
                        value={form.organizationType}
                        onValueChange={(value: OrganizationType) => update("organizationType", value)}
                      >
                        <SelectTrigger id="inquiry-organization-type" aria-invalid={Boolean(fieldError("organizationType"))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(text.organizationTypes) as OrganizationType[]).map((type) => (
                            <SelectItem key={type} value={type}>{text.organizationTypes[type]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-country">{text.country}</Label>
                      <Select value={form.countryCode} onValueChange={(value) => update("countryCode", value)}>
                        <SelectTrigger id="inquiry-country" aria-invalid={Boolean(fieldError("countryCode"))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {pilotInquiryCountries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country[locale]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-city">{text.city}</Label>
                      <Input
                        id="inquiry-city"
                        autoComplete="address-level2"
                        placeholder={locale === "fr" ? "Abidjan, Bouaké, San-Pédro…" : "Abidjan, Bouaké, San-Pédro…"}
                        value={form.city}
                        onChange={(event) => update("city", event.target.value)}
                        maxLength={100}
                        aria-invalid={Boolean(fieldError("city"))}
                      />
                    </div>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-participants">{text.participants}</Label>
                      <Input
                        id="inquiry-participants"
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={1_000_000}
                        placeholder={text.participantsHint}
                        value={form.participantEstimate}
                        onChange={(event) => update("participantEstimate", event.target.value)}
                        aria-invalid={Boolean(fieldError("participantEstimate"))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="inquiry-timeline">{text.timeline}</Label>
                      <Select value={form.timeline} onValueChange={(value: Timeline) => update("timeline", value)}>
                        <SelectTrigger id="inquiry-timeline" aria-invalid={Boolean(fieldError("timeline"))}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(Object.keys(text.timelines) as Timeline[]).map((timeline) => (
                            <SelectItem key={timeline} value={timeline}>{text.timelines[timeline]}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="inquiry-message">{text.message}</Label>
                    <Textarea
                      id="inquiry-message"
                      value={form.message}
                      onChange={(event) => update("message", event.target.value)}
                      minLength={30}
                      maxLength={3000}
                      rows={6}
                      required
                      aria-invalid={Boolean(fieldError("message"))}
                      aria-describedby="inquiry-message-help"
                    />
                    <p id="inquiry-message-help" className="text-xs leading-5 text-muted-foreground">
                      {text.messageHint} · {form.message.length}/3000
                    </p>
                  </div>

                  <div className="flex gap-3 rounded-2xl border bg-muted/30 p-4">
                    <Checkbox
                      id="inquiry-consent"
                      checked={form.consent}
                      onCheckedChange={(checked) => update("consent", checked === true)}
                      required
                      aria-invalid={Boolean(fieldError("consent"))}
                      className="mt-0.5"
                    />
                    <div className="text-sm leading-6">
                      <Label htmlFor="inquiry-consent" className="font-normal">{text.consent}</Label>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {text.privacyPrefix}{" "}
                        <Link href="/privacy-policy" className="font-semibold text-primary underline underline-offset-4">
                          {text.privacyLink}
                        </Link>.
                      </p>
                    </div>
                  </div>

                  <div className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
                    <Label htmlFor="inquiry-website" aria-hidden="true">Website</Label>
                    <Input
                      id="inquiry-website"
                      name="website"
                      value={form.website}
                      onChange={(event) => update("website", event.target.value)}
                      tabIndex={-1}
                      autoComplete="off"
                      aria-hidden="true"
                    />
                  </div>

                  <Button type="submit" size="lg" variant="terra" className="mt-1 w-full sm:w-auto sm:justify-self-start" disabled={isSubmitting}>
                    {isSubmitting
                      ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />{text.submitPending}</>
                      : <>{text.submit}<ArrowRight className="ml-2 h-4 w-4" /></>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </section>

        <section className="border-t bg-muted/25 py-12">
          <div className="page-shell grid gap-4 sm:grid-cols-3">
            {[
              [Building2, locale === "fr" ? "Pensé pour le terrain" : "Designed for field reality", locale === "fr" ? "Abidjan, villes de l’intérieur et partenaires africains." : "Abidjan, inland cities and African partners."],
              [MapPin, locale === "fr" ? "Contexte local d’abord" : "Local context first", locale === "fr" ? "Public, filière, territoire et contraintes sont considérés ensemble." : "Audience, field, territory and constraints are considered together."],
              [CheckCircle2, locale === "fr" ? "Pas de promesse fictive" : "No fabricated promise", locale === "fr" ? "Une demande n’est pas une confirmation de partenariat." : "A request is not a partnership confirmation."],
            ].map(([Icon, title, body]) => {
              const TrustIcon = Icon as typeof Building2;
              return (
                <div key={title as string} className="rounded-2xl border bg-card p-5">
                  <TrustIcon className="h-5 w-5 text-primary" aria-hidden="true" />
                  <h2 className="mt-4 font-semibold">{title as string}</h2>
                  <p className="mt-1 text-sm leading-6 text-muted-foreground">{body as string}</p>
                </div>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
