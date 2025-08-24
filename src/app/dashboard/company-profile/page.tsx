
"use client"

import { useState } from "react"
import Image from "next/image"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, PlusCircle, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PhoneNumberInput } from "@/components/ui/phone-number-input"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

const companyProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Le nom de l'entreprise doit comporter au moins 2 caractères." }),
  website: z.string().url({ message: "Veuillez entrer une URL valide." }),
  location: z.string().min(2, { message: "L'emplacement est requis." }),
  industry: z.string().min(1, "Le secteur d'activité est requis."),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }).optional(),
  tagline: z.string().max(100).optional(),
  description: z.string().min(50, { message: "La description doit comporter au moins 50 caractères." }),
})

const jobPostSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  location: z.string().min(1, "L'emplacement est requis"),
  type: z.string().min(1, "Le type est requis"),
  description: z.string().optional(),
})

const industrySectors = [
    "Agriculture",
    "Finance & Banking",
    "Information Technology",
    "Telecommunications",
    "Mining & Resources",
    "Construction & Real Estate",
    "Retail & Commerce",
    "Transportation & Logistics",
    "Tourism & Hospitality",
    "Health & Pharmaceuticals",
    "Education",
    "Energy"
]

export default function CompanyProfilePage() {
  const { toast } = useToast()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [jobs, setJobs] = useState<z.infer<typeof jobPostSchema>[]>([
    { title: "Ingénieur Logiciel, Frontend", location: "Télétravail", type: "Temps-plein", description: "Nous recherchons un ingénieur logiciel talentueux pour rejoindre notre équipe. Le candidat idéal aura une passion pour la création d'interfaces utilisateur belles et fonctionnelles." },
    { title: "Chef de Produit", location: "New York, NY", type: "Temps-plein", description: "Nous recherchons un chef de produit expérimenté pour diriger le développement de notre nouvelle ligne de produits." },
  ])
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)

  const profileForm = useForm<z.infer<typeof companyProfileSchema>>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: "Innovate Inc.",
      website: "https://innovate.inc",
      location: "New York, NY",
      industry: "Information Technology",
      phone: "",
      address: { street: "", city: "", state: "", zip: "", country: "" },
      tagline: "Construire l'avenir de la technologie.",
      description: "Innovate Inc. est une entreprise technologique de premier plan dédiée à la création de solutions de pointe qui résolvent des problèmes du monde réel. Nous sommes une équipe d'innovateurs, de designers et d'ingénieurs passionnés et engagés envers l'excellence.",
    },
  })

  const jobForm = useForm<z.infer<typeof jobPostSchema>>({
    resolver: zodResolver(jobPostSchema),
    defaultValues: {
      title: "",
      location: "",
      type: "",
      description: "",
    },
  })
  
  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string)
      };
      reader.readAsDataURL(file);
      toast({
        title: 'Logo sélectionné',
        description: `${file.name} est prêt à être téléversé.`,
      });
    }
  }

  function onProfileSubmit(values: z.infer<typeof companyProfileSchema>) {
    console.log(values)
    toast({
      title: 'Profil d\'entreprise mis à jour',
      description: "Le profil de votre entreprise a été enregistré avec succès.",
    })
  }

  function onJobSubmit(values: z.infer<typeof jobPostSchema>) {
    setJobs(prev => [...prev, values])
    toast({
      title: 'Offre d\'emploi publiée',
      description: `Le poste de "${values.title}" a été ajouté.`,
    })
    jobForm.reset()
    setIsJobDialogOpen(false)
  }

  function deleteJob(indexToDelete: number) {
    const jobToDelete = jobs[indexToDelete]
    setJobs(jobs.filter((_, index) => index !== indexToDelete))
    toast({
      title: 'Offre d\'emploi supprimée',
      description: `Le poste de "${jobToDelete.title}" a été supprimé.`,
      variant: "destructive"
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil de l'entreprise</h1>
        <p className="text-muted-foreground mt-1">Mettez en valeur votre entreprise pour attirer les meilleurs talents.</p>
      </div>
      
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Détails de l'entreprise</CardTitle>
                <CardDescription>Informations de base sur votre organisation.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={profileForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom de l'entreprise</FormLabel>
                      <FormControl><Input placeholder={"Votre Entreprise SARL"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Web</FormLabel>
                      <FormControl><Input placeholder="https://votresociete.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Siège social</FormLabel>
                      <FormControl><Input placeholder={"Ville, État/Pays"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>Secteur d'activité</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={'Sélectionnez un secteur'} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {industrySectors.map(sector => (
                                <SelectItem key={sector} value={sector}>{sector}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro de téléphone</FormLabel>
                      <FormControl>
                        <PhoneNumberInput {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Slogan</FormLabel>
                      <FormControl><Input placeholder={"Une phrase courte et accrocheuse pour votre entreprise."} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>À propos de votre entreprise</FormLabel>
                      <FormControl>
                        <RichTextEditor placeholder={"Décrivez la mission, la vision et la culture de votre entreprise..."} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Adresse de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={profileForm.control}
                        name="address"
                        render={({ field }) => (
                            <FormItem>
                                <FormControl>
                                    <AddressAutocomplete 
                                        value={field.value || { street: "", city: "", state: "", zip: "", country: "" }} 
                                        onChange={field.onChange} 
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit">Enregistrer les modifications</Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>Logo de l'entreprise</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                        <Image
                            src={logoPreview || "https://placehold.co/600x400.png"}
                            alt="Aperçu du logo de l'entreprise"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                        />
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <label htmlFor="logo-upload">
                            <Upload className="mr-2 h-4 w-4" />
                            Téléverser le logo
                        </label>
                    </Button>
                    <input
                        id="logo-upload"
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleLogoUpload}
                    />
                </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Offres d'emploi</CardTitle>
                    <CardDescription>Gérez vos postes ouverts.</CardDescription>
                </div>
                <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" variant="outline">
                            <PlusCircle className="h-4 w-4"/>
                            <span className="sr-only">Ajouter une nouvelle offre</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <Form {...jobForm}>
                            <form onSubmit={jobForm.handleSubmit(onJobSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>Ajouter une nouvelle offre d'emploi</DialogTitle>
                                    <DialogDescription>
                                        Remplissez les détails pour le nouveau poste.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <FormField
                                        control={jobForm.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Titre du poste</FormLabel>
                                            <FormControl><Input placeholder={"Ex: Ingénieur Logiciel"} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={jobForm.control}
                                        name="location"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Lieu</FormLabel>
                                            <FormControl><Input placeholder={"Ex: New York, NY"} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={jobForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Type de poste</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                    <SelectValue placeholder={'Sélectionnez un type de poste'} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Full-time">Temps plein</SelectItem>
                                                    <SelectItem value="Part-time">Temps partiel</SelectItem>
                                                    <SelectItem value="Contract">Contrat</SelectItem>
                                                    <SelectItem value="Internship">Stage</SelectItem>
                                                </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={jobForm.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Description du poste</FormLabel>
                                                <FormControl><RichTextEditor {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Publier l'offre</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobs.map((job, index) => (
                  <div key={index} className="flex items-start justify-between p-3 rounded-lg border bg-background">
                      <div>
                          <p className="font-semibold">{job.title}</p>
                          <p className="text-sm text-muted-foreground">{job.location} &middot; {job.type}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteJob(index)}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                  </div>
                ))}
                {jobs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Aucune offre d'emploi active.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
