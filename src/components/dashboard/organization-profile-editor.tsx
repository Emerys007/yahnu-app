"use client";

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  Clock3,
  ExternalLink,
  Eye,
  EyeOff,
  ImagePlus,
  Loader2,
  MapPin,
  Save,
  School,
  ShieldCheck,
} from 'lucide-react';

import { WorkspaceFrame } from '@/components/dashboard/workspace-frame';
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
  joinList,
  organizationSizes,
  splitList,
  type OrganizationProfile,
} from '@/lib/role-workspaces';

type ProfileForm = {
  slug: string;
  description: string;
  websiteUrl: string;
  locations: string;
  organizationSize: string;
  organizationType: string;
  programs: string;
  benefits: string;
  culture: string;
  logoAssetId: string;
  coverAssetId: string;
  logoUrl: string;
  coverUrl: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  publicPublishConsent: boolean;
};

const blankForm: ProfileForm = {
  slug: '',
  description: '',
  websiteUrl: '',
  locations: '',
  organizationSize: '',
  organizationType: '',
  programs: '',
  benefits: '',
  culture: '',
  logoAssetId: '',
  coverAssetId: '',
  logoUrl: '',
  coverUrl: '',
  contactName: '',
  contactEmail: '',
  contactPhone: '',
  publicPublishConsent: false,
};

function profileToForm(profile: OrganizationProfile): ProfileForm {
  return {
    slug: profile.slug,
    description: profile.description,
    websiteUrl: profile.websiteUrl || '',
    locations: joinList(profile.locations),
    organizationSize: profile.organizationSize || '',
    organizationType: profile.organizationType || '',
    programs: joinList(profile.programs),
    benefits: joinList(profile.benefits),
    culture: joinList(profile.culture),
    logoAssetId: profile.logoAssetId || '',
    coverAssetId: profile.coverAssetId || '',
    logoUrl: profile.logoUrl || '',
    coverUrl: profile.coverUrl || '',
    contactName: profile.contactName || '',
    contactEmail: profile.contactEmail || '',
    contactPhone: profile.contactPhone || '',
    publicPublishConsent: profile.publicPublishConsent,
  };
}

const sizeLabels: Record<string, string> = {
  '1_10': '1 à 10 personnes',
  '11_50': '11 à 50 personnes',
  '51_200': '51 à 200 personnes',
  '201_500': '201 à 500 personnes',
  '501_1000': '501 à 1 000 personnes',
  '1000_plus': 'Plus de 1 000 personnes',
};

