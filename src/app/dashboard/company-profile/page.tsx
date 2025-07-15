
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

const companyProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  website: z.string().url({ message: "Please enter a valid URL." }),
  location: z.string().min(2, { message: "Location is required." }),
  industry: z.string().min(1, "Industry sector is required."),
  phone: z.string().optional(),
  tagline: z.string().max(100).optional(),
  description: z.string().min(50, { message: "Description must be at least 50 characters." }),
})

const jobPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
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
    { title: "Software Engineer, Frontend", location: "Remote", type: "Full-time", description: "We are seeking a talented Frontend Software Engineer to join our team. The ideal candidate will have a passion for creating beautiful and functional user interfaces." },
    { title: "Product Manager", location: "New York, NY", type: "Full-time", description: "We are looking for an experienced Product Manager to lead the development of our new product line." },
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
      tagline: "Building the future of technology.",
      description: "Innovate Inc. is a leading technology firm dedicated to creating cutting-edge solutions that solve real-world problems. We are a team of passionate innovators, designers, and engineers committed to excellence.",
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
        title: t('Logo Selected'),
        description: `${file.name} ${t('is ready to be uploaded.')}`,
      });
    }
  }

  function onProfileSubmit(values: z.infer<typeof companyProfileSchema>) {
    console.log(values)
    toast({
      title: t('Company Profile Updated'),
      description: t("Your company's profile has been saved successfully."),
    })
  }

  function onJobSubmit(values: z.infer<typeof jobPostSchema>) {
    setJobs(prev => [...prev, values])
    toast({
      title: t('Job Posted'),
      description: `${t('The "')}${values.title}${t('" position has been added.')}`,
    })
    jobForm.reset()
    setIsJobDialogOpen(false)
  }

  function deleteJob(indexToDelete: number) {
    const jobToDelete = jobs[indexToDelete]
    setJobs(jobs.filter((_, index) => index !== indexToDelete))
    toast({
      title: t('Job Removed'),
      description: `${t('The "')}${jobToDelete.title}${t('" position has been removed.')}`,
      variant: "destructive"
    })
  }


  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Company Profile')}</h1>
        <p className="text-muted-foreground mt-1">{t('Showcase your company to attract top talent.')}</p>
      </div>
      
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('Company Details')}</CardTitle>
                <CardDescription>{t('Basic information about your organization.')}</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={profileForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Company Name')}</FormLabel>
                      <FormControl><Input placeholder={t("Your Company LLC")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Website')}</FormLabel>
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
                      <FormLabel>{t('Headquarters')}</FormLabel>
                      <FormControl><Input placeholder={t("City, State/Country")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Industry Sector')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select an industry')} />
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
                      <FormLabel>{t('Phone Number')}</FormLabel>
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
                      <FormLabel>{t('Tagline')}</FormLabel>
                      <FormControl><Input placeholder={t("A short, catchy phrase for your company.")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('About Your Company')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("Describe your company's mission, vision, and culture...")} rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit">{t('Save Changes')}</Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
             <Card>
                <CardHeader>
                    <CardTitle>{t('Company Logo')}</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center space-y-4">
                    <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                        <Image
                            src={logoPreview || "https://placehold.co/600x400.png"}
                            alt="Company logo preview"
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            className="object-cover"
                        />
                    </div>
                    <Button asChild variant="outline" className="w-full">
                        <label htmlFor="logo-upload">
                            <Upload className="mr-2 h-4 w-4" />
                            {t('Upload Logo')}
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
                    <CardTitle>{t('Job Postings')}</CardTitle>
                    <CardDescription>{t('Manage your open positions.')}</CardDescription>
                </div>
                <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" variant="outline">
                            <PlusCircle className="h-4 w-4"/>
                            <span className="sr-only">{t('Add new job')}</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-xl">
                        <Form {...jobForm}>
                            <form onSubmit={jobForm.handleSubmit(onJobSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>{t('Add New Job Posting')}</DialogTitle>
                                    <DialogDescription>
                                        {t('Fill in the details for the new position.')}
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <FormField
                                        control={jobForm.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('Job Title')}</FormLabel>
                                            <FormControl><Input placeholder={t("e.g. Software Engineer")} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={jobForm.control}
                                        name="location"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('Location')}</FormLabel>
                                            <FormControl><Input placeholder={t("e.g. New York, NY")} {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={jobForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>{t('Job Type')}</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                    <SelectValue placeholder={t('Select a job type')} />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Full-time">{t('Full-time')}</SelectItem>
                                                    <SelectItem value="Part-time">{t('Part-time')}</SelectItem>
                                                    <SelectItem value="Contract">{t('Contract')}</SelectItem>
                                                    <SelectItem value="Internship">{t('Internship')}</SelectItem>
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
                                                <FormLabel>{t('Job Description')}</FormLabel>
                                                <FormControl><Textarea rows={8} {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">{t('Post Job')}</Button>
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
                    <p className="text-sm text-muted-foreground text-center py-4">{t('No active job postings.')}</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
