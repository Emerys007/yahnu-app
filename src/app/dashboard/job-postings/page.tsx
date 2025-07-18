
"use client"

import { useState } from "react"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, PlusCircle, Edit, Trash2, Users } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { motion } from "framer-motion"

type JobPosting = {
  id: number
  title: string
  location: string
  type: string,
  applicants: number
}

const initialJobs: JobPosting[] = [
  { id: 1, title: "Software Engineer, Frontend", location: "Remote", type: "Full-time", applicants: 42 },
  { id: 2, title: "Product Manager", location: "New York, NY", type: "Full-time", applicants: 18 },
];

const jobPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  location: z.string().min(1, "Location is required"),
  type: z.string().min(1, "Type is required"),
  description: z.string().optional(),
})

const JobPostingForm = ({ posting, onSave }: { posting?: z.infer<typeof jobPostSchema>; onSave: (values: z.infer<typeof jobPostSchema>) => void }) => {
    const { t } = useLocalization();
    const form = useForm<z.infer<typeof jobPostSchema>>({
        resolver: zodResolver(jobPostSchema),
        defaultValues: posting || {
          title: "",
          location: "",
          type: "",
          description: "",
        },
    });

    const onSubmit = (values: z.infer<typeof jobPostSchema>) => {
        onSave(values);
    };
    
    return (
         <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                    <DialogTitle>{t('Add New Job Posting')}</DialogTitle>
                    <DialogDescription>
                        {t('Fill in the details for the new position.')}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                        <FormField
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
                        control={form.control}
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
    )
}

export default function JobPostingsPage() {
  const { t } = useLocalization()
  const { toast } = useToast()
  const [jobs, setJobs] = useState<JobPosting[]>(initialJobs)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const handleCreateJob = (values: z.infer<typeof jobPostSchema>) => {
    const newJob: JobPosting = {
      id: Date.now(),
      title: values.title,
      location: values.location,
      type: values.type,
      applicants: 0
    };
    setJobs(prev => [newJob, ...prev]);
    toast({ title: t("Job Posted"), description: `${t('The "')}${values.title}${t('" position has been added.')}` });
    setIsDialogOpen(false);
  }

  const handleDeleteJob = (jobId: number) => {
    setJobs(jobs.filter(e => e.id !== jobId));
    toast({ title: t("Job Removed"), variant: "destructive" });
  }

  return (
    <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <Briefcase className="h-6 w-6 text-primary" />
            </div>
            <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Job Postings')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your open positions to attract top talent.')}</p>
            </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />{t('New Job Posting')}</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
               <JobPostingForm onSave={handleCreateJob} />
            </DialogContent>
        </Dialog>
      </div>

       <Card>
            <CardHeader>
                <CardTitle>{t('Your Job Postings')}</CardTitle>
                <CardDescription>{t('A list of all jobs you have posted on the platform.')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                    <TableRow>
                        <TableHead>{t('Job Title')}</TableHead>
                        <TableHead>{t('Location')}</TableHead>
                        <TableHead>{t('Type')}</TableHead>
                        <TableHead>{t('Applicants')}</TableHead>
                        <TableHead className="text-right">{t('Actions')}</TableHead>
                    </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobs.map(job => (
                        <TableRow key={job.id}>
                            <TableCell className="font-medium">{t(job.title)}</TableCell>
                            <TableCell>{job.location}</TableCell>
                            <TableCell>{t(job.type)}</TableCell>
                            <TableCell className="flex items-center gap-2"><Users className="h-4 w-4 text-muted-foreground" /> {job.applicants}</TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button size="icon" variant="ghost"><Edit className="h-4 w-4" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => handleDeleteJob(job.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                            </TableCell>
                        </TableRow>
                        ))}
                        {jobs.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">{t('No jobs posted yet.')}</TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </motion.div>
  )
}
