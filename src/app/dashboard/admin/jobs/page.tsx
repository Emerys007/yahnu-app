"use client";

import * as React from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  MapPin,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useLocalization } from "@/context/localization-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { VerifiedMarketOpportunity } from "@/lib/ivory-coast-market";
import {
  isIsoCalendarDate,
  marketOpportunityCutoffDate,
  marketOpportunityIsCurrent,
} from "@/lib/market-opportunity-public";

type Locale = "fr" | "en";
type WorkMode = VerifiedMarketOpportunity["workMode"];

type OpportunityDraft = {
  slug: string;
  company: string;
  titleFr: string;
  titleEn: string;
  locationFr: string;
  locationEn: string;
  workMode: WorkMode;
  contractFr: string;
  contractEn: string;
  summaryFr: string;
  summaryEn: string;
  tags: string;
  publishedAt: string;
  deadlineAt: string;
  verifiedAt: string;
  expiresAt: string;
  sourceUrl: string;
};

type DraftErrors = Partial<Record<keyof OpportunityDraft, string>>;

type CatalogResponse = {
  data: {
    page: {
      id: string;
      data: {
        opportunities: VerifiedMarketOpportunity[];
      };
      updatedAt: string | null;
      managed?: boolean;
    };
  };
};

const copy = {
  fr: {
    kicker: "Pilotage éditorial",
    title: "Veille emploi & sources officielles",
    description:
      "Ajoutez, vérifiez et retirez les opportunités présentées au public. Chaque fiche conserve sa source employeur et sa fenêtre de fraîcheur.",
    add: "Ajouter une opportunité",
    total: "Catalogue",
    active: "Actives",
    attention: "À vérifier sous 7 jours",
    expired: "Expirées",
    nextExpiry: "Prochaine expiration",
    managed: "Catalogue administré",
    initial: "Catalogue initial — enregistrez une modification pour le prendre en charge",
    lastSaved: "Dernière mise à jour",
    neverSaved: "Pas encore enregistré dans le CMS",
    listTitle: "Opportunités suivies",
    search: "Rechercher une entreprise, un poste ou une ville",
    noMatch: "Aucune opportunité ne correspond à cette recherche.",
    emptyTitle: "Le catalogue est vide",
    emptyBody: "Ajoutez une première opportunité vérifiée pour alimenter la veille publique.",
    loading: "Chargement du catalogue protégé…",
    loadErrorTitle: "Le catalogue n’a pas pu être chargé",
    loadErrorBody: "Vérifiez votre connexion et vos droits, puis réessayez.",
    retry: "Réessayer",
    fresh: "À jour",
    expiring: "À vérifier",
    expiredStatus: "Expirée",
    verified: "Vérifiée",
    expires: "Masquée après le",
    source: "Source officielle",
    publicPage: "Fiche publique",
    edit: "Modifier",
    reverify: "Revérifier aujourd’hui",
    remove: "Supprimer",
    methodology: "Règle de publication",
    methodBody:
      "Une source HTTPS, un résumé original et une date de vérification sont obligatoires. Sans échéance officielle, une revérification prolonge l’affichage de quatorze jours.",
    impact: "Modifier les cibles d’impact",
    addTitle: "Ajouter une opportunité",
    editTitle: "Modifier l’opportunité",
    formDescription:
      "Les champs français et anglais alimentent la même fiche. Les dates utilisent le format du calendrier local.",
    identity: "Identification",
    translations: "Contenu bilingue",
    publishing: "Publication & vérification",
    french: "Français",
    english: "English",
    company: "Entreprise",
    slug: "Identifiant URL",
    slugHelp: "Lettres minuscules, chiffres et tirets uniquement.",
    workMode: "Mode de travail",
    onSite: "Présentiel",
    hybrid: "Hybride",
    remoteFlexible: "Télétravail flexible",
    titleLabel: "Intitulé du poste",
    location: "Lieu",
    contract: "Type de contrat",
    summary: "Résumé original Yahnu",
    tags: "Compétences / mots-clés",
    tagsHelp: "Séparez 1 à 10 éléments par des virgules.",
    publishedAt: "Date de publication (facultatif)",
    deadlineAt: "Date limite officielle (facultatif)",
    verifiedAt: "Dernière vérification",
    expiresAt: "Masquer après le",
    sourceUrl: "URL de la source officielle",
    cancel: "Annuler",
    save: "Enregistrer",
    saving: "Enregistrement…",
    required: "Ce champ est obligatoire.",
    invalidSlug: "Utilisez au moins 3 caractères : minuscules, chiffres et tirets.",
    duplicateSlug: "Cet identifiant URL est déjà utilisé.",
    tagsRequired: "Ajoutez au moins un mot-clé.",
    tagsTooMany: "Ajoutez dix mots-clés maximum.",
    tagTooLong: "Chaque mot-clé doit contenir 80 caractères maximum.",
    invalidUrl: "Utilisez une URL HTTPS valide.",
    invalidDate: "Choisissez une date valide.",
    expiryBeforeVerification: "L’expiration ne peut pas précéder la vérification.",
    deadlineBeforeVerification: "Une annonce ne peut pas être revérifiée après sa date limite officielle.",
    expiryAfterDeadline: "Masquez l’annonce au plus tard à sa date limite officielle.",
    expiryTooLong: "Sans date limite, la durée d’affichage est limitée à quatorze jours après vérification.",
    publishedAfterExpiry: "La publication ne peut pas être postérieure à l’expiration.",
    validationTitle: "Certains champs sont à corriger",
    validationBody: "Consultez les indications affichées dans le formulaire.",
    savedTitle: "Catalogue mis à jour",
    addedBody: "L’opportunité est maintenant disponible dans la veille.",
    editedBody: "Les modifications ont été enregistrées.",
    reverifiedBody: "La date de contrôle et la fenêtre d’affichage ont été actualisées.",
    deletedBody: "L’opportunité a été retirée du catalogue.",
    saveErrorTitle: "Enregistrement impossible",
    saveErrorBody: "Le catalogue n’a pas pu être enregistré. Réessayez.",
    conflictBody: "Un autre éditeur a modifié le catalogue. Actualisez la page avant de recommencer.",
    pastDeadlineTitle: "Échéance déjà dépassée",
    pastDeadlineBody: "Modifiez ou retirez la date limite avant de revérifier cette annonce.",
    deleteTitle: "Retirer cette opportunité ?",
    deleteBody: "La fiche disparaîtra de la veille publique après confirmation.",
    confirmDelete: "Oui, supprimer",
  },
  en: {
    kicker: "Editorial operations",
    title: "Job watch & official sources",
    description:
      "Add, verify and retire opportunities shown publicly. Every listing retains its employer source and freshness window.",
    add: "Add an opportunity",
    total: "Catalog",
    active: "Active",
    attention: "Due for review in 7 days",
    expired: "Expired",
    nextExpiry: "Next expiry",
    managed: "Managed catalog",
    initial: "Initial catalog — save a change to take ownership",
    lastSaved: "Last updated",
    neverSaved: "Not yet saved in the CMS",
    listTitle: "Tracked opportunities",
    search: "Search by employer, role or location",
    noMatch: "No opportunities match this search.",
    emptyTitle: "The catalog is empty",
    emptyBody: "Add the first verified opportunity to populate the public job watch.",
    loading: "Loading the protected catalog…",
    loadErrorTitle: "The catalog could not be loaded",
    loadErrorBody: "Check your connection and permissions, then try again.",
    retry: "Try again",
    fresh: "Current",
    expiring: "Review soon",
    expiredStatus: "Expired",
    verified: "Verified",
    expires: "Hidden after",
    source: "Official source",
    publicPage: "Public listing",
    edit: "Edit",
    reverify: "Reverify today",
    remove: "Delete",
    methodology: "Publishing rule",
    methodBody:
      "An HTTPS source, original summary and verification date are required. Without an official deadline, reverification extends visibility by fourteen days.",
    impact: "Edit impact targets",
    addTitle: "Add an opportunity",
    editTitle: "Edit opportunity",
    formDescription:
      "French and English fields feed the same listing. Dates use the local calendar format.",
    identity: "Identification",
    translations: "Bilingual content",
    publishing: "Publishing & verification",
    french: "Français",
    english: "English",
    company: "Employer",
    slug: "URL identifier",
    slugHelp: "Lowercase letters, numbers and hyphens only.",
    workMode: "Work mode",
    onSite: "On-site",
    hybrid: "Hybrid",
    remoteFlexible: "Remote-flexible",
    titleLabel: "Role title",
    location: "Location",
    contract: "Contract type",
    summary: "Original Yahnu summary",
    tags: "Skills / keywords",
    tagsHelp: "Separate 1 to 10 items with commas.",
    publishedAt: "Published date (optional)",
    deadlineAt: "Official deadline (optional)",
    verifiedAt: "Last verified",
    expiresAt: "Hide after",
    sourceUrl: "Official source URL",
    cancel: "Cancel",
    save: "Save",
    saving: "Saving…",
    required: "This field is required.",
    invalidSlug: "Use at least 3 characters: lowercase letters, numbers and hyphens.",
    duplicateSlug: "This URL identifier is already in use.",
    tagsRequired: "Add at least one keyword.",
    tagsTooMany: "Add no more than ten keywords.",
    tagTooLong: "Each keyword must contain no more than 80 characters.",
    invalidUrl: "Use a valid HTTPS URL.",
    invalidDate: "Choose a valid date.",
    expiryBeforeVerification: "Expiry cannot precede verification.",
    deadlineBeforeVerification: "A listing cannot be reverified after its official deadline.",
    expiryAfterDeadline: "Hide the listing no later than its official deadline.",
    expiryTooLong: "Without a deadline, visibility is limited to fourteen days after verification.",
    publishedAfterExpiry: "Publication cannot follow expiry.",
    validationTitle: "Some fields need attention",
    validationBody: "Review the guidance shown in the form.",
    savedTitle: "Catalog updated",
    addedBody: "The opportunity is now available in the job watch.",
    editedBody: "Your changes have been saved.",
    reverifiedBody: "The review date and visibility window have been refreshed.",
    deletedBody: "The opportunity was removed from the catalog.",
    saveErrorTitle: "Unable to save",
    saveErrorBody: "The catalog could not be saved. Try again.",
    conflictBody: "Another editor changed the catalog. Refresh the page before trying again.",
    pastDeadlineTitle: "Deadline has passed",
    pastDeadlineBody: "Edit or remove the deadline before reverifying this listing.",
    deleteTitle: "Remove this opportunity?",
    deleteBody: "The listing will disappear from the public job watch after confirmation.",
    confirmDelete: "Yes, delete",
  },
} as const;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function addDays(value: string, days: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyDraft(): OpportunityDraft {
  const verifiedAt = todayIso();
  return {
    slug: "",
    company: "",
    titleFr: "",
    titleEn: "",
    locationFr: "",
    locationEn: "",
    workMode: "on-site",
    contractFr: "",
    contractEn: "",
    summaryFr: "",
    summaryEn: "",
    tags: "",
    publishedAt: "",
    deadlineAt: "",
    verifiedAt,
    expiresAt: addDays(verifiedAt, 14),
    sourceUrl: "",
  };
}

function toDraft(opportunity: VerifiedMarketOpportunity): OpportunityDraft {
  return {
    slug: opportunity.slug,
    company: opportunity.company,
    titleFr: opportunity.title.fr,
    titleEn: opportunity.title.en,
    locationFr: opportunity.location.fr,
    locationEn: opportunity.location.en,
    workMode: opportunity.workMode,
    contractFr: opportunity.contract.fr,
    contractEn: opportunity.contract.en,
    summaryFr: opportunity.summary.fr,
    summaryEn: opportunity.summary.en,
    tags: opportunity.tags.join(", "),
    publishedAt: opportunity.publishedAt ?? "",
    deadlineAt: opportunity.deadlineAt ?? "",
    verifiedAt: opportunity.verifiedAt,
    expiresAt: opportunity.expiresAt,
    sourceUrl: opportunity.sourceUrl,
  };
}

function parseTags(value: string) {
  return Array.from(
    new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean)),
  );
}

