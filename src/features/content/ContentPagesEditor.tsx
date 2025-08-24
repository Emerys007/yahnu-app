
"use client"

import React, { useState, useEffect } from "react"
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { doc, getDoc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Separator } from "@/components/ui/separator"
import { useAuth } from "@/context/auth-context"

// --- Schemas and Default Values (Defined at the top level) ---

const teamMemberSchema = z.object({
  name: z.string().min(1, "Le nom est requis."),
  role: z.string().min(1, "Le rôle est requis."),
  imageUrl: z.string().url("Doit être une URL valide.").or(z.literal("")),
});

const aboutPageSchema = z.object({
    aboutTitle: z.string().min(1, "Requis"),
    aboutSubtitle: z.string().min(1, "Requis"),
    storyTitle: z.string().min(1, "Requis"),
    storyContent1: z.string().min(1, "Requis"),
    storyContent2: z.string().min(1, "Requis"),
    missionTitle: z.string().min(1, "Requis"),
    missionContent: z.string().min(1, "Requis"),
    visionTitle: z.string().min(1, "Requis"),
    visionContent: z.string().min(1, "Requis"),
    valuesTitle: z.string().min(1, "Requis"),
    valuesContent: z.string().min(1, "Requis"),
    teamMembers: z.array(teamMemberSchema).optional(),
});

const legalPageSchema = z.object({
    title: z.string().min(1, "Requis"),
    lastUpdated: z.string().min(1, "Requis"),
    content: z.string().min(50, "Le contenu doit comporter au moins 50 caractères."),
})

export const defaultAboutValues: z.infer<typeof aboutPageSchema> = {
    aboutTitle: "À propos de Yahnu",
    aboutSubtitle: "Nous sommes en mission pour combler le fossé entre l'éducation et l'emploi, créant un écosystème prospère pour que les talents se connectent aux opportunités.",
    storyTitle: "Notre Histoire",
    storyContent1: "<p>Fondée par une équipe d'éducateurs et d'entrepreneurs, Yahnu est née d'une vision commune : libérer l'immense potentiel des diplômés en les connectant directement aux industries qui ont besoin de leurs compétences.</p>",
    storyContent2: "<p>Aujourd'hui, Yahnu est une plateforme dynamique qui permet aux étudiants de lancer leur carrière, aide les entreprises à trouver efficacement les bons talents et permet aux écoles de forger des partenariats industriels significatifs. Nous croyons en la construction d'avenirs, une connexion à la fois.</p>",
    missionTitle: "Notre Mission",
    missionContent: "<p>Autonomiser les diplômés, les entreprises et les écoles en créant un écosystème transparent et efficace pour le développement des talents et la croissance de carrière.</p>",
    visionTitle: "Notre Vision",
    visionContent: "<p>Être la plateforme leader pour la connexion professionnelle et les opportunités en Afrique, stimulant la croissance économique et la réussite individuelle.</p>",
    valuesTitle: "Nos Valeurs",
    valuesContent: "<p>Intégrité, Innovation, Collaboration et un engagement inébranlable envers le succès de nos utilisateurs.</p>",
    teamMembers: [
        { name: "Colombe Koffi", role: "Fondatrice & CEO", imageUrl: "/images/Colombe Koffi.jpeg" },
        { name: "Joël K", role: "Chef de Produit", imageUrl: "/images/Joel K.jpeg" },
        { name: "Bethel Touman", role: "Ingénieur de Données", imageUrl: "/images/Bethel_Touman.jpeg" },
    ]
}

