

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
import { Textarea } from "@/components/ui/textarea"
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
import { useLocalization } from "@/context/localization-context"
import { PhoneNumberInput } from "@/components/ui/phone-number-input"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"

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
  const { t } = useLocalization();
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
        title: t('profile.logo_selected_title'),
        description: `${file.name} ${t('profile.logo_selected_desc')}`,
      });
    }
  }

  function onProfileSubmit(values: z.infer<typeof companyProfileSchema>) {
    console.log(values)
    toast({
      title: t('profile.company_profile_updated_title'),
      description: t("profile.company_profile_updated_desc"),
    })
  }

  function onJobSubmit(values: z.infer<typeof jobPostSchema>) {
    setJobs(prev => [...prev, values])
    toast({
      title: t('profile.job_posted_title'),
      description: `${t('profile.job_posted_desc_start')}${values.title}${t('profile.job_posted_desc_end')}`,
    })
    jobForm.reset()
    setIsJobDialogOpen(false)
  }

  function deleteJob(indexToDelete: number) {
    const jobToDelete = jobs[indexToDelete]
    setJobs(jobs.filter((_, index) => index !== indexToDelete))
    toast({
      title: t('profile.job_removed_title'),
      description: `${t('profile.job_removed_desc_start')}${jobToDelete.title}${t('profile.job_removed_desc_end')}`,
      variant: "destructive"
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('profile.company_profile_title')}</h1>
        <p className="text-muted-foreground mt-1">{t('profile.company_profile_desc')}</p>
      </div>
      
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('profile.company_details_title')}</CardTitle>
                <CardDescription>{t('profile.company_details_desc')}</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={profileForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('common.company_name')}</FormLabel>
                      <FormControl><Input placeholder={t("profile.company_name_placeholder")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.website')}</FormLabel>
                      <FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('profile.headquarters')}</FormLabel>
                      <FormControl><Input placeholder={t("common.city_state_remote")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('common.industry_sector')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('common.select_an_industry')} />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {industrySectors.map(sector => (
                                <SelectItem key={sector} value={sector}>{t(sector)}</SelectItem>
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
                      <FormLabel>{t('profile.phone')}</FormLabel>
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
                      <FormLabel>{t('profile.tagline')}</FormLabel>
                      <FormControl><Input placeholder={t("profile.tagline_placeholder")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('profile.about_company')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("profile.about_company_placeholder")} rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>{t('profile.company_address')}</CardTitle>
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
              <Button type="submit">{t('common.save_changes')}</Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>{t('profile.company_logo')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                        <Image
                            src={logoPreview || "https://placehold.co/600x400.png"}
                            alt="Aperçu du logo de l'entreprise"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-contain"
                        />
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <label htmlFor="logo-upload">
                            <Upload className="mr-2 h-4 w-4" />
                            {t('profile.upload_logo')}
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
                    <CardTitle>{t('profile.job_postings')}</CardTitle>
                    <CardDescription>{t('profile.job_postings_desc')}</CardDescription>
                </div>
                <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" variant="outline">
                            <PlusCircle className="h-4 w-4"/>
                            <span className="sr-only">{t('profile.add_new_job')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <Form {...jobForm}>
                            <form onSubmit={jobForm.handleSubmit(onJobSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{t('profile.add_job_posting_title')}</DialogTitle>
                                    <DialogDescription>
                                        {t('profile.add_job_posting_desc')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <FormField
                                        control={jobForm.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('common.job_title')}</FormLabel>
                                            <FormControl><Input placeholder={t("profile.job_title_placeholder")} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={jobForm.control}
                                        name="location"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('common.location')}</FormLabel>
                                            <FormControl><Input placeholder={t("profile.location_placeholder")} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={jobForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('common.job_type')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                    <SelectValue placeholder={t('profile.select_job_type')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Full-time">{t('common.full_time')}</SelectItem>
                                                    <SelectItem value="Part-time">{t('common.part_time')}</SelectItem>
                                                    <SelectItem value="Contract">{t('common.contract')}</SelectItem>
                                                    <SelectItem value="Internship">{t('common.internship')}</SelectItem>
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
                                                <FormLabel>{t('common.job_description')}</FormLabel>
                                                <FormControl><Textarea rows={8} {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{t('common.post_job')}</Button>
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
                          <p className="text-sm text-muted-foreground">{job.location} &middot; {t(job.type)}</p>
                      </div>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => deleteJob(index)}>
                          <Trash2 className="h-4 w-4 text-destructive"/>
                      </Button>
                  </div>
                ))}
                {jobs.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('profile.no_active_jobs')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
