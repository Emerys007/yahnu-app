
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useAuth, type EducationEntry } from "@/context/auth-context";
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, Circle, Loader2, PlusCircle, Trash2, User as UserIcon } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { TalentPreferencesPanel } from "@/components/dashboard/talent-preferences-panel"
import { SkillsAttestationsPanel } from "@/components/skills/skills-attestations-panel"

const educationSchema = z.object({
  degree: z.string().min(2, "Le diplôme est requis."),
  field: z.string().min(2, "Le domaine d’études est requis."),
  gradYear: z.string().min(4, "L’année d’obtention est requise."),
  verified: z.boolean().default(false),
})

const profileSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères." }),
  email: z.string().email("Saisissez une adresse e-mail valide."),
  phone: z.string().optional(),
  experience: z.string().optional(),
  education: z.array(educationSchema),
  skills: z.string().optional(),
})

export default function ProfilePage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const { user, loading, updateProfile } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      experience: "",
      education: [],
      skills: "",
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "education",
  });

  useEffect(() => {
    if (user) {
        form.reset({
            name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : ''),
            email: user.email || '',
            phone: user.phone || '',
            experience: user.experience || '',
            education: user.education || [],
            skills: Array.isArray(user.skills) ? user.skills.join(", ") : user.skills || '',
        });
    }
  }, [user, form]);

  const profileValues = form.watch()
  const completionItems = [
    {
      label: "Identité professionnelle",
      complete: profileValues.name.trim().length >= 2 && profileValues.email.includes("@"),
    },
    {
      label: "Coordonnées",
      complete: Boolean(profileValues.phone?.trim()),
    },
    {
      label: "Formation",
      complete: profileValues.education.some(
        (entry) => entry.degree.trim() && entry.field.trim() && entry.gradYear.trim(),
      ),
    },
    {
      label: "Expériences ou projets",
      complete: (profileValues.experience?.trim().length ?? 0) >= 80,
    },
    {
      label: "Au moins trois compétences",
      complete:
        (profileValues.skills
          ?.split(",")
          .map((skill) => skill.trim())
          .filter(Boolean).length ?? 0) >= 3,
    },
  ]
  const completedItems = completionItems.filter((item) => item.complete).length
  const completion = Math.round((completedItems / completionItems.length) * 100)

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: "Connexion requise", description: "Reconnectez-vous pour mettre votre profil à jour.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        const { name } = values;
        
        const [firstName, ...lastNameParts] = name.trim().split(/\s+/);
        const lastName = lastNameParts.join(' ');
        
        await updateProfile({
            phone: values.phone,
            experience: values.experience,
            education: values.education,
            skills: values.skills,
            name,
            firstName,
            lastName,
        });
        toast({
            title: "Profil mis à jour",
            description: "Votre profil professionnel a bien été enregistré.",
        });
    } catch (error) {
        console.error("Profile update failed:", error);
        toast({ title: "Enregistrement impossible", description: "Votre profil n’a pas été modifié. Réessayez dans un instant.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <UserIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Mon profil professionnel</h1>
                <p className="text-muted-foreground mt-1">Présentez votre parcours, vos compétences et votre projet avec des mots qui vous ressemblent.</p>
            </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>Ces informations servent à vous identifier auprès des recruteurs autorisés.</CardDescription>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Full Name')}</FormLabel>
                        <FormControl>
                          <Input placeholder="Aïcha Koné" autoComplete="name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Email Address')}</FormLabel>
                        <FormControl>
                          <Input placeholder="aicha.kone@email.ci" autoComplete="email" {...field} disabled />
                        </FormControl>
                        <p className="text-xs leading-5 text-muted-foreground">
                          L’adresse de connexion ne change pas avec un CV. Modifiez-la depuis les paramètres du compte.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                   <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Phone Number (Optional)')}</FormLabel>
                        <FormControl>
                          <Input placeholder="+225 07 00 00 00 00" autoComplete="tel" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <div>
                            <CardTitle>Formation</CardTitle>
                            <CardDescription>Ajoutez chaque diplôme séparément, du plus récent au plus ancien.</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ degree: '', field: '', gradYear: '', verified: false })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Ajouter un diplôme
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                     {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg relative space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <FormField
                                    control={form.control}
                                    name={`education.${index}.degree`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Diplôme</FormLabel>
                                            <FormControl><Input placeholder="Ex. Licence professionnelle" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`education.${index}.field`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Domaine d’études</FormLabel>
                                            <FormControl><Input placeholder="Ex. Génie logiciel" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`education.${index}.gradYear`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Année d’obtention</FormLabel>
                                            <FormControl><Input type="number" placeholder="Ex. 2026" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                             <Button
                                type="button"
                                variant="destructive"
                                size="icon"
                                className="absolute top-2 right-2 h-6 w-6"
                                onClick={() => remove(index)}
                                aria-label={`Supprimer le diplôme ${index + 1}`}
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">Aucune formation ajoutée pour le moment.</p>
                    )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Expériences et projets</CardTitle>
                  <CardDescription>Stages, missions, projets d’école ou engagements associatifs : tout ce qui montre votre savoir-faire compte.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="Ex. Stage de fin d’études à Cocody : création d’un tableau de bord de suivi…" rows={10} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
                <Card>
                <CardHeader>
                    <CardTitle>Compétences</CardTitle>
                    <CardDescription>Séparez vos compétences par une virgule pour faciliter la recherche.</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                        <FormItem>
                        <FormControl>
                            <Textarea placeholder="Ex. Excel, gestion de projet, relation client, SQL…" rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </CardContent>
                </Card>
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving} data-hs-event-name="profile_updated">
                  {isSaving ? "Enregistrement…" : "Enregistrer mon profil"}
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card className="border-primary/20 bg-primary/[0.035]">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <CardTitle className="text-lg">Force du profil</CardTitle>
                        <CardDescription className="mt-1">
                          Les profils précis sont plus faciles à comprendre pour un recruteur.
                        </CardDescription>
                      </div>
                      <span className="font-display text-2xl font-semibold text-primary">
                        {completion} %
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Progress
                      aria-label={`Profil complété à ${completion} %`}
                      value={completion}
                    />
                    <ul className="mt-5 space-y-3 text-sm">
                      {completionItems.map((item) => (
                        <li className="flex items-center gap-2.5" key={item.label}>
                          {item.complete ? (
                            <CheckCircle2
                              aria-hidden="true"
                              className="size-4 shrink-0 text-primary"
                            />
                          ) : (
                            <Circle
                              aria-hidden="true"
                              className="size-4 shrink-0 text-muted-foreground/60"
                            />
                          )}
                          <span className={item.complete ? "text-foreground" : "text-muted-foreground"}>
                            {item.label}
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-5 rounded-xl border border-border/70 bg-background/70 p-3 text-xs leading-5 text-muted-foreground">
                      Yahnu ne transmet pas votre profil au vivier d’entreprises sans votre consentement explicite ci-dessous.
                    </p>
                  </CardContent>
                </Card>
                <SkillsAttestationsPanel />
            </div>
        </form>
      </Form>
      <TalentPreferencesPanel />
    </div>
  )
}
