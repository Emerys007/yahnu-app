"use client"

import { useState } from "react"
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
import { Label } from "@/components/ui/label"


const companyProfileSchema = z.object({
  companyName: z.string().min(2, { message: "Company name must be at least 2 characters." }),
  website: z.string().url({ message: "Please enter a valid URL." }),
  location: z.string().min(2, { message: "Location is required." }),
  tagline: z.string().max(100).optional(),
  description: z.string().min(50, { message: "Description must be at least 50 characters." }),
})

const jobPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
})

export default function CompanyProfilePage() {
  const { toast } = useToast()
  const [jobs, setJobs] = useState<z.infer<typeof jobPostSchema>[]>([
    { title: "Software Engineer, Frontend", location: "Remote", type: "Full-time" },
    { title: "Product Manager", location: "New York, NY", type: "Full-time" },
  ])
  const [isJobDialogOpen, setIsJobDialogOpen] = useState(false)

  const profileForm = useForm<z.infer<typeof companyProfileSchema>>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      companyName: "Innovate Inc.",
      website: "https://innovate.inc",
      location: "New York, NY",
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
    },
  })
  
  function handleLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      toast({
        title: "Logo Selected",
        description: `${file.name} is ready to be uploaded.`,
      });
    }
  }

  function onProfileSubmit(values: z.infer<typeof companyProfileSchema>) {
    console.log(values)
    toast({
      title: "Company Profile Updated",
      description: "Your company's profile has been saved successfully.",
    })
  }

  function onJobSubmit(values: z.infer<typeof jobPostSchema>) {
    setJobs(prev => [...prev, values])
    toast({
      title: "Job Posted",
      description: `The "${values.title}" position has been added.`,
    })
    jobForm.reset()
    setIsJobDialogOpen(false)
  }

  function deleteJob(indexToDelete: number) {
    const jobToDelete = jobs[indexToDelete]
    setJobs(jobs.filter((_, index) => index !== indexToDelete))
    toast({
      title: "Job Removed",
      description: `The "${jobToDelete.title}" position has been removed.`,
      variant: "destructive"
    })
  }


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Company Profile</h1>
            <p className="text-muted-foreground mt-1">Showcase your company to attract top talent.</p>
        </div>
        <div className="relative">
            <Button asChild>
                <label htmlFor="logo-upload">
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Logo
                </label>
            </Button>
            <input
                id="logo-upload"
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleLogoUpload}
            />
        </div>
      </div>
      
      <Form {...profileForm}>
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="grid lg:grid-cols-3 gap-8 items-start">
          <div className="lg:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
                <CardDescription>Basic information about your organization.</CardDescription>
              </CardHeader>
              <CardContent className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={profileForm.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl><Input placeholder="Your Company LLC" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website</FormLabel>
                      <FormControl><Input placeholder="https://yourcompany.com" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Headquarters</FormLabel>
                      <FormControl><Input placeholder="City, State/Country" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={profileForm.control}
                  name="tagline"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Tagline</FormLabel>
                      <FormControl><Input placeholder="A short, catchy phrase for your company." {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={profileForm.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>About Your Company</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe your company's mission, vision, and culture..." rows={8} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
            <div className="flex justify-end">
              <Button type="submit">Save Changes</Button>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Job Postings</CardTitle>
                    <CardDescription>Manage your open positions.</CardDescription>
                </div>
                <Dialog open={isJobDialogOpen} onOpenChange={setIsJobDialogOpen}>
                    <DialogTrigger asChild>
                         <Button size="icon" variant="outline">
                            <PlusCircle className="h-4 w-4"/>
                            <span className="sr-only">Add new job</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <Form {...jobForm}>
                            <form onSubmit={jobForm.handleSubmit(onJobSubmit)}>
                                <DialogHeader>
                                    <DialogTitle>Add New Job Posting</DialogTitle>
                                    <DialogDescription>
                                        Fill in the details for the new position.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                     <FormField
                                        control={jobForm.control}
                                        name="title"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Job Title</FormLabel>
                                            <FormControl><Input placeholder="e.g. Software Engineer" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                     <FormField
                                        control={jobForm.control}
                                        name="location"
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Location</FormLabel>
                                            <FormControl><Input placeholder="e.g. New York, NY" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={jobForm.control}
                                        name="type"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Job Type</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                    <SelectValue placeholder="Select a job type" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Full-time">Full-time</SelectItem>
                                                    <SelectItem value="Part-time">Part-time</SelectItem>
                                                    <SelectItem value="Contract">Contract</SelectItem>
                                                    <SelectItem value="Internship">Internship</SelectItem>
                                                </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <DialogFooter>
                                    <Button type="submit">Post Job</Button>
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
                    <p className="text-sm text-muted-foreground text-center py-4">No active job postings.</p>
                )}
              </CardContent>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  )
}
