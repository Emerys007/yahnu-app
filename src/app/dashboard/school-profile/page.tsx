
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

const schoolProfileSchema = z.object({
  schoolName: z.string().min(2, { message: "School name must be at least 2 characters." }),
  website: z.string().url({ message: "Please enter a valid URL." }),
  location: z.string().min(2, { message: "Location is required." }),
  phone: z.string().optional(),
  description: z.string().min(50, { message: "Description must be at least 50 characters." }),
})

export default function SchoolProfilePage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof schoolProfileSchema>>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: {
      schoolName: "Institut National Polytechnique Félix Houphouët-Boigny",
      website: "https://www.inphb.ci",
      location: "Yamoussoukro",
      phone: "",
      description: "As a leading polytechnic institution in West Africa, we are committed to excellence in engineering, technology, and applied sciences. Our strong industry ties and focus on innovation prepare our graduates to become leaders in their fields.",
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

  function onSubmit(values: z.infer<typeof schoolProfileSchema>) {
    console.log(values)
    toast({
      title: t('School Profile Updated'),
      description: t("Your school's profile has been saved successfully."),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('School Profile')}</h1>
        <p className="text-muted-foreground mt-1">{t('Manage your institution\'s public information.')}</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>{t('Institution Details')}</CardTitle>
                <CardDescription>{t('Basic information about your school.')}</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('School Name')}</FormLabel>
                      <FormControl><Input placeholder={t("Your University")} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Website')}</FormLabel>
                      <FormControl><Input placeholder="https://youruniversity.edu" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Main Campus Location')}</FormLabel>
                      <FormControl><Input placeholder={t("City, Country")} {...field} /></FormControl>
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
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>{t('About Your School')}</FormLabel>
                      <FormControl>
                        <Textarea placeholder={t("Describe your school's history, mission, and strengths...")} rows={8} {...field} />
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
                <CardTitle>{t('School Logo')}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                  <Image
                    src={logoPreview || "https://placehold.co/600x400.png"}
                    alt="School logo preview"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-4"
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
          </div>
        </form>
      </Form>
    </div>
  )
}