export const defaultPrivacyPolicy: z.infer<typeof legalPageSchema> = {
    title: "Politique de confidentialité",
    lastUpdated: "15 janvier 2025",
    content: `<p>Cette Politique de Confidentialité décrit Nos politiques et procédures sur la collecte, l'utilisation et la divulgation de Vos informations lorsque Vous utilisez le Service et Vous informe sur Vos droits à la vie privée et comment la loi Vous protège.</p><h2>Interprétation et Définitions</h2><h3>Interprétation</h3><p>Les mots dont la lettre initiale est en majuscule ont des significations définies dans les conditions suivantes. Les définitions suivantes auront la même signification qu'elles apparaissent au singulier ou au pluriel.</p><h3>Définitions</h3><p>Aux fins de la présente Politique de Confidentialité :</p><ul><li><strong>Compte</strong> signifie un compte unique créé pour Vous permettre d'accéder à notre Service ou à des parties de notre Service.</li><li><strong>Société</strong> (désignée comme "la Société", "Nous", "Notre" ou "Nos" dans le présent Contrat) se réfère à Yahnu.</li><li><strong>Cookies</strong> sont de petits fichiers qui sont placés sur Votre ordinateur, appareil mobile ou tout autre appareil par un site web, contenant les détails de Votre historique de navigation sur ce site web parmi ses nombreuses utilisations.</li><li><strong>Pays</strong> se réfère à : Côte d'Ivoire</li><li><strong>Appareil</strong> signifie tout appareil pouvant accéder au Service tel qu'un ordinateur, un téléphone portable ou une tablette numérique.</li><li><strong>Données Personnelles</strong> sont toutes les informations qui se rapportent à un individu identifié ou identifiable.</li><li><strong>Service</strong> se réfère au Site Web.</li><li><strong>Données d'Utilisation</strong> se réfèrent aux données collectées automatiquement, soit générées par l'utilisation du Service, soit à partir de l'infrastructure du Service elle-même (par exemple, la durée d'une visite de page).</li><li><strong>Vous</strong> signifie la personne accédant ou utilisant le Service, ou la société, ou toute autre entité juridique au nom de laquelle cette personne accède ou utilise le Service, selon le cas.</li></ul><h2>Collecte et Utilisation de Vos Données Personnelles</h2><h3>Types de Données Collectées</h3><h4>Données Personnelles</h4><p>Lors de l'utilisation de Notre Service, Nous pouvons Vous demander de Nous fournir certaines informations personnelles identifiables qui peuvent être utilisées pour Vous contacter ou Vous identifier. Les informations personnelles identifiables peuvent inclure, mais ne sont pas limitées à :</p><ul><li>Adresse e-mail</li><li>Prénom et nom</li><li>Numéro de téléphone</li><li>Données d'Utilisation</li></ul><h2>Utilisation de Vos Données Personnelles</h2><p>La Société peut utiliser les Données Personnelles aux fins suivantes :</p><ul><li>Pour fournir et maintenir notre Service, y compris pour surveiller l'utilisation de notre Service.</li><li>Pour gérer Votre Compte : pour gérer Votre inscription en tant qu'utilisateur du Service. Les Données Personnelles que Vous fournissez peuvent Vous donner accès à différentes fonctionnalités du Service qui sont disponibles pour Vous en tant qu'utilisateur enregistré.</li></ul><h2>Modifications de cette Politique de Confidentialité</h2><p>Nous pouvons mettre à jour Notre Politique de Confidentialité de temps à autre. Nous Vous informerons de tout changement en publiant la nouvelle Politique de Confidentialité sur cette page.</p><p>Nous Vous informerons par e-mail et/ou par un avis visible sur Notre Service, avant que le changement ne devienne effectif et mettrons à jour la date de "Dernière mise à jour" en haut de cette Politique de Confidentialité.</p><p>Il Vous est conseillé de consulter périodiquement cette Politique de Confidentialité pour tout changement. Les changements à cette Politique de Confidentialité sont effectifs lorsqu'ils sont publiés sur cette page.</p><h2>Contactez-nous</h2><p>Si vous avez des questions sur cette Politique de Confidentialité, Vous pouvez nous contacter :</p><ul><li>Par email: <strong>contact@yahnu.org</strong></li></ul>`
};

export const defaultTerms: z.infer<typeof legalPageSchema> = {
    title: "Conditions d'utilisation",
    lastUpdated: "15 janvier 2025",
    content: `<p>Veuillez lire attentivement ces termes et conditions avant d'utiliser Notre Service.</p><h2>Interprétation et Définitions</h2><h3>Interprétation</h3><p>Les mots dont la lettre initiale est en majuscule ont des significations définies dans les conditions suivantes. Les définitions suivantes auront la même signification qu'elles apparaissent au singulier ou au pluriel.</p><h3>Définitions</h3><p>Aux fins de ces Termes et Conditions :</p><ul><li><strong>Pays</strong> se réfère à : Côte d'Ivoire</li><li><strong>Société</strong> (désignée comme "la Société", "Nous", "Notre" ou "Nos" dans le présent Contrat) se réfère à Yahnu.</li><li><strong>Appareil</strong> signifie tout appareil pouvant accéder au Service tel qu'un ordinateur, un téléphone portable ou une tablette numérique.</li><li><strong>Service</strong> se réfère au Site Web.</li><li><strong>Termes et Conditions</strong> (également appelés "Termes") signifient ces Termes et Conditions qui forment l'intégralité de l'accord entre Vous et la Société concernant l'utilisation du Service.</li><li><strong>Vous</strong> signifie la personne accédant ou utilisant le Service, ou la société, ou toute autre entité juridique au nom de laquelle cette personne accède ou utilise le Service, selon le cas.</li></ul><h2>Reconnaissance</h2><p>Ce sont les Termes et Conditions régissant l'utilisation de ce Service et l'accord qui opère entre Vous et la Société. Ces Termes et Conditions énoncent les droits et obligations de tous les utilisateurs concernant l'utilisation du Service.</p><p>Votre accès et votre utilisation du Service sont conditionnés à Votre acceptation et à Votre conformité avec ces Termes et Conditions. Ces Termes et Conditions s'appliquent à tous les visiteurs, utilisateurs et autres personnes qui accèdent ou utilisent le Service.</p><h2>Comptes d'Utilisateur</h2><p>Lorsque Vous créez un compte avec Nous, Vous devez Nous fournir des informations exactes, complètes et à jour en tout temps. Le non-respect de cette obligation constitue une violation des Termes, ce qui peut entraîner la résiliation immédiate de Votre compte sur Notre Service.</p><h2>Résiliation</h2><p>Nous pouvons résilier ou suspendre Votre Compte immédiatement, sans préavis ni responsabilité, pour quelque raison que ce soit, y compris, sans limitation, si Vous enfreignez ces Termes et Conditions.</p><h2>Modifications de ces Termes et Conditions</h2><p>Nous nous réservons le droit, à Notre seule discrétion, de modifier ou de remplacer ces Termes à tout moment. Si une révision est importante, Nous ferons des efforts raisonnables pour fournir un préavis d'au moins 30 jours avant que les nouvelles conditions n'entrent en vigueur. Ce qui constitue un changement important sera déterminé à Notre seule discrétion.</p><h2>Contactez-nous</h2><p>Si vous avez des questions sur ces Termes et Conditions, Vous pouvez nous contacter :</p><ul><li>Par email: <strong>contact@yahnu.org</strong></li></ul>`
};

