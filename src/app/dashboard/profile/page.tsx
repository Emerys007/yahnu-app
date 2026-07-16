
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { useAuth, type EducationEntry } from "@/context/auth-context";
import { parseResume, type ParseResumeOutput } from "@/ai/flows/resume-parser"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Loader2, PlusCircle, Trash2, Award, User as UserIcon } from "lucide-react"
import { useLocalization } from "@/context/localization-context"

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

const MAX_RESUME_SIZE_BYTES = 4 * 1024 * 1024

export default function ProfilePage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const { user, loading, updateProfile } = useAuth();
  const [isParsing, setIsParsing] = useState(false)
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

  function fileToDataURI(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== "application/pdf") {
      toast({
        title: "Format PDF requis",
        description: "Ajoutez votre CV au format PDF.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    if (file.size > MAX_RESUME_SIZE_BYTES) {
      toast({
        title: "CV trop volumineux",
        description: "Choisissez un fichier PDF de moins de 4 Mo.",
        variant: "destructive",
      })
      event.target.value = ""
      return
    }

    setIsParsing(true)
    toast({
      title: "Lecture du CV en cours…",
      description: "Yahnu analyse le document pour préremplir votre profil. Cela peut prendre un instant.",
    })

    try {
      const resumeDataUri = await fileToDataURI(file)
      const result: ParseResumeOutput = await parseResume({ resumeDataUri })
      
      form.setValue("name", result.name || "")
      form.setValue("phone", result.phone || "")
      form.setValue("experience", result.experience?.join("\n\n") || "")
      if (result.education && result.education.length > 0) {
        const firstEdu = result.education[0];
        const [degree, field] = firstEdu.split(',').map(s => s.trim());
        const gradYearMatch = firstEdu.match(/\d{4}/);
        
        if (fields.length > 0) {
            remove(0);
        }
        append({ degree: degree || "", field: field || "", gradYear: gradYearMatch ? gradYearMatch[0] : "", verified: false });

      }
      form.setValue("skills", result.skills?.join(", ") || "")

      toast({
        title: "Profil prérempli",
        description: "Relisez les informations extraites de votre CV avant de les enregistrer.",
        variant: "default",
      })
    } catch (error) {
      console.error("Resume parsing failed:", error)
      toast({
        title: "Le CV n’a pas pu être lu",
        description: "Vérifiez le fichier puis réessayez, ou complétez le profil manuellement.",
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }

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
        <div className="relative shrink-0 w-full sm:w-auto">
            <Button disabled={isParsing} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isParsing ? "Lecture en cours…" : "Importer mon CV"}
            </Button>
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleResumeUpload}
                accept="application/pdf,.pdf"
                disabled={isParsing}
                aria-label="Importer un CV au format PDF"
            />
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
                <Button type="submit" disabled={isSaving || isParsing} data-hs-event-name="profile_updated">
                  {isSaving ? "Enregistrement…" : "Enregistrer mon profil"}
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award /> Certifications et badges</CardTitle>
                        <CardDescription>Les badges vérifiés associés à votre compte apparaîtront ici.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border border-dashed bg-muted/20 p-5 text-center">
                            <Award className="mx-auto h-7 w-7 text-muted-foreground" />
                            <p className="mt-3 text-sm font-medium">Aucun badge vérifié à afficher</p>
                            <p className="mt-1 text-sm text-muted-foreground">Cette section n’affichera que des badges réellement enregistrés sur votre compte.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </form>
      </Form>
    </div>
  )
}
