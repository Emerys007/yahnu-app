
"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/auth-context";
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
import { Upload, Loader2 } from "lucide-react"

const profileSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  email: z.string().email(),
  phone: z.string().optional(),
  experience: z.string().optional(),
  education: z.string().optional(),
  skills: z.string().optional(),
})

export default function ProfilePage() {
  const { toast } = useToast()
  const { user, loading } = useAuth();
  const [isParsing, setIsParsing] = useState(false)
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      experience: "",
      education: "",
      skills: "",
    },
  })

  useEffect(() => {
    if (user) {
        form.reset({
            name: user.name || (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : ''),
            email: user.email || '',
            phone: user.phone || '',
            experience: user.experience || '',
            education: user.education || '',
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
      form.setValue("education", result.education?.join("\n\n") || "")
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
  
  if (loading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Professional Profile</h1>
            <p className="text-muted-foreground mt-1">Build and maintain your professional identity.</p>
        </div>
        <div className="relative">
            <Button disabled={isParsing}>
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>This information will be visible on your public profile.</CardDescription>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
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
                    <FormLabel>Email Address</FormLabel>
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
                    <FormLabel>Phone Number (Optional)</FormLabel>
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
              <CardTitle>Work Experience</CardTitle>
              <CardDescription>Detail your professional journey.</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea placeholder="Describe your work experience..." rows={10} {...field} />
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
                  <CardTitle>Education</CardTitle>
                  <CardDescription>Your academic background.</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="education"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="List your degrees and schools..." rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                  <CardDescription>Your key competencies.</CardDescription>
                </CardHeader>
                <CardContent>
                   <FormField
                    control={form.control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea placeholder="e.g., JavaScript, Product Management, ..." rows={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={isSaving || isParsing}>{isSaving ? "Saving..." : "Save Profile"}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
