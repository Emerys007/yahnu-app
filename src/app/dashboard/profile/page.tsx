
"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
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
import { Upload, PlusCircle, Trash2 } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { PhoneNumberInput } from "@/components/ui/phone-number-input"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }).optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
})

export default function ProfilePage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [isParsing, setIsParsing] = useState(false)

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: {
        street: "",
        city: "",
        state: "",
        zip: "",
        country: "",
      },
      experience: "",
      education: "",
      skills: "",
    },
  })

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

    setIsParsing(true)
    toast({
      title: t('Parsing Resume...'),
      description: t('Our AI is analyzing your resume. This may take a moment.'),
    })

    try {
      const resumeDataUri = await fileToDataURI(file)
      const result: ParseResumeOutput = await parseResume({ resumeDataUri })
      
      form.setValue("name", result.name || "")
      form.setValue("email", result.email || "")
      form.setValue("phone", result.phone || "")
      form.setValue("experience", result.experience?.join("\n\n") || "")
      form.setValue("education", result.education?.join("\n") || "")
      form.setValue("skills", result.skills?.join(", ") || "")

      toast({
        title: t('Success!'),
        description: t('Your profile has been pre-filled from your resume.'),
        variant: "default",
      })
    } catch (error) {
      console.error("Resume parsing failed:", error)
      toast({
        title: t('Uh oh! Something went wrong.'),
        description: t('There was a problem with parsing your resume.'),
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }

  function onSubmit(values: z.infer<typeof profileSchema>) {
    console.log(values)
    toast({
      title: t('Profile Updated'),
      description: t('Your professional profile has been saved successfully.'),
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Professional Profile')}</h1>
            <p className="text-muted-foreground mt-1">{t('Build and maintain your professional identity.')}</p>
        </div>
        <div className="relative">
            <Button disabled={isParsing}>
                <Upload className="mr-2 h-4 w-4" />
                {isParsing ? t("Parsing...") : t("Upload Resume")}
            </Button>
            <input
                type="file"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                onChange={handleResumeUpload}
                accept=".pdf,.doc,.docx"
                disabled={isParsing}
            />
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>{t('Personal Information')}</CardTitle>
              <CardDescription>{t('This information will be visible on your public profile.')}</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Full Name')}</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
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
                      <Input placeholder="you@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
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
            </CardContent>
          </Card>

           <Card>
                <CardHeader>
                    <CardTitle>{t('Address')}</CardTitle>
                    <CardDescription>{t('Your primary address.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <FormField
                        control={form.control}
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

          <Card>
            <CardHeader>
              <CardTitle>{t('Work Experience')}</CardTitle>
              <CardDescription>{t('Detail your professional journey.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder={t("Describe your work experience...")} rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>{t('Education')}</CardTitle>
                  <CardDescription>{t('Your academic background.')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder={t("List your degrees and schools...")} rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>{t('Skills')}</CardTitle>
                  <CardDescription>{t('Your key competencies.')}</CardDescription>
                </CardHeader>
                <CardContent>
                   <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder={t("e.g., JavaScript, Product Management, ...")} rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit">{t('Save Profile')}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