// --- Helper Component ---

const PageFormWrapper = ({ pageId, schema, defaultValues, pageName, children }: { pageId: string, schema: any, defaultValues: any, pageName: string, children: (form: any, isSaving: boolean) => React.ReactNode }) => {
    const { toast } = useToast();
    const { user } = useAuth();
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
                const docRef = doc(db, "pages", pageId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
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
            const docRef = doc(db, "pages", pageId);
            await setDoc(docRef, values, { merge: true });
            
            // Create notification
            await addDoc(collection(db, "notifications"), {
                recipientRole: 'content_manager',
                text: `La page "${pageName}" a été mise à jour par ${user?.name || 'un administrateur'}.`,
                link: '/dashboard/content/static-pages',
                type: 'static_page',
                createdAt: serverTimestamp(),
                createdBy: user?.uid,
            });

            toast({
                title: "Contenu mis à jour",
                description: "Le contenu de la page a été enregistré.",
            });
        } catch (error) {
            console.error("Failed to save content:", error);
            toast({ title: "Erreur", description: "La sauvegarde du contenu de la page a échoué.", variant: "destructive" });
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
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "teamMembers"
    });
    
    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Section Héro</h3>
                <FormField control={form.control} name="aboutTitle" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aboutSubtitle" render={({ field }) => (<FormItem><FormLabel>Sous-titre</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Section Histoire</h3>
                <FormField control={form.control} name="storyTitle" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent1" render={({ field }) => (<FormItem><FormLabel>Paragraphe de contenu 1</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent2" render={({ field }) => (<FormItem><FormLabel>Paragraphe de contenu 2</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">Mission, Vision & Valeurs</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">Carte Mission</h4>
                        <FormField control={form.control} name="missionTitle" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="missionContent" render={({ field }) => (<FormItem><FormLabel>Contenu</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">Carte Vision</h4>
                        <FormField control={form.control} name="visionTitle" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="visionContent" render={({ field }) => (<FormItem><FormLabel>Contenu</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">Carte Valeurs</h4>
                        <FormField control={form.control} name="valuesTitle" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="valuesContent" render={({ field }) => (<FormItem><FormLabel>Contenu</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
             </div>
             <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Section "Rencontrez l'équipe"</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', role: '', imageUrl: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Ajouter un membre
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg relative space-y-4 bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`teamMembers.${index}.name`} render={({ field }) => (<FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`teamMembers.${index}.role`} render={({ field }) => (<FormItem><FormLabel>Rôle</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`teamMembers.${index}.imageUrl`} render={({ field }) => (<FormItem><FormLabel>URL de l'image</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
             </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer la page "À propos"
                </Button>
            </div>
        </div>
    )
}

const LegalPageForm = ({ form, isSaving, pageName }: { form: UseFormReturn<z.infer<typeof legalPageSchema>>, isSaving: boolean, pageName: string }) => {
    return (
        <div className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lastUpdated" render={({ field }) => (<FormItem><FormLabel>Date de dernière mise à jour</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Contenu</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
             <div className="flex justify-end">
                 <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Enregistrer {pageName}
                </Button>
            </div>
        </div>
    )
}

// --- Main Component ---

export function ContentPagesEditor() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contenu des pages statiques</CardTitle>
                <CardDescription>Modifiez le contenu affiché sur diverses pages publiques du site.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="about-us">
                    <TabsList>
                        <TabsTrigger value="about-us">À propos de nous</TabsTrigger>
                        <TabsTrigger value="privacy-policy">Politique de confidentialité</TabsTrigger>
                        <TabsTrigger value="terms-of-service">Conditions d'utilisation</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about-us" className="pt-6">
                        <PageFormWrapper pageId="about-us" schema={aboutPageSchema} defaultValues={defaultAboutValues} pageName="À Propos">
                             {(form, isSaving) => <AboutUsForm form={form} isSaving={isSaving} />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="privacy-policy" className="pt-6">
                        <PageFormWrapper pageId="privacy-policy" schema={legalPageSchema} defaultValues={defaultPrivacyPolicy} pageName="Politique de Confidentialité">
                            {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName="la politique de confidentialité" />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="terms-of-service" className="pt-6">
                        <PageFormWrapper pageId="terms-of-service" schema={legalPageSchema} defaultValues={defaultTerms} pageName="Conditions d'Utilisation">
                             {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName="les conditions d'utilisation" />}
                        </PageFormWrapper>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}
