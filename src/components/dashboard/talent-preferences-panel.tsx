"use client";

import { useEffect, useState } from 'react';
import {
  Eye,
  EyeOff,
  Link2,
  Loader2,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  UserRoundSearch,
} from 'lucide-react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api-client';
import {
  availabilityOptions,
  joinList,
  splitList,
  workModeOptions,
  type PortfolioEvidence,
  type TalentPreferences,
} from '@/lib/role-workspaces';
import { cn } from '@/lib/utils';

type PreferenceForm = {
  visibilityConsent: boolean;
  headline: string;
  summary: string;
  preferredRoles: string;
  preferredLocations: string;
  workModes: string[];
  employmentTypes: string;
  availability: string;
  portfolioEvidence: PortfolioEvidence[];
};

const availabilityLabels: Record<string, string> = {
  immediate: 'Disponible maintenant',
  one_month: 'Disponible sous un mois',
  three_months: 'Disponible sous trois mois',
  exploring: 'À l’écoute du marché',
};

const workModeLabels: Record<string, string> = {
  onsite: 'Présentiel',
  hybrid: 'Hybride',
  remote: 'À distance',
};

function toForm(preferences: TalentPreferences): PreferenceForm {
  return {
    visibilityConsent: preferences.visibilityConsent,
    headline: preferences.headline,
    summary: preferences.summary,
    preferredRoles: joinList(preferences.preferredRoles),
    preferredLocations: joinList(preferences.preferredLocations),
    workModes: preferences.workModes,
    employmentTypes: joinList(preferences.employmentTypes),
    availability: preferences.availability || '',
    portfolioEvidence: preferences.portfolioEvidence,
  };
}