export function OrganizationProfileEditor({ kind }: { kind: 'company' | 'school' }) {
  const { toast } = useToast();
  const [form, setForm] = useState<ProfileForm>(blankForm);
  const [organizationName, setOrganizationName] = useState('');
  const [profile, setProfile] = useState<OrganizationProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<'logo' | 'cover' | null>(null);
  const [requestVerification, setRequestVerification] = useState(false);
  const logoInput = useRef<HTMLInputElement>(null);
  const coverInput = useRef<HTMLInputElement>(null);
  const isCompany = kind === 'company';
  const Icon = isCompany ? Building2 : School;

  useEffect(() => {
    let cancelled = false;
    apiFetch<{
      data: {
        organizationName: string;
        profile: OrganizationProfile | null;
        suggestedSlug: string;
      };
    }>('/api/organization-profile')
      .then((response) => {
        if (cancelled) return;
        setOrganizationName(response.data.organizationName);
        setProfile(response.data.profile);
        setForm(response.data.profile
          ? profileToForm(response.data.profile)
          : { ...blankForm, slug: response.data.suggestedSlug });
      })
      .catch((error) => {
        if (!cancelled) {
          toast({
            title: 'Profil indisponible',
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

  const completeness = useMemo(() => {
    const checks = [
      form.description.trim().length >= 80,
      splitList(form.locations).length > 0,
      Boolean(form.websiteUrl.trim()),
      Boolean(form.contactEmail.trim()),
      Boolean(form.logoAssetId),
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [form]);

  const setField = <K extends keyof ProfileForm>(field: K, value: ProfileForm[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const uploadImage = async (file: File, target: 'logo' | 'cover') => {
    if (!file) return;
    setUploading(target);
    try {
      const body = new FormData();
      body.append('file', file);
      const response = await fetch('/api/organization-profile/media', {
        method: 'POST',
        body,
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
      });
      const payload = await response.json() as {
        data?: { media: { id: string; url: string } };
        error?: { message?: string };
      };
      if (!response.ok || !payload.data) throw new Error(payload.error?.message || 'Téléversement impossible.');
      if (target === 'logo') {
        setField('logoAssetId', payload.data.media.id);
        setField('logoUrl', payload.data.media.url);
      } else {
        setField('coverAssetId', payload.data.media.id);
        setField('coverUrl', payload.data.media.url);
      }
      toast({ title: 'Image ajoutée', description: 'Elle sera publiée avec votre profil après enregistrement.' });
    } catch (error) {
      toast({
        title: 'Image non ajoutée',
        description: error instanceof Error ? error.message : 'Choisissez une autre image.',
        variant: 'destructive',
      });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await apiFetch<{ data: { profile: OrganizationProfile } }>('/api/organization-profile', {
        method: 'PUT',
        body: JSON.stringify({
          slug: form.slug,
          description: form.description,
          websiteUrl: form.websiteUrl || null,
          locations: splitList(form.locations),
          organizationSize: form.organizationSize || null,
          organizationType: form.organizationType || null,
          programs: splitList(form.programs),
          benefits: splitList(form.benefits),
          culture: splitList(form.culture),
          logoAssetId: form.logoAssetId || null,
          coverAssetId: form.coverAssetId || null,
          contactName: form.contactName || null,
          contactEmail: form.contactEmail || null,
          contactPhone: form.contactPhone || null,
          publicPublishConsent: form.publicPublishConsent,
          requestVerification,
        }),
      });
      setProfile(response.data.profile);
      setForm(profileToForm(response.data.profile));
      setRequestVerification(false);
      toast({
        title: form.publicPublishConsent ? 'Profil enregistré et publié' : 'Brouillon enregistré',
        description: form.publicPublishConsent
          ? 'Votre vitrine est maintenant visible dans l’annuaire.'
          : 'Vos informations restent privées tant que vous n’activez pas la publication.',
      });
    } catch (error) {
      toast({
        title: 'Enregistrement impossible',
        description: error instanceof Error ? error.message : 'Vérifiez les champs puis réessayez.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid min-h-[28rem] place-items-center" role="status" aria-live="polite">
        <Loader2 className="h-9 w-9 animate-spin text-primary" aria-hidden="true" />
        <span className="sr-only">Chargement du profil de l’organisation</span>
      </div>
    );
  }

  const publicHref = `/${isCompany ? 'companies' : 'schools'}/${encodeURIComponent(form.slug)}`;
  const verificationLabel = {
    unverified: 'Non vérifié',
    pending: 'Vérification demandée',
    verified: 'Vérifié',
    rejected: 'À corriger',
  }[profile?.verificationStatus || 'unverified'];

  return (
    <WorkspaceFrame
      eyebrow={isCompany ? 'Identité employeur' : 'Identité campus'}
      title={isCompany ? 'Votre entreprise, au-delà du logo.' : 'Votre établissement, du campus à l’emploi.'}
      description={
        isCompany
          ? 'Présentez votre culture, vos métiers et vos avantages aux jeunes talents ivoiriens. Rien n’est publié sans votre accord explicite.'
          : 'Faites connaître vos programmes et votre présence territoriale. Votre espace public reste sous votre contrôle.'
      }
      icon={Icon}
      accent={isCompany ? 'terra' : 'primary'}
      actions={profile?.publicPublishConsent ? (
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href={publicHref} target="_blank">
            Voir le profil public <ExternalLink className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      ) : null}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_21rem]">
        <div className="space-y-6">
          <Card className="overflow-hidden border-border/70">
            <div className="relative h-36 bg-primary/[0.06] sm:h-48">
              {form.coverUrl ? (
                <Image src={form.coverUrl} alt="" fill unoptimized className="object-cover" />
              ) : <div className="ci-pattern absolute inset-0 opacity-60" />}
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute right-4 top-4 shadow-soft"
                onClick={() => coverInput.current?.click()}
                disabled={uploading !== null}
              >
                {uploading === 'cover' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ImagePlus className="mr-2 h-4 w-4" />}
                Photo de couverture
              </Button>
              <input
                ref={coverInput}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => event.target.files?.[0] && void uploadImage(event.target.files[0], 'cover')}
              />
            </div>
            <CardContent className="-mt-10 flex flex-col gap-5 px-5 pb-6 sm:-mt-12 sm:flex-row sm:items-end sm:px-7">
              <button
                type="button"
                onClick={() => logoInput.current?.click()}
                className="relative grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-3xl border-8 border-card bg-muted text-primary shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Ajouter le logo"
              >
                {form.logoUrl ? (
                  <Image src={form.logoUrl} alt={`Logo ${organizationName}`} fill unoptimized className="object-cover" />
                ) : uploading === 'logo' ? (
                  <Loader2 className="h-7 w-7 animate-spin" />
                ) : (
                  <Icon className="h-8 w-8" />
                )}
              </button>
              <input
                ref={logoInput}
                type="file"
                hidden
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={(event) => event.target.files?.[0] && void uploadImage(event.target.files[0], 'logo')}
              />
              <div className="min-w-0 pb-1">
                <p className="truncate font-display text-2xl font-bold sm:text-3xl">{organizationName}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={profile?.verificationStatus === 'verified' ? 'default' : 'secondary'}>
                    <ShieldCheck className="mr-1 h-3.5 w-3.5" /> {verificationLabel}
                  </Badge>
                  <Badge variant="outline">{form.publicPublishConsent ? 'Publié' : 'Privé'}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Présentation publique</CardTitle>
              <CardDescription>Le récit, les lieux et l’adresse qui seront visibles dans l’annuaire Yahnu.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="organization-description">À propos</Label>
                <Textarea
                  id="organization-description"
                  value={form.description}
                  onChange={(event) => setField('description', event.target.value)}
                  rows={7}
                  placeholder={isCompany
                    ? 'Expliquez ce que vous construisez en Côte d’Ivoire, les métiers de vos équipes et ce qu’un jeune talent peut apprendre chez vous…'
                    : 'Présentez votre projet pédagogique, vos campus et la manière dont vous accompagnez les diplômés vers leur premier emploi…'}
                />
                <p className="text-xs text-muted-foreground">{form.description.length}/6 000 caractères · 80 minimum pour publier</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-slug">Adresse publique</Label>
                <div className="flex rounded-md border bg-muted/30">
                  <span className="hidden items-center border-r px-3 text-xs text-muted-foreground sm:flex">/{isCompany ? 'companies' : 'schools'}/</span>
                  <Input
                    id="organization-slug"
                    className="border-0 bg-transparent focus-visible:ring-0"
                    value={form.slug}
                    onChange={(event) => setField('slug', event.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-website">Site web</Label>
                <Input
                  id="organization-website"
                  type="url"
                  value={form.websiteUrl}
                  onChange={(event) => setField('websiteUrl', event.target.value)}
                  placeholder="https://www.exemple.ci"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="organization-locations">Implantations</Label>
                <Input
                  id="organization-locations"
                  value={form.locations}
                  onChange={(event) => setField('locations', event.target.value)}
                  placeholder="Cocody, Abidjan · Bouaké · San-Pédro"
                />
                <p className="text-xs text-muted-foreground">Séparez les lieux par une virgule.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-type">{isCompany ? 'Secteur / type' : 'Type d’établissement'}</Label>
                <Input
                  id="organization-type"
                  value={form.organizationType}
                  onChange={(event) => setField('organizationType', event.target.value)}
                  placeholder={isCompany ? 'Fintech, industrie, cabinet…' : 'Université, grande école, centre…'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-size">Taille</Label>
                <select
                  id="organization-size"
                  value={form.organizationSize}
                  onChange={(event) => setField('organizationSize', event.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Non renseignée</option>
                  {organizationSizes.map((size) => <option key={size} value={size}>{sizeLabels[size]}</option>)}
                </select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{isCompany ? 'Culture & expérience candidat' : 'Programmes & vie du campus'}</CardTitle>
              <CardDescription>Des repères concrets pour aider les visiteurs à comprendre ce qui vous distingue.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="organization-programs">{isCompany ? 'Métiers recherchés' : 'Programmes phares'}</Label>
                <Textarea id="organization-programs" rows={5} value={form.programs} onChange={(event) => setField('programs', event.target.value)} placeholder="Finance, data, relation client…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-benefits">{isCompany ? 'Avantages' : 'Services aux diplômés'}</Label>
                <Textarea id="organization-benefits" rows={5} value={form.benefits} onChange={(event) => setField('benefits', event.target.value)} placeholder="Mentorat, transport, formation…" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="organization-culture">Valeurs vécues</Label>
                <Textarea id="organization-culture" rows={5} value={form.culture} onChange={(event) => setField('culture', event.target.value)} placeholder="Exigence, entraide, impact local…" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact de confiance</CardTitle>
              <CardDescription>Ces coordonnées servent au suivi Yahnu. Elles ne sont pas affichées dans l’annuaire public.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="contact-name">Nom du contact</Label>
                <Input id="contact-name" value={form.contactName} onChange={(event) => setField('contactName', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">E-mail professionnel</Label>
                <Input id="contact-email" type="email" value={form.contactEmail} onChange={(event) => setField('contactEmail', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-phone">Téléphone</Label>
                <Input id="contact-phone" type="tel" value={form.contactPhone} onChange={(event) => setField('contactPhone', event.target.value)} placeholder="+225 07 00 00 00 00" />
              </div>
            </CardContent>
          </Card>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-24 xl:self-start">
          <Card className="overflow-hidden border-primary/20">
            <div className="h-1.5 bg-gradient-to-r from-terra via-primary to-lagoon" />
            <CardHeader>
              <CardTitle>Prêt à être découvert ?</CardTitle>
              <CardDescription>Votre vitrine reste privée jusqu’à ce que vous l’autorisiez.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Complétude</span>
                  <span className="font-bold text-primary">{completeness}%</span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-gradient-to-r from-terra to-primary transition-[width]" style={{ width: `${completeness}%` }} />
                </div>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-2xl border bg-muted/25 p-4">
                <div>
                  <Label htmlFor="public-publish" className="flex items-center gap-2 text-base">
                    {form.publicPublishConsent ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />}
                    Publication publique
                  </Label>
                  <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    {form.publicPublishConsent ? 'Visible dans l’annuaire après enregistrement.' : 'Visible uniquement par votre équipe.'}
                  </p>
                </div>
                <Switch
                  id="public-publish"
                  checked={form.publicPublishConsent}
                  onCheckedChange={(checked) => setField('publicPublishConsent', checked)}
                />
              </div>
              {profile?.verificationStatus === 'verified' ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertTitle>Organisation vérifiée</AlertTitle>
                  <AlertDescription>Votre identité a été examinée par Yahnu.</AlertDescription>
                </Alert>
              ) : profile?.verificationStatus === 'pending' ? (
                <Alert>
                  <Clock3 className="h-4 w-4" />
                  <AlertTitle>Examen en cours</AlertTitle>
                  <AlertDescription>
                    Votre demande a été transmise à l’équipe Yahnu. Toute modification du nom, du site ou de l’e-mail nécessitera une nouvelle vérification.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-3">
                  {profile?.verificationStatus === 'rejected' && profile.verificationNote ? (
                    <Alert variant="destructive">
                      <ShieldCheck className="h-4 w-4" />
                      <AlertTitle>Corrections demandées</AlertTitle>
                      <AlertDescription>{profile.verificationNote}</AlertDescription>
                    </Alert>
                  ) : null}
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border p-4">
                    <input
                      type="checkbox"
                      className="mt-1 h-4 w-4 accent-primary"
                      checked={requestVerification}
                      onChange={(event) => setRequestVerification(event.target.checked)}
                    />
                    <span>
                      <span className="block text-sm font-semibold">Demander la vérification</span>
                      <span className="mt-1 block text-xs leading-5 text-muted-foreground">Yahnu examinera le site et le contact fournis. Aucune validation n’est automatique.</span>
                    </span>
                  </label>
                </div>
              )}
              <Button type="button" size="lg" className="w-full" onClick={() => void save()} disabled={saving || uploading !== null}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Enregistrer
              </Button>
              <div className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                Les implantations publiques facilitent la découverte locale, d’Abidjan aux villes de l’intérieur.
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </WorkspaceFrame>
  );
}
