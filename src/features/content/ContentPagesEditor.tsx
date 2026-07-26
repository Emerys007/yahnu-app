
"use client"

import React, { useState, useEffect } from "react"
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { apiFetch } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Separator } from "@/components/ui/separator"
import { defaultImpactPageContent } from "@/lib/impact-content"

// --- Schemas and Default Values (Defined at the top level) ---

const teamMemberSchema = z.object({
  name: z.string().min(1, "Le nom est obligatoire."),
  role: z.string().min(1, "Le rôle est obligatoire."),
  imageUrl: z.string().refine((value) => value === "" || /^\/(?!\/)(?!\.\.(?:\/|$))(?!.*\/\.\.(?:\/|$))[^?#\\\u0000-\u001f]+$/.test(value), "Utilisez une image du dossier public, par exemple /images/personne.jpg."),
});

const aboutPageSchema = z.object({
    aboutTitle: z.string().min(1, "Ce champ est obligatoire."),
    aboutSubtitle: z.string().min(1, "Ce champ est obligatoire."),
    storyTitle: z.string().min(1, "Ce champ est obligatoire."),
    storyContent1: z.string().min(1, "Ce champ est obligatoire."),
    storyContent2: z.string().min(1, "Ce champ est obligatoire."),
    missionTitle: z.string().min(1, "Ce champ est obligatoire."),
    missionContent: z.string().min(1, "Ce champ est obligatoire."),
    visionTitle: z.string().min(1, "Ce champ est obligatoire."),
    visionContent: z.string().min(1, "Ce champ est obligatoire."),
    valuesTitle: z.string().min(1, "Ce champ est obligatoire."),
    valuesContent: z.string().min(1, "Ce champ est obligatoire."),
    teamMembers: z.array(teamMemberSchema).optional(),
});

const legalPageSchema = z.object({
    title: z.string().min(1, "Ce champ est obligatoire."),
    lastUpdated: z.string().min(1, "Ce champ est obligatoire."),
    content: z.string().min(50, "Le contenu doit comporter au moins 50 caractères."),
})

const impactMetricSchema = z.object({
    value: z.string().min(1, "La valeur est obligatoire."),
    label: z.string().min(1, "Le libellé est obligatoire."),
    detail: z.string().min(1, "La précision est obligatoire."),
})

const impactLocaleSchema = z.object({
    heroTitle: z.string().min(1, "Le titre est obligatoire."),
    heroSubtitle: z.string().min(1, "Le sous-titre est obligatoire."),
    metrics: z.array(impactMetricSchema).min(1, "Ajoutez au moins un indicateur.").max(8, "Huit indicateurs maximum."),
    methodologyTitle: z.string().min(1, "Le titre de la méthode est obligatoire."),
    methodologyBody: z.string().min(1, "La méthode est obligatoire."),
    reportingCadence: z.string().min(1, "Le rythme de publication est obligatoire."),
    currentStatus: z.string().min(1, "Le statut est obligatoire."),
})

const impactPageSchema = z.object({
    fr: impactLocaleSchema,
    en: impactLocaleSchema,
})

const defaultAboutValues: z.infer<typeof aboutPageSchema> = {
    aboutTitle: "Faire du diplôme un vrai point de départ.",
    aboutSubtitle: "Yahnu rapproche les jeunes diplômés, les établissements et les employeurs afin que le talent ivoirien trouve des opportunités concrètes en {country}.",
    storyTitle: "Une réponse née en Côte d’Ivoire",
    storyContent1: "<p>À Abidjan comme à Bouaké, Yamoussoukro, Korhogo ou San-Pédro, de jeunes diplômés talentueux cherchent leur première expérience pendant que des entreprises peinent à identifier les bons profils. Yahnu est né de ce constat simple : le potentiel existe déjà, mais les connexions restent trop difficiles à créer.</p>",
    storyContent2: "<p>Nous construisons un espace où chaque parcours peut être compris, chaque compétence mise en valeur et chaque opportunité rendue accessible. Diplômés, écoles et recruteurs avancent avec des informations utiles, des échanges directs et une même ambition : faire grandir les carrières ivoiriennes et africaines.</p>",
    missionTitle: "Notre mission",
    missionContent: "<p>Donner à chaque jeune diplômé les moyens de rendre son potentiel visible, d’accéder aux bonnes opportunités et de bâtir une carrière qui lui ressemble.</p>",
    visionTitle: "Notre vision",
    visionContent: "<p>Faire de la Côte d’Ivoire un carrefour africain où les talents, les campus et les entreprises transforment ensemble les diplômes en impact concret.</p>",
    valuesTitle: "Nos repères",
    valuesContent: "<p>La confiance, l’audace, l’entraide et le respect des réalités locales guident chaque expérience conçue sur Yahnu.</p>",
    teamMembers: [
        { name: "Colombe Koffi", role: "about.team.roles.founder_ceo", imageUrl: "/images/Colombe Koffi.jpeg" },
        { name: "Joël K", role: "about.team.roles.head_of_product", imageUrl: "/images/Joel K.jpeg" },
        { name: "Bethel Touman", role: "about.team.roles.data_engineer", imageUrl: "/images/Bethel_Touman.jpeg" },
    ]
}

const defaultPrivacyPolicy: z.infer<typeof legalPageSchema> = {
    title: "Politique de confidentialité",
    lastUpdated: "16 juillet 2026",
    content: `<p>Chez Yahnu, nous accordons de l’importance à la confiance des jeunes diplômés, des établissements et des employeurs qui utilisent notre plateforme en Côte d’Ivoire. Cette politique explique quelles données nous traitons, pourquoi nous les utilisons et quels choix vous pouvez exercer.</p><h2>Les données concernées</h2><p>Selon votre rôle et votre utilisation de Yahnu, nous pouvons traiter :</p><ul><li>vos informations d’identité et de contact, comme votre nom, votre adresse e-mail et votre numéro de téléphone ;</li><li>les informations de votre profil professionnel ou académique, notamment vos compétences, formations, expériences et documents transmis ;</li><li>les candidatures, messages, préférences et autres actions réalisées dans votre espace ;</li><li>des données techniques utiles au fonctionnement et à la sécurité du service.</li></ul><h2>Pourquoi nous les utilisons</h2><p>Ces informations nous permettent de créer et sécuriser votre compte, présenter des opportunités pertinentes, faciliter les candidatures et les échanges, aider les établissements à accompagner leurs diplômés, permettre aux employeurs d’étudier les profils autorisés et améliorer l’expérience Yahnu.</p><h2>Partage des informations</h2><p>Nous partageons uniquement les informations nécessaires avec les diplômés, établissements ou employeurs concernés par une interaction sur Yahnu, avec les prestataires qui contribuent au fonctionnement sécurisé du service, ou lorsque la loi l’exige. Nous ne vendons pas vos données personnelles.</p><h2>Conservation et sécurité</h2><p>Nous conservons les informations pendant la durée utile à votre compte, à nos obligations et à la sécurité de la plateforme. Nous appliquons des mesures techniques et organisationnelles adaptées, tout en rappelant qu’aucun service numérique ne peut garantir un risque nul.</p><h2>Vos choix</h2><p>Vous pouvez consulter et corriger les informations de votre profil depuis votre espace. Pour demander l’accès, la rectification ou la suppression d’autres données, écrivez-nous à <strong>contact@yahnu.org</strong>. Nous pouvons vérifier votre identité avant de traiter la demande.</p><h2>Mises à jour</h2><p>Cette politique peut évoluer avec les fonctionnalités de Yahnu. La date affichée en haut de page indique sa dernière mise à jour.</p><h2>Nous contacter</h2><p>Pour toute question relative à la confidentialité : <strong>contact@yahnu.org</strong>.</p>`
};

const defaultTerms: z.infer<typeof legalPageSchema> = {
    title: "Conditions d’utilisation",
    lastUpdated: "16 juillet 2026",
    content: `<p>Les présentes conditions encadrent l’utilisation de Yahnu, une plateforme qui rapproche les jeunes diplômés, les établissements d’enseignement et les employeurs en Côte d’Ivoire. En créant un compte ou en utilisant le service, vous acceptez ces règles.</p><h2>Votre compte</h2><p>Vous devez fournir des informations exactes, maintenir vos coordonnées à jour et protéger vos identifiants. Vous êtes responsable des actions réalisées depuis votre compte et devez nous signaler rapidement toute utilisation suspecte.</p><h2>Des profils et opportunités fiables</h2><ul><li>Les diplômés présentent fidèlement leurs formations, compétences et expériences.</li><li>Les employeurs publient des opportunités réelles, claires et conformes aux règles applicables, sans contenu trompeur ou discriminatoire.</li><li>Les établissements vérifient uniquement les informations qu’ils sont habilités à confirmer.</li></ul><p>Yahnu facilite la rencontre entre les acteurs, mais ne garantit ni recrutement, ni candidature retenue, ni résultat professionnel particulier.</p><h2>Utilisation responsable</h2><p>Il est interdit d’usurper une identité, d’accéder au compte d’une autre personne, de diffuser du contenu illégal ou nuisible, de collecter massivement des données, de contourner les protections techniques ou d’utiliser Yahnu pour envoyer des messages non sollicités.</p><h2>Contenus publiés</h2><p>Vous restez responsable des textes, documents et informations que vous transmettez. Vous nous autorisez à les héberger, les afficher et les traiter uniquement dans la mesure nécessaire au fonctionnement des fonctionnalités que vous utilisez.</p><h2>Disponibilité et évolution du service</h2><p>Nous faisons notre possible pour assurer un service utile et fiable. Certaines fonctions peuvent toutefois être interrompues pour maintenance, sécurité ou amélioration. Nous pouvons faire évoluer Yahnu et vous informerons des changements importants lorsque cela est approprié.</p><h2>Modération et suspension</h2><p>Nous pouvons retirer un contenu ou limiter un compte qui présente un risque, enfreint ces conditions ou porte atteinte à d’autres utilisateurs. Lorsque la situation le permet, nous privilégions une explication et une possibilité de régularisation.</p><h2>Mise à jour des conditions</h2><p>Ces conditions peuvent évoluer. La date affichée en haut de page indique la version en vigueur ; poursuivre l’utilisation du service après une mise à jour vaut acceptation des nouvelles conditions.</p><h2>Nous contacter</h2><p>Une question ou un signalement ? Écrivez-nous à <strong>contact@yahnu.org</strong>.</p>`
};

type PageResponse = {
    data: {
        page: {
            id: string;
            data: Record<string, unknown>;
            updatedAt: string;
        } | null;
    };
}

// --- Helper Component ---

const PageFormWrapper = ({ pageId, schema, defaultValues, children }: { pageId: string, schema: any, defaultValues: any, children: (form: any, isSaving: boolean) => React.ReactNode }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues,
    });

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const response = await apiFetch<PageResponse>(`/api/pages/${encodeURIComponent(pageId)}`);
                if (response.data.page) {
                    const data = response.data.page.data;
                    if (pageId === 'about-us' && (!data.teamMembers || !Array.isArray(data.teamMembers))) {
                        data.teamMembers = defaultValues.teamMembers;
                    }
                    form.reset(data);
                } else {
                    form.reset(defaultValues);
                }
            } catch (error) {
                 console.error("Failed to fetch page content:", error);
                 form.reset(defaultValues);
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [form, pageId, defaultValues]);

    const onSubmit = async (values: z.infer<any>) => {
        setIsSaving(true);
         try {
            await apiFetch(`/api/pages/${encodeURIComponent(pageId)}`, {
                method: 'PUT',
                body: JSON.stringify({ data: values }),
            });
            toast({
                title: "Contenu mis à jour",
                description: "Le contenu de la page a bien été enregistré.",
            });
        } catch (error) {
            console.error("Failed to save content:", error);
            toast({
                title: "Enregistrement impossible",
                description: "La page n’a pas pu être enregistrée. Vérifiez votre connexion puis réessayez.",
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {children(form, isSaving)}
            </form>
        </Form>
    );
};

const AboutUsForm = ({ form, isSaving }: { form: UseFormReturn<z.infer<typeof aboutPageSchema>>, isSaving: boolean }) => {
    const { t } = useLocalization();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "teamMembers"
    });
    
    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Hero Section')}</h3>
                <FormField control={form.control} name="aboutTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aboutSubtitle" render={({ field }) => (<FormItem><FormLabel>{t('Subtitle')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Story Section')}</h3>
                <FormField control={form.control} name="storyTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent1" render={({ field }) => (<FormItem><FormLabel>{t('Content Paragraph 1')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent2" render={({ field }) => (<FormItem><FormLabel>{t('Content Paragraph 2')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Mission, Vision & Values')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Mission Card')}</h4>
                        <FormField control={form.control} name="missionTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="missionContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Vision Card')}</h4>
                        <FormField control={form.control} name="visionTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="visionContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Values Card')}</h4>
                        <FormField control={form.control} name="valuesTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="valuesContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
             </div>
             <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('Meet the Team Section')}</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', role: '', imageUrl: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Member')}
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="relative space-y-4 rounded-lg border bg-muted/50 p-4 pr-14">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`teamMembers.${index}.name`} render={({ field }) => (<FormItem><FormLabel>{t('Name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`teamMembers.${index}.role`} render={({ field }) => (<FormItem><FormLabel>{t('Role')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`teamMembers.${index}.imageUrl`} render={({ field }) => (<FormItem><FormLabel>{t('Image path')}</FormLabel><FormControl><Input placeholder="/images/person.jpg" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute right-2 top-2 h-9 w-9"
                                onClick={() => remove(index)}
                                aria-label={`Supprimer ${field.name || `le membre ${index + 1}`}`}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    ))}
                </div>
             </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('Save About Page')}
                </Button>
            </div>
        </div>
    )
}

const LegalPageForm = ({ form, isSaving, pageName }: { form: UseFormReturn<z.infer<typeof legalPageSchema>>, isSaving: boolean, pageName: string }) => {
    const { t } = useLocalization();
    return (
        <div className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lastUpdated" render={({ field }) => (<FormItem><FormLabel>{t('Last Updated Date')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
             <div className="flex justify-end">
                 <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('Save {pageName}', { pageName })}
                </Button>
            </div>
        </div>
    )
}

