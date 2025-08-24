
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
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, PlusCircle, Trash2 } from "lucide-react"
import { PhoneNumberInput } from "@/components/ui/phone-number-input"
import { AddressAutocomplete } from "@/components/ui/address-autocomplete"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

const schoolProfileSchema = z.object({
  schoolName: z.string().min(2, { message: "Le nom de l'école doit comporter au moins 2 caractères." }),
  website: z.string().url({ message: "Veuillez entrer une URL valide." }),
  location: z.string().min(2, { message: "L'emplacement est requis." }),
  phone: z.string().optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string(),
  }).optional(),
  description: z.string().min(50, { message: "La description doit comporter au moins 50 caractères." }),
})

export default function SchoolProfilePage() {
  const { toast } = useToast()
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  const form = useForm<z.infer<typeof schoolProfileSchema>>({
    resolver: zodResolver(schoolProfileSchema),
    defaultValues: {
      schoolName: "Institut National Polytechnique Félix Houphouët-Boigny",
      website: "https://www.inphb.ci",
      location: "Yamoussoukro",
      phone: "",
      address: { street: "", city: "", state: "", zip: "", country: "" },
      description: "En tant qu'institution polytechnique de premier plan en Afrique de l'Ouest, nous nous engageons à l'excellence en ingénierie, technologie et sciences appliquées. Nos liens étroits avec l'industrie et notre accent sur l'innovation préparent nos diplômés à devenir des leaders dans leurs domaines.",
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

  function onSubmit(values: z.infer<typeof schoolProfileSchema>) {
    console.log(values)
    toast({
      title: "Profil de l'école mis à jour",
      description: "Le profil de votre école a été enregistré avec succès.",
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profil de l'école</h1>
        <p className="text-muted-foreground mt-1">Gérez les informations publiques de votre établissement.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Détails de l'établissement</CardTitle>
                <CardDescription>Informations de base sur votre école.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="schoolName"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Nom de l'école</FormLabel>
                      <FormControl><Input placeholder={"Votre Université"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Site Web</FormLabel>
                      <FormControl><Input placeholder="https://votreuniversite.edu" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Emplacement du campus principal</FormLabel>
                      <FormControl><Input placeholder={"Ville, Pays"} {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
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
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>À propos de votre école</FormLabel>
                      <FormControl>
                        <RichTextEditor placeholder={"Décrivez l'histoire, la mission et les points forts de votre école..."} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Adresse de l'école</CardTitle>
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

            <div className="flex justify-end">
              <Button type="submit">Enregistrer les modifications</Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Logo de l'école</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-4">
                <div className="w-full h-48 relative rounded-lg overflow-hidden border">
                  <Image
                    src={logoPreview || "https://placehold.co/600x400.png"}
                    alt="Aperçu du logo de l'école"
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-4"
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
          </div>
        </form>
      </Form>
    </div>
  )
}