function fromDraft(draft: OpportunityDraft): VerifiedMarketOpportunity {
  return {
    slug: draft.slug.trim(),
    company: draft.company.trim(),
    title: { fr: draft.titleFr.trim(), en: draft.titleEn.trim() },
    location: { fr: draft.locationFr.trim(), en: draft.locationEn.trim() },
    workMode: draft.workMode,
    contract: { fr: draft.contractFr.trim(), en: draft.contractEn.trim() },
    summary: { fr: draft.summaryFr.trim(), en: draft.summaryEn.trim() },
    tags: parseTags(draft.tags),
    ...(draft.publishedAt ? { publishedAt: draft.publishedAt } : {}),
    ...(draft.deadlineAt ? { deadlineAt: draft.deadlineAt } : {}),
    verifiedAt: draft.verifiedAt,
    expiresAt: draft.expiresAt,
    sourceUrl: draft.sourceUrl.trim(),
  };
}

function dateIsValid(value: string) {
  return isIsoCalendarDate(value);
}

function validateDraft(
  draft: OpportunityDraft,
  opportunities: VerifiedMarketOpportunity[],
  originalSlug: string | null,
  text: typeof copy[Locale],
) {
  const errors: DraftErrors = {};
  const required: (keyof OpportunityDraft)[] = [
    "slug",
    "company",
    "titleFr",
    "titleEn",
    "locationFr",
    "locationEn",
    "contractFr",
    "contractEn",
    "summaryFr",
    "summaryEn",
    "verifiedAt",
    "expiresAt",
    "sourceUrl",
  ];

  for (const field of required) {
    if (!String(draft[field]).trim()) errors[field] = text.required;
  }

  if (draft.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(draft.slug.trim())) {
    errors.slug = text.invalidSlug;
  }
  if (
    draft.slug.trim() !== originalSlug
    && opportunities.some((opportunity) => opportunity.slug === draft.slug.trim())
  ) {
    errors.slug = text.duplicateSlug;
  }

  const tags = parseTags(draft.tags);
  if (!tags.length) errors.tags = text.tagsRequired;
  else if (tags.length > 10) errors.tags = text.tagsTooMany;
  else if (tags.some((tag) => tag.length > 80)) errors.tags = text.tagTooLong;

  try {
    const source = new URL(draft.sourceUrl);
    if (source.protocol !== "https:") errors.sourceUrl = text.invalidUrl;
  } catch {
    if (draft.sourceUrl) errors.sourceUrl = text.invalidUrl;
  }

  for (const field of ["publishedAt", "deadlineAt", "verifiedAt", "expiresAt"] as const) {
    if (draft[field] && !dateIsValid(draft[field])) errors[field] = text.invalidDate;
  }
  if (
    dateIsValid(draft.verifiedAt)
    && dateIsValid(draft.expiresAt)
    && draft.expiresAt < draft.verifiedAt
  ) {
    errors.expiresAt = text.expiryBeforeVerification;
  }
  if (
    draft.deadlineAt
    && dateIsValid(draft.deadlineAt)
    && dateIsValid(draft.verifiedAt)
    && draft.deadlineAt < draft.verifiedAt
  ) {
    errors.deadlineAt = text.deadlineBeforeVerification;
  }
  if (
    draft.deadlineAt
    && dateIsValid(draft.deadlineAt)
    && dateIsValid(draft.expiresAt)
    && draft.expiresAt > draft.deadlineAt
  ) {
    errors.expiresAt = text.expiryAfterDeadline;
  }
  if (
    !draft.deadlineAt
    && dateIsValid(draft.verifiedAt)
    && dateIsValid(draft.expiresAt)
    && draft.expiresAt > addDays(draft.verifiedAt, 14)
  ) {
    errors.expiresAt = text.expiryTooLong;
  }
  if (
    draft.publishedAt
    && dateIsValid(draft.publishedAt)
    && dateIsValid(draft.expiresAt)
    && draft.publishedAt > draft.expiresAt
  ) {
    errors.publishedAt = text.publishedAfterExpiry;
  }

  return errors;
}

