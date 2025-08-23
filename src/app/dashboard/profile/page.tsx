
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useFieldArray } from "react-hook-form"
import { z } from "zod"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
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
import { Upload, Loader2, PlusCircle, Trash2, Award, Eye, EyeOff, User as UserIcon } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { useLocalization } from "@/context/localization-context"

const educationSchema = z.object({
  degree: z.string().min(2, "Degree is required."),
  field: z.string().min(2, "Field of study is required."),
  gradYear: z.string().min(4, "Graduation year is required."),
  verified: z.boolean().default(false),
})

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  phone: z.string().optional(),
  experience: z.string().optional(),
  education: z.array(educationSchema),
  skills: z.string().optional(),
})

// Mock data for badges
const earnedBadges = [
    { id: 'frontend-basics', name: "Frontend Development (React)", visible: true },
    { id: 'financial-analysis', name: "Financial Analysis", visible: false },
]

export default function ProfilePage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const { user, loading } = useAuth();
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false);
  const [badges, setBadges] = useState(earnedBadges);

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

    setIsParsing(true)
    toast({
      title: "Parsing Resume...",
      description: "Our AI is analyzing your resume. This may take a moment.",
    })

    try {
      const resumeDataUri = await fileToDataURI(file)
      const result: ParseResumeOutput = await parseResume({ resumeDataUri })
      
      form.setValue("name", result.name || "")
      form.setValue("email", result.email || "")
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
        title: "Success!",
        description: "Your profile has been pre-filled from your resume. Please review and save.",
        variant: "default",
      })
    } catch (error) {
      console.error("Resume parsing failed:", error)
      toast({
        title: "Uh oh! Something went wrong.",
        description: "There was a problem with parsing your resume.",
        variant: "destructive",
      })
    } finally {
      setIsParsing(false)
    }
  }

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    if (!user) {
        toast({ title: "Error", description: "You must be logged in to update your profile.", variant: "destructive" });
        return;
    }
    setIsSaving(true);
    try {
        const userDocRef = doc(db, "users", user.uid);
        const { email, name, ...updateData } = values; 
        
        const [firstName, ...lastNameParts] = name.split(' ');
        const lastName = lastNameParts.join(' ');
        
        await updateDoc(userDocRef, {
            ...updateData,
            name,
            firstName,
            lastName,
        });
        toast({
            title: "Profile Updated",
            description: "Your professional profile has been saved successfully.",
        });
    } catch (error) {
        console.error("Profile update failed:", error);
        toast({ title: "Error", description: "Failed to update profile.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  }

  const toggleBadgeVisibility = (id: string) => {
    setBadges(badges.map(b => b.id === id ? { ...b, visible: !b.visible } : b));
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
                <h1 className="text-3xl font-bold tracking-tight">{t('Professional Profile')}</h1>
                <p className="text-muted-foreground mt-1">{t('Build and maintain your professional identity.')}</p>
            </div>
        </div>
        <div className="relative shrink-0 w-full sm:w-auto">
            <Button disabled={isParsing} className="w-full">
                <Upload className="mr-2 h-4 w-4" />
                {isParsing ? "Parsing..." : "Upload Resume"}
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
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
                          <Input placeholder="you@example.com" {...field} disabled />
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
                        <FormLabel>{t('Phone Number (Optional)')}</FormLabel>
                        <FormControl>
                          <Input placeholder="(123) 456-7890" {...field} />
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
                            <CardTitle>{t('Education')}</CardTitle>
                            <CardDescription>{t('Your academic background. Add each degree separately.')}</CardDescription>
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={() => append({ degree: '', field: '', gradYear: '', verified: false })}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            {t('Add Degree')}
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
                                            <FormLabel>{t('Degree')}</FormLabel>
                                            <FormControl><Input placeholder="e.g. Bachelor of Science" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`education.${index}.field`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('Field of Study')}</FormLabel>
                                            <FormControl><Input placeholder="e.g. Computer Science" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                 <FormField
                                    control={form.control}
                                    name={`education.${index}.gradYear`}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('Graduation Year')}</FormLabel>
                                            <FormControl><Input type="number" placeholder="e.g. 2024" {...field} /></FormControl>
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
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                    {fields.length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">{t('No education history added yet.')}</p>
                    )}
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
              
              <div className="flex justify-end">
                <Button type="submit" disabled={isSaving || isParsing} data-hs-event-name="profile_updated">
                  {isSaving ? t("Saving...") : t("Save Profile")}
                </Button>
              </div>
            </div>
            <div className="lg:col-span-1 space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Award /> {t('Certifications & Badges')}</CardTitle>
                        <CardDescription>{t('Manage the visibility of your earned skill badges.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {badges.length > 0 ? badges.map(badge => (
                            <div key={badge.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <div className="flex items-center gap-2">
                                    <Award className="h-5 w-5 text-primary" />
                                    <span className="font-medium">{t(badge.name)}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                     {badge.visible ? <Eye className="h-4 w-4 text-muted-foreground" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                                     <Switch
                                        checked={badge.visible}
                                        onCheckedChange={() => toggleBadgeVisibility(badge.id)}
                                        aria-label={`Toggle visibility for ${badge.name} badge`}
                                    />
                                </div>
                            </div>
                        )) : (
                            <p className="text-sm text-muted-foreground text-center py-4">{t('No badges earned yet. Take an assessment to get started!')}</p>
                        )}
                        <Button variant="secondary" asChild className="w-full">
                            <Link href="/dashboard/assessments">{t('Take a New Assessment')}</Link>
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </form>
      </Form>
    </div>
  )
}
