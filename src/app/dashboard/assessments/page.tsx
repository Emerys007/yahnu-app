"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { generateAssessment, type GenerateAssessmentOutput } from "@/ai/flows/assessment-generator"
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
import { Wand2, BrainCircuit, UserCheck, Loader2 } from "lucide-react"

const assessmentSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters." }),
  companyValues: z.string().min(10, { message: "Company values must be at least 10 characters." }),
  basicFitQuestions: z.coerce.number().min(1).max(10),
  cognitiveAptitudeQuestions: z.coerce.number().min(1).max(10),
})

export default function AssessmentGeneratorPage() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [assessment, setAssessment] = useState<GenerateAssessmentOutput | null>(null)

  const form = useForm<z.infer<typeof assessmentSchema>>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      jobDescription: "We are looking for a proactive and creative Product Manager to join our dynamic team. The ideal candidate will be responsible for the product planning and execution throughout the Product Lifecycle, including: gathering and prioritizing product and customer requirements, defining the product vision, and working closely with engineering, sales, marketing and support to ensure revenue and customer satisfaction goals are met.",
      companyValues: "Innovation, Customer-Centricity, Collaboration, Integrity, and Accountability.",
      basicFitQuestions: 5,
      cognitiveAptitudeQuestions: 5,
    },
  })

  async function onSubmit(values: z.infer<typeof assessmentSchema>) {
    setIsGenerating(true)
    setAssessment(null)
    toast({
      title: "Generating Assessment...",
      description: "Our AI is crafting the perfect questions. Please wait.",
    })

    try {
      const result = await generateAssessment(values)
      setAssessment(result)
      toast({
        title: "Assessment Generated!",
        description: "Your custom assessment is ready below.",
      })
    } catch (error) {
      console.error("Assessment generation failed:", error)
      toast({
        title: "Generation Failed",
        description: "There was a problem creating the assessment.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Assessment Generator</h1>
        <p className="text-muted-foreground mt-1">Create relevant skills assessments for any role.</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Assessment Details</CardTitle>
          <CardDescription>Provide details about the job and your company to generate a tailored assessment.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Paste the job description here..." rows={6} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="companyValues"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Company Values</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Innovation, Teamwork, Customer First..." rows={3} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="basicFitQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of "Basic Fit" Questions</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cognitiveAptitudeQuestions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of "Cognitive Aptitude" Questions</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Assessment
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {assessment && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck /> Basic Fit Assessment</CardTitle>
              <CardDescription>Assesses alignment with company values and role requirements.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-decimal list-inside">
                {assessment.basicFitAssessment.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BrainCircuit /> Cognitive Aptitude Assessment</CardTitle>
              <CardDescription>Tests problem-solving and critical-thinking skills.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 list-decimal list-inside">
                {assessment.cognitiveAptitudeAssessment.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