function formatDate(value: string, locale: Locale) {
  if (!dateIsValid(value)) return value;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-CI", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

function formatTimestamp(value: string | null, locale: Locale) {
  if (!value) return null;
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return null;
  return new Intl.DateTimeFormat(locale === "fr" ? "fr-CI" : "en-CI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date);
}

function daysUntil(value: string) {
  const today = new Date(`${todayIso()}T12:00:00Z`).getTime();
  const target = new Date(`${value}T12:00:00Z`).getTime();
  return Math.ceil((target - today) / 86_400_000);
}

function getFreshness(opportunity: VerifiedMarketOpportunity) {
  const cutoff = marketOpportunityCutoffDate(opportunity);
  const remaining = cutoff ? daysUntil(cutoff) : -1;
  if (!marketOpportunityIsCurrent(opportunity)) return "expired" as const;
  if (remaining <= 7) return "expiring" as const;
  return "fresh" as const;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return <p id={id} className="text-xs font-medium text-destructive">{message}</p>;
}

function BilingualFields({
  locale,
  draft,
  errors,
  update,
  text,
}: {
  locale: Locale;
  draft: OpportunityDraft;
  errors: DraftErrors;
  update: <Key extends keyof OpportunityDraft>(field: Key, value: OpportunityDraft[Key]) => void;
  text: typeof copy[Locale];
}) {
  const suffix = locale === "fr" ? "Fr" : "En";
  const titleField = `title${suffix}` as "titleFr" | "titleEn";
  const locationField = `location${suffix}` as "locationFr" | "locationEn";
  const contractField = `contract${suffix}` as "contractFr" | "contractEn";
  const summaryField = `summary${suffix}` as "summaryFr" | "summaryEn";

  return (
    <div className="grid gap-5 pt-5 md:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor={`opportunity-title-${locale}`}>{text.titleLabel}</Label>
        <Input
          id={`opportunity-title-${locale}`}
          value={draft[titleField]}
          onChange={(event) => update(titleField, event.target.value)}
          required
          maxLength={2_000}
          aria-invalid={Boolean(errors[titleField])}
          aria-describedby={errors[titleField] ? `error-${titleField}` : undefined}
        />
        <FieldError id={`error-${titleField}`} message={errors[titleField]} />
      </div>
      <div className="space-y-2">
        <Label htmlFor={`opportunity-location-${locale}`}>{text.location}</Label>
        <Input
          id={`opportunity-location-${locale}`}
          value={draft[locationField]}
          onChange={(event) => update(locationField, event.target.value)}
          required
          maxLength={2_000}
          aria-invalid={Boolean(errors[locationField])}
          aria-describedby={errors[locationField] ? `error-${locationField}` : undefined}
        />
        <FieldError id={`error-${locationField}`} message={errors[locationField]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`opportunity-contract-${locale}`}>{text.contract}</Label>
        <Input
          id={`opportunity-contract-${locale}`}
          value={draft[contractField]}
          onChange={(event) => update(contractField, event.target.value)}
          required
          maxLength={2_000}
          aria-invalid={Boolean(errors[contractField])}
          aria-describedby={errors[contractField] ? `error-${contractField}` : undefined}
        />
        <FieldError id={`error-${contractField}`} message={errors[contractField]} />
      </div>
      <div className="space-y-2 md:col-span-2">
        <Label htmlFor={`opportunity-summary-${locale}`}>{text.summary}</Label>
        <Textarea
          id={`opportunity-summary-${locale}`}
          value={draft[summaryField]}
          onChange={(event) => update(summaryField, event.target.value)}
          required
          maxLength={2_000}
          rows={4}
          aria-invalid={Boolean(errors[summaryField])}
          aria-describedby={errors[summaryField] ? `error-${summaryField}` : undefined}
        />
        <FieldError id={`error-${summaryField}`} message={errors[summaryField]} />
      </div>
    </div>
  );
}

export default function AdminJobsPage() {
  const { language } = useLocalization();
  const locale: Locale = language === "en" ? "en" : "fr";
  const text = copy[locale];
  const { toast } = useToast();
  const [opportunities, setOpportunities] = React.useState<VerifiedMarketOpportunity[]>([]);
  const [updatedAt, setUpdatedAt] = React.useState<string | null>(null);
  const [managed, setManaged] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [loadError, setLoadError] = React.useState(false);
  const [savingAction, setSavingAction] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<OpportunityDraft>(emptyDraft);
  const [draftErrors, setDraftErrors] = React.useState<DraftErrors>({});
  const [formError, setFormError] = React.useState("");
  const [formLocale, setFormLocale] = React.useState<Locale>(locale);
  const [originalSlug, setOriginalSlug] = React.useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = React.useState<VerifiedMarketOpportunity | null>(null);

  const loadCatalog = React.useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    try {
      const response = await apiFetch<CatalogResponse>("/api/pages/market-opportunities");
      setOpportunities(response.data.page.data.opportunities);
      setUpdatedAt(response.data.page.updatedAt);
      setManaged(Boolean(response.data.page.managed));
    } catch {
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadCatalog();
  }, [loadCatalog]);

  const freshness = React.useMemo(() => {
    const active = opportunities.filter((item) => getFreshness(item) !== "expired");
    const expiring = opportunities.filter((item) => getFreshness(item) === "expiring");
    const expired = opportunities.filter((item) => getFreshness(item) === "expired");
    const nextExpiry = active
      .map((item) => marketOpportunityCutoffDate(item))
      .filter((value): value is string => Boolean(value))
      .sort()[0] ?? null;
    return { active, expiring, expired, nextExpiry };
  }, [opportunities]);

  const visibleOpportunities = React.useMemo(() => {
    const query = search.trim().toLocaleLowerCase(locale === "fr" ? "fr-CI" : "en");
    return [...opportunities]
      .filter((item) => {
        if (!query) return true;
        return [
          item.company,
          item.title.fr,
          item.title.en,
          item.location.fr,
          item.location.en,
          ...item.tags,
        ].some((value) => value.toLocaleLowerCase().includes(query));
      })
      .sort((left, right) => {
        const leftCutoff = marketOpportunityCutoffDate(left) ?? left.expiresAt;
        const rightCutoff = marketOpportunityCutoffDate(right) ?? right.expiresAt;
        const statusDifference = daysUntil(rightCutoff) - daysUntil(leftCutoff);
        return statusDifference || left.company.localeCompare(right.company);
      });
  }, [locale, opportunities, search]);

  const updateDraft = React.useCallback(
    <Key extends keyof OpportunityDraft>(field: Key, value: OpportunityDraft[Key]) => {
      setDraft((current) => ({ ...current, [field]: value }));
      setDraftErrors((current) => {
        if (!current[field]) return current;
        const next = { ...current };
        delete next[field];
        return next;
      });
      setFormError("");
    },
    [],
  );

  function openAddDialog() {
    setDraft(emptyDraft());
    setOriginalSlug(null);
    setDraftErrors({});
    setFormError("");
    setFormLocale(locale);
    setDialogOpen(true);
  }

  function openEditDialog(opportunity: VerifiedMarketOpportunity) {
    setDraft(toDraft(opportunity));
    setOriginalSlug(opportunity.slug);
    setDraftErrors({});
    setFormError("");
    setFormLocale(locale);
    setDialogOpen(true);
  }

  async function persistCatalog(
    next: VerifiedMarketOpportunity[],
    actionKey: string,
    successBody: string,
  ) {
    setSavingAction(actionKey);
    try {
      const response = await apiFetch<CatalogResponse>("/api/pages/market-opportunities", {
        method: "PUT",
        body: JSON.stringify({
          data: { opportunities: next },
          expectedUpdatedAt: updatedAt,
        }),
      });
      setOpportunities(response.data.page.data.opportunities);
      setUpdatedAt(response.data.page.updatedAt);
      setManaged(true);
      toast({ title: text.savedTitle, description: successBody });
      return true;
    } catch (error) {
      const message = error instanceof ApiClientError && error.code === "page_conflict"
        ? text.conflictBody
        : error instanceof ApiClientError && error.message
          ? error.message
          : text.saveErrorBody;
      setFormError(message);
      toast({
        title: text.saveErrorTitle,
        description: message,
        variant: "destructive",
      });
      return false;
    } finally {
      setSavingAction(null);
    }
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const errors = validateDraft(draft, opportunities, originalSlug, text);
    if (Object.keys(errors).length) {
      setDraftErrors(errors);
      const errorFields = new Set(Object.keys(errors));
      if (["titleFr", "locationFr", "contractFr", "summaryFr"].some((field) => errorFields.has(field))) {
        setFormLocale("fr");
      } else if (["titleEn", "locationEn", "contractEn", "summaryEn"].some((field) => errorFields.has(field))) {
        setFormLocale("en");
      }
      toast({
        title: text.validationTitle,
        description: text.validationBody,
        variant: "destructive",
      });
      return;
    }

    const opportunity = fromDraft(draft);
    const next = originalSlug
      ? opportunities.map((item) => item.slug === originalSlug ? opportunity : item)
      : [...opportunities, opportunity];
    const succeeded = await persistCatalog(
      next,
      "form",
      originalSlug ? text.editedBody : text.addedBody,
    );
    if (succeeded) setDialogOpen(false);
  }

  async function handleReverify(opportunity: VerifiedMarketOpportunity) {
    const today = todayIso();
    if (opportunity.deadlineAt && opportunity.deadlineAt < today) {
      toast({
        title: text.pastDeadlineTitle,
        description: text.pastDeadlineBody,
        variant: "destructive",
      });
      return;
    }
    const updated: VerifiedMarketOpportunity = {
      ...opportunity,
      verifiedAt: today,
      expiresAt: opportunity.deadlineAt ?? addDays(today, 14),
    };
    await persistCatalog(
      opportunities.map((item) => item.slug === opportunity.slug ? updated : item),
      `reverify:${opportunity.slug}`,
      text.reverifiedBody,
    );
  }

  async function handleDelete() {
    if (!deleteCandidate) return;
    const slug = deleteCandidate.slug;
    const succeeded = await persistCatalog(
      opportunities.filter((item) => item.slug !== slug),
      `delete:${slug}`,
      text.deletedBody,
    );
    if (succeeded) setDeleteCandidate(null);
  }

  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center" role="status" aria-live="polite">
        <div className="text-center">
          <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary motion-reduce:animate-none" aria-hidden="true" />
          <p className="mt-4 text-sm text-muted-foreground">{text.loading}</p>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <Card className="mx-auto max-w-2xl border-destructive/25">
        <CardContent className="px-5 py-12 text-center sm:p-12">
          <AlertTriangle className="mx-auto h-10 w-10 text-destructive" aria-hidden="true" />
          <h1 className="mt-5 font-headline text-2xl font-semibold">{text.loadErrorTitle}</h1>
          <p className="mx-auto mt-3 max-w-lg leading-7 text-muted-foreground">{text.loadErrorBody}</p>
          <Button type="button" className="mt-6 min-h-11" onClick={() => void loadCatalog()}>
            <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
            {text.retry}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative isolate overflow-hidden rounded-[1.5rem] bg-[hsl(var(--sidebar-background))] px-5 py-7 text-white shadow-soft sm:px-8 sm:py-9">
        <div className="ci-pattern absolute inset-0 -z-20 opacity-25" aria-hidden="true" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 rounded-full bg-terra/20 blur-3xl" aria-hidden="true" />
        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.15em] text-white/75">
              <ShieldCheck className="h-4 w-4 text-terra" aria-hidden="true" />
              {text.kicker}
            </p>
            <h1 className="mt-5 max-w-4xl font-headline text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-5xl">{text.title}</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-white/70 sm:text-base">{text.description}</p>
          </div>
          <Button type="button" variant="terra" size="lg" className="min-h-12 w-full shrink-0 sm:w-auto" onClick={openAddDialog}>
            <Plus className="mr-2 h-5 w-5" aria-hidden="true" />
            {text.add}
          </Button>
        </div>
      </section>

      <div className="flex flex-col gap-2 rounded-2xl border bg-card px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 font-medium">
          <span className={`h-2.5 w-2.5 rounded-full ${managed ? "bg-primary" : "bg-terra"}`} aria-hidden="true" />
          {managed ? text.managed : text.initial}
        </p>
        <p className="text-muted-foreground">
          {text.lastSaved}: {formatTimestamp(updatedAt, locale) ?? text.neverSaved}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" aria-label={text.kicker}>
        {[
          [text.total, String(opportunities.length), BriefcaseBusiness, "bg-primary/10 text-primary"],
          [text.active, String(freshness.active.length), CheckCircle2, "bg-lagoon/10 text-lagoon"],
          [text.attention, String(freshness.expiring.length), Clock3, "bg-terra/10 text-terra"],
          [text.expired, String(freshness.expired.length), AlertTriangle, "bg-destructive/10 text-destructive"],
          [
            text.nextExpiry,
            freshness.nextExpiry ? formatDate(freshness.nextExpiry, locale) : "—",
            CalendarClock,
            "bg-primary/10 text-primary",
          ],
        ].map(([label, value, Icon, iconClass]) => {
          const MetricIcon = Icon as typeof BriefcaseBusiness;
          return (
            <Card key={label as string}>
              <CardContent className="flex items-start justify-between gap-4 p-5">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{label as string}</p>
                  <p className="mt-3 font-headline text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{value as string}</p>
                </div>
                <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${iconClass as string}`}>
                  <MetricIcon className="h-5 w-5" aria-hidden="true" />
                </span>
              </CardContent>
            </Card>
          );
        })}
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(18rem,0.55fr)]">
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-4 border-b bg-muted/20 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <h2 className="font-headline text-2xl font-semibold">{text.listTitle}</h2>
            <label className="relative block w-full sm:max-w-sm">
              <span className="sr-only">{text.search}</span>
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder={text.search}
                className="min-h-11 pl-10"
              />
            </label>
          </div>

          {!opportunities.length ? (
            <div className="px-5 py-14 text-center">
              <BriefcaseBusiness className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h3 className="mt-4 font-headline text-2xl font-semibold">{text.emptyTitle}</h3>
              <p className="mx-auto mt-2 max-w-lg leading-7 text-muted-foreground">{text.emptyBody}</p>
              <Button type="button" className="mt-6 min-h-11" onClick={openAddDialog}>
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                {text.add}
              </Button>
            </div>
          ) : !visibleOpportunities.length ? (
            <p className="px-5 py-14 text-center text-muted-foreground">{text.noMatch}</p>
          ) : (
            <ul className="divide-y">
              {visibleOpportunities.map((opportunity) => {
                const status = getFreshness(opportunity);
                const reverifyBusy = savingAction === `reverify:${opportunity.slug}`;
                return (
                  <li key={opportunity.slug} className="p-4 sm:p-5">
                    <article className="flex flex-col gap-5 lg:flex-row lg:items-start">
                      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <BriefcaseBusiness className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase tracking-[0.12em] text-terra">{opportunity.company}</p>
                            <h3 className="mt-1 font-headline text-xl font-semibold">{opportunity.title[locale]}</h3>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              status === "expired"
                                ? "w-fit border-destructive/25 bg-destructive/[0.06] text-destructive"
                                : status === "expiring"
                                  ? "w-fit border-terra/25 bg-terra/[0.06] text-terra"
                                  : "w-fit border-primary/20 bg-primary/[0.055] text-primary"
                            }
                          >
                            {status === "expired" ? text.expiredStatus : status === "expiring" ? text.expiring : text.fresh}
                          </Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                            {opportunity.location[locale]}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                            {text.verified} {formatDate(opportunity.verifiedAt, locale)}
                          </span>
                          <span className="inline-flex items-center gap-1.5">
                            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                            {text.expires} {formatDate(opportunity.expiresAt, locale)}
                          </span>
                        </div>
                        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                          <Button asChild variant="outline" size="sm" className="min-h-10">
                            <a href={opportunity.sourceUrl} target="_blank" rel="noopener noreferrer">
                              {text.source}
                              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </a>
                          </Button>
                          <Button asChild variant="ghost" size="sm" className="min-h-10">
                            <Link href={`/opportunities/${opportunity.slug}`} target="_blank">
                              {text.publicPage}
                              <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                            </Link>
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="min-h-10" onClick={() => openEditDialog(opportunity)} disabled={Boolean(savingAction)}>
                            <Edit3 className="mr-2 h-4 w-4" aria-hidden="true" />
                            {text.edit}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="min-h-10" onClick={() => void handleReverify(opportunity)} disabled={Boolean(savingAction)}>
                            {reverifyBusy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />}
                            {text.reverify}
                          </Button>
                          <Button type="button" variant="ghost" size="sm" className="min-h-10 text-destructive hover:text-destructive" onClick={() => setDeleteCandidate(opportunity)} disabled={Boolean(savingAction)}>
                            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
                            {text.remove}
                          </Button>
                        </div>
                      </div>
                    </article>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <div className="space-y-4">
          <Card className="border-primary/20 bg-primary/[0.045]">
            <CardContent className="p-5 sm:p-6">
              <ShieldCheck className="h-7 w-7 text-primary" aria-hidden="true" />
              <h2 className="mt-7 font-headline text-2xl font-semibold">{text.methodology}</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">{text.methodBody}</p>
            </CardContent>
          </Card>
          <Button asChild variant="outline" className="h-auto min-h-12 w-full whitespace-normal py-3">
            <Link href="/dashboard/content/static-pages">{text.impact}</Link>
          </Button>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={(open) => {
        if (!savingAction) setDialogOpen(open);
      }}>
        <DialogContent className="flex max-h-[92vh] w-[calc(100vw-1rem)] max-w-4xl flex-col gap-0 overflow-hidden p-0 sm:w-full">
          <form onSubmit={handleSave} className="flex min-h-0 flex-1 flex-col">
            <DialogHeader className="border-b px-5 py-5 pr-12 sm:px-7">
              <DialogTitle className="font-headline text-2xl">{originalSlug ? text.editTitle : text.addTitle}</DialogTitle>
              <DialogDescription>{text.formDescription}</DialogDescription>
            </DialogHeader>

            <div className="min-h-0 flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-7">
              {formError ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/[0.055] p-4 text-sm text-destructive" role="alert">
                  {formError}
                </div>
              ) : null}

              <section className="space-y-4" aria-labelledby="opportunity-identity-title">
                <h3 id="opportunity-identity-title" className="font-headline text-xl font-semibold">{text.identity}</h3>
                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="opportunity-company">{text.company}</Label>
                    <Input
                      id="opportunity-company"
                      value={draft.company}
                      onChange={(event) => updateDraft("company", event.target.value)}
                      required
                      maxLength={200}
                      autoFocus
                      aria-invalid={Boolean(draftErrors.company)}
                      aria-describedby={draftErrors.company ? "error-company" : undefined}
                    />
                    <FieldError id="error-company" message={draftErrors.company} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="opportunity-slug">{text.slug}</Label>
                    <Input
                      id="opportunity-slug"
                      value={draft.slug}
                      onChange={(event) => updateDraft("slug", event.target.value.toLowerCase().replace(/\s+/g, "-"))}
                      required
                      minLength={3}
                      maxLength={160}
                      pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
                      aria-invalid={Boolean(draftErrors.slug)}
                      aria-describedby={`opportunity-slug-help${draftErrors.slug ? " error-slug" : ""}`}
                    />
                    <p id="opportunity-slug-help" className="text-xs text-muted-foreground">{text.slugHelp}</p>
                    <FieldError id="error-slug" message={draftErrors.slug} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="opportunity-work-mode">{text.workMode}</Label>
                    <Select value={draft.workMode} onValueChange={(value: WorkMode) => updateDraft("workMode", value)}>
                      <SelectTrigger id="opportunity-work-mode" className="min-h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="on-site">{text.onSite}</SelectItem>
                        <SelectItem value="hybrid">{text.hybrid}</SelectItem>
                        <SelectItem value="remote-flexible">{text.remoteFlexible}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </section>

              <section aria-labelledby="opportunity-translations-title">
                <h3 id="opportunity-translations-title" className="font-headline text-xl font-semibold">{text.translations}</h3>
                <Tabs value={formLocale} onValueChange={(value) => setFormLocale(value as Locale)} className="mt-4">
                  <TabsList className="grid h-auto w-full grid-cols-2">
                    <TabsTrigger value="fr" className="min-h-11">{text.french}</TabsTrigger>
                    <TabsTrigger value="en" className="min-h-11">{text.english}</TabsTrigger>
                  </TabsList>
                  <TabsContent value="fr">
                    <BilingualFields locale="fr" draft={draft} errors={draftErrors} update={updateDraft} text={text} />
                  </TabsContent>
                  <TabsContent value="en">
                    <BilingualFields locale="en" draft={draft} errors={draftErrors} update={updateDraft} text={text} />
                  </TabsContent>
                </Tabs>
              </section>

              <section className="space-y-5" aria-labelledby="opportunity-publishing-title">
                <h3 id="opportunity-publishing-title" className="font-headline text-xl font-semibold">{text.publishing}</h3>
                <div className="space-y-2">
                  <Label htmlFor="opportunity-tags">{text.tags}</Label>
                  <Input
                    id="opportunity-tags"
                    value={draft.tags}
                    onChange={(event) => updateDraft("tags", event.target.value)}
                    required
                    maxLength={809}
                    placeholder={locale === "fr" ? "Marketing, Excel, FMCG" : "Marketing, Excel, FMCG"}
                    aria-invalid={Boolean(draftErrors.tags)}
                    aria-describedby={`opportunity-tags-help${draftErrors.tags ? " error-tags" : ""}`}
                  />
                  <p id="opportunity-tags-help" className="text-xs text-muted-foreground">{text.tagsHelp}</p>
                  <FieldError id="error-tags" message={draftErrors.tags} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  {([
                    ["publishedAt", text.publishedAt, false],
                    ["deadlineAt", text.deadlineAt, false],
                    ["verifiedAt", text.verifiedAt, true],
                    ["expiresAt", text.expiresAt, true],
                  ] as const).map(([field, label, required]) => (
                    <div key={field} className="space-y-2">
                      <Label htmlFor={`opportunity-${field}`}>{label}</Label>
                      <Input
                        id={`opportunity-${field}`}
                        type="date"
                        value={draft[field]}
                        onChange={(event) => updateDraft(field, event.target.value)}
                        required={required}
                        aria-invalid={Boolean(draftErrors[field])}
                        aria-describedby={draftErrors[field] ? `error-${field}` : undefined}
                      />
                      <FieldError id={`error-${field}`} message={draftErrors[field]} />
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="opportunity-source-url">{text.sourceUrl}</Label>
                  <Input
                    id="opportunity-source-url"
                    type="url"
                    inputMode="url"
                    value={draft.sourceUrl}
                    onChange={(event) => updateDraft("sourceUrl", event.target.value)}
                    required
                    maxLength={2_048}
                    placeholder="https://careers.example.com/..."
                    aria-invalid={Boolean(draftErrors.sourceUrl)}
                    aria-describedby={draftErrors.sourceUrl ? "error-sourceUrl" : undefined}
                  />
                  <FieldError id="error-sourceUrl" message={draftErrors.sourceUrl} />
                </div>
              </section>
            </div>

            <DialogFooter className="gap-2 border-t bg-background px-5 py-4 sm:px-7">
              <Button type="button" variant="outline" className="min-h-11" onClick={() => setDialogOpen(false)} disabled={Boolean(savingAction)}>
                {text.cancel}
              </Button>
              <Button type="submit" className="min-h-11" disabled={Boolean(savingAction)}>
                {savingAction === "form" ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                {savingAction === "form" ? text.saving : text.save}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deleteCandidate)} onOpenChange={(open) => {
        if (!open && !savingAction) setDeleteCandidate(null);
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{text.deleteTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteCandidate ? `${deleteCandidate.company} — ${deleteCandidate.title[locale]}. ${text.deleteBody}` : text.deleteBody}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(savingAction)}>{text.cancel}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={Boolean(savingAction)}
              onClick={(event) => {
                event.preventDefault();
                void handleDelete();
              }}
            >
              {savingAction?.startsWith("delete:") ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />}
              {text.confirmDelete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