export function TalentPreferencesPanel() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<PreferenceForm>(() => toForm({
    visibilityConsent: false,
    headline: '',
    summary: '',
    preferredRoles: [],
    preferredLocations: [],
    workModes: [],
    employmentTypes: [],
    availability: null,
    portfolioEvidence: [],
    consentedAt: null,
    withdrawnAt: null,
    updatedAt: null,
  }));

  useEffect(() => {
    let cancelled = false;
    apiFetch<{ data: { preferences: TalentPreferences } }>('/api/talent/me')
      .then((response) => {
        if (!cancelled) setForm(toForm(response.data.preferences));
      })
      .catch((error) => {
        if (!cancelled) {
          toast({
            title: 'Préférences indisponibles',
            description: error instanceof Error ? error.message : 'Réessayez dans un instant.',
            variant: 'destructive',
          });
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [toast]);

  const setField = <K extends keyof PreferenceForm>(field: K, value: PreferenceForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };
  const toggleWorkMode = (mode: string) => {
    setField('workModes', form.workModes.includes(mode)
      ? form.workModes.filter((item) => item !== mode)
      : [...form.workModes, mode]);
  };
  const updateEvidence = (index: number, patch: Partial<PortfolioEvidence>) => {
    setField('portfolioEvidence', form.portfolioEvidence.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, ...patch } : entry
    )));
  };
  const save = async () => {
    setSaving(true);
    try {
      const response = await apiFetch<{ data: { preferences: TalentPreferences } }>('/api/talent/me', {
        method: 'PUT',
        body: JSON.stringify({
          visibilityConsent: form.visibilityConsent,
          headline: form.headline,
          summary: form.summary,
          preferredRoles: splitList(form.preferredRoles),
          preferredLocations: splitList(form.preferredLocations),
          workModes: form.workModes,
          employmentTypes: splitList(form.employmentTypes),
          availability: form.availability || null,
          portfolioEvidence: form.portfolioEvidence.filter((entry) => entry.label.trim() && entry.url.trim()),
        }),
      });
      setForm(toForm(response.data.preferences));
      toast({
        title: form.visibilityConsent ? 'Profil visible avec votre accord' : 'Profil retiré du vivier',
        description: form.visibilityConsent
          ? 'Les entreprises connectées peuvent voir les éléments professionnels choisis, jamais votre e-mail ni votre téléphone.'
          : 'Votre profil n’apparaît plus dans les recherches recruteur.',
      });
    } catch (error) {
      toast({
        title: 'Préférences non enregistrées',
        description: error instanceof Error ? error.message : 'Vérifiez les informations puis réessayez.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="h-1.5 bg-gradient-to-r from-terra via-primary to-lagoon" />
      <CardHeader className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lagoon/10 text-lagoon">
              <UserRoundSearch className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Visibilité auprès des recruteurs</CardTitle>
              <CardDescription className="mt-1 max-w-2xl">
                Choisissez ce que les entreprises peuvent découvrir avant de vous contacter dans la messagerie Yahnu.
              </CardDescription>
            </div>
          </div>
          <Badge variant={form.visibilityConsent ? 'default' : 'secondary'} className="w-fit">
            {form.visibilityConsent ? <Eye className="mr-1 h-3.5 w-3.5" /> : <EyeOff className="mr-1 h-3.5 w-3.5" />}
            {form.visibilityConsent ? 'Visible' : 'Privé'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid min-h-48 place-items-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
        ) : (
          <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_19rem]">
            <div className="space-y-6">
              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="talent-headline">Votre promesse professionnelle</Label>
                  <Input
                    id="talent-headline"
                    value={form.headline}
                    onChange={(event) => setField('headline', event.target.value)}
                    placeholder="Analyste data junior, rigoureuse et passionnée par l’impact public"
                  />
                  <p className="text-xs text-muted-foreground">20 caractères minimum pour activer la visibilité.</p>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="talent-summary">Ce que vous pouvez apporter</Label>
                  <Textarea
                    id="talent-summary"
                    rows={5}
                    value={form.summary}
                    onChange={(event) => setField('summary', event.target.value)}
                    placeholder="Parlez d’un projet, d’un problème résolu ou d’un environnement où vous donnez le meilleur de vous-même…"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-roles">Métiers recherchés</Label>
                  <Input id="preferred-roles" value={form.preferredRoles} onChange={(event) => setField('preferredRoles', event.target.value)} placeholder="Contrôle de gestion, analyse data…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="preferred-locations">Lieux préférés</Label>
                  <Input id="preferred-locations" value={form.preferredLocations} onChange={(event) => setField('preferredLocations', event.target.value)} placeholder="Abidjan, Bouaké, hybride…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employment-types">Types d’opportunité</Label>
                  <Input id="employment-types" value={form.employmentTypes} onChange={(event) => setField('employmentTypes', event.target.value)} placeholder="CDI, stage, VIE, mission…" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="availability">Disponibilité</Label>
                  <select id="availability" value={form.availability} onChange={(event) => setField('availability', event.target.value)} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                    <option value="">Non précisée</option>
                    {availabilityOptions.map((option) => <option key={option} value={option}>{availabilityLabels[option]}</option>)}
                  </select>
                </div>
                <fieldset className="space-y-3 md:col-span-2">
                  <legend className="text-sm font-medium">Organisation du travail</legend>
                  <div className="flex flex-wrap gap-2">
                    {workModeOptions.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleWorkMode(mode)}
                        className={cn(
                          'rounded-full border px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                          form.workModes.includes(mode) ? 'border-primary bg-primary text-primary-foreground' : 'bg-background hover:bg-muted',
                        )}
                        aria-pressed={form.workModes.includes(mode)}
                      >
                        {workModeLabels[mode]}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              <div className="rounded-2xl border p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-semibold">Preuves de portfolio</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Projet GitHub, étude de cas, création visuelle ou article signé. Yahnu affiche le lien mais ne le certifie pas.</p>
                  </div>
                  <Button type="button" size="sm" variant="outline" onClick={() => setField('portfolioEvidence', [...form.portfolioEvidence, { label: '', url: '' }])}>
                    <Plus className="mr-2 h-4 w-4" /> Ajouter
                  </Button>
                </div>
                <div className="mt-4 space-y-3">
                  {form.portfolioEvidence.map((entry, index) => (
                    <div key={`${index}-${entry.url}`} className="grid gap-2 rounded-xl bg-muted/35 p-3 sm:grid-cols-[0.8fr_1.2fr_auto]">
                      <Input aria-label={`Nom de la preuve ${index + 1}`} value={entry.label} onChange={(event) => updateEvidence(index, { label: event.target.value })} placeholder="Tableau de bord mobilité" />
                      <Input aria-label={`Lien de la preuve ${index + 1}`} type="url" value={entry.url} onChange={(event) => updateEvidence(index, { url: event.target.value })} placeholder="https://…" />
                      <Button type="button" size="icon" variant="ghost" aria-label={`Supprimer la preuve ${index + 1}`} onClick={() => setField('portfolioEvidence', form.portfolioEvidence.filter((_, entryIndex) => entryIndex !== index))}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  {form.portfolioEvidence.length === 0 && (
                    <div className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                      <Link2 className="mx-auto mb-2 h-5 w-5" /> Aucune preuve ajoutée pour le moment.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <aside className="space-y-4">
              <div className="rounded-2xl border bg-muted/25 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <Label htmlFor="talent-visible" className="text-base">Être visible</Label>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">Vous pouvez retirer ce consentement à tout moment.</p>
                  </div>
                  <Switch id="talent-visible" checked={form.visibilityConsent} onCheckedChange={(checked) => setField('visibilityConsent', checked)} />
                </div>
              </div>
              <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Votre vie privée reste la règle</AlertTitle>
                <AlertDescription>
                  L’e-mail, le téléphone et les documents privés ne sont jamais transmis. Une entreprise peut seulement vous écrire dans Yahnu, avec une limite de nouvelles prises de contact.
                </AlertDescription>
              </Alert>
              <Button type="button" size="lg" className="w-full" onClick={() => void save()} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer mes choix
              </Button>
            </aside>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