type ImpactFormValues = z.infer<typeof impactPageSchema>
type ImpactLocale = keyof ImpactFormValues

const ImpactLocaleFields = ({
    form,
    locale,
}: {
    form: UseFormReturn<ImpactFormValues>,
    locale: ImpactLocale,
}) => {
    const metricsName = `${locale}.metrics` as "fr.metrics" | "en.metrics"
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: metricsName,
    })
    const isFrench = locale === "fr"
    const fieldName = <Field extends keyof ImpactFormValues[ImpactLocale]>(field: Field) =>
        `${locale}.${field}` as `fr.${Field}` | `en.${Field}`

    return (
        <div className="space-y-8 pt-5">
            <div className="space-y-4 rounded-lg border p-4">
                <div>
                    <h3 className="text-lg font-semibold">
                        {isFrench ? "Introduction en français" : "English introduction"}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {isFrench
                            ? "Adaptez le message au contexte du pilote sans présenter les cibles comme des résultats."
                            : "Adapt the pilot message without presenting targets as achieved results."}
                    </p>
                </div>
                <FormField control={form.control} name={fieldName("heroTitle")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Titre principal" : "Main title"}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={fieldName("heroSubtitle")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Sous-titre" : "Subtitle"}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>

            <Separator />

            <div className="space-y-4 rounded-lg border p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <h3 className="text-lg font-semibold">{isFrench ? "Indicateurs proposés" : "Proposed indicators"}</h3>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {isFrench
                                ? "Un à huit indicateurs, avec une explication compréhensible par tous."
                                : "One to eight indicators, each with a plain-language explanation."}
                        </p>
                    </div>
                    <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={fields.length >= 8}
                        onClick={() => append({ value: "", label: "", detail: "" })}
                    >
                        <PlusCircle className="mr-2 h-4 w-4" aria-hidden="true" />
                        {isFrench ? "Ajouter un indicateur" : "Add an indicator"}
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((metric, index) => (
                        <div key={metric.id} className="relative grid gap-4 rounded-lg border bg-muted/35 p-4 pr-14 md:grid-cols-[0.45fr_1fr_1.5fr]">
                            <FormField control={form.control} name={`${locale}.metrics.${index}.value`} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Valeur" : "Value"}</FormLabel><FormControl><Input placeholder="500" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`${locale}.metrics.${index}.label`} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Libellé" : "Label"}</FormLabel><FormControl><Input placeholder={isFrench ? "jeunes accompagnés" : "young people supported"} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name={`${locale}.metrics.${index}.detail`} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Précision" : "Detail"}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="absolute right-2 top-2 h-9 w-9 text-destructive hover:text-destructive"
                                disabled={fields.length === 1}
                                onClick={() => remove(index)}
                                aria-label={isFrench ? `Supprimer l’indicateur ${index + 1}` : `Remove indicator ${index + 1}`}
                            >
                                <Trash2 className="h-4 w-4" aria-hidden="true" />
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            <Separator />

            <div className="space-y-4 rounded-lg border p-4">
                <h3 className="text-lg font-semibold">{isFrench ? "Méthode et redevabilité" : "Method and accountability"}</h3>
                <FormField control={form.control} name={fieldName("methodologyTitle")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Titre de la méthode" : "Method title"}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={fieldName("methodologyBody")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Méthode de mesure" : "Measurement method"}</FormLabel><FormControl><Textarea rows={4} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={fieldName("reportingCadence")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Rythme de publication" : "Reporting cadence"}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name={fieldName("currentStatus")} render={({ field }) => (<FormItem><FormLabel>{isFrench ? "Statut actuel" : "Current status"}</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
        </div>
    )
}

const ImpactPageForm = ({ form, isSaving }: { form: UseFormReturn<ImpactFormValues>, isSaving: boolean }) => {
    return (
        <div className="space-y-6">
            <div className="rounded-lg border border-primary/20 bg-primary/[0.045] p-4">
                <p className="font-semibold text-primary">Mention de transparence verrouillée</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    La page publique affiche toujours « Cibles proposées pour la phase pilote 2026 — pas des résultats observés ».
                    Cette mention ne peut pas être modifiée depuis le CMS.
                </p>
            </div>
            <Tabs defaultValue="fr">
                <TabsList className="grid h-auto w-full grid-cols-2">
                    <TabsTrigger value="fr" className="min-h-11">Français</TabsTrigger>
                    <TabsTrigger value="en" className="min-h-11">English</TabsTrigger>
                </TabsList>
                <TabsContent value="fr">
                    <ImpactLocaleFields form={form} locale="fr" />
                </TabsContent>
                <TabsContent value="en">
                    <ImpactLocaleFields form={form} locale="en" />
                </TabsContent>
            </Tabs>
            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Enregistrer la page Impact
                </Button>
            </div>
        </div>
    )
}

// --- Main Component ---

export function ContentPagesEditor() {
    const { t } = useLocalization();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Pages publiques</CardTitle>
                <CardDescription>Modifiez les contenus affichés sur les pages publiques de Yahnu.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="about-us">
                    <div className="-mx-1 overflow-x-auto px-1 pb-1">
                        <TabsList className="h-auto min-w-max">
                            <TabsTrigger value="about-us" className="min-h-11 shrink-0">{t("About Us")}</TabsTrigger>
                            <TabsTrigger value="impact" className="min-h-11 shrink-0">Impact</TabsTrigger>
                            <TabsTrigger value="privacy-policy" className="min-h-11 shrink-0">{t("Privacy Policy")}</TabsTrigger>
                            <TabsTrigger value="terms-of-service" className="min-h-11 shrink-0">{t("Terms of Service")}</TabsTrigger>
                        </TabsList>
                    </div>
                    <TabsContent value="about-us" className="pt-6">
                        <PageFormWrapper pageId="about-us" schema={aboutPageSchema} defaultValues={defaultAboutValues}>
                             {(form, isSaving) => <AboutUsForm form={form} isSaving={isSaving} />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="impact" className="pt-6">
                        <PageFormWrapper pageId="impact" schema={impactPageSchema} defaultValues={defaultImpactPageContent}>
                            {(form, isSaving) => <ImpactPageForm form={form} isSaving={isSaving} />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="privacy-policy" className="pt-6">
                        <PageFormWrapper pageId="privacy-policy" schema={legalPageSchema} defaultValues={defaultPrivacyPolicy}>
                            {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName={t("Privacy Policy")} />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="terms-of-service" className="pt-6">
                        <PageFormWrapper pageId="terms-of-service" schema={legalPageSchema} defaultValues={defaultTerms}>
                             {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName={t("Terms of Service")} />}
                        </PageFormWrapper>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
