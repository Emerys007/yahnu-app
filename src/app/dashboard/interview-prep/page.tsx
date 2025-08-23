"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { generateInterviewQuestions, type GenerateInterviewQuestionsOutput } from "@/ai/flows/interview-question-generator"
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
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Loader2, UserCheck, Code, Lightbulb, BrainCircuit } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const formSchema = z.object({
  jobDescription: z.string().min(50, { message: "Job description must be at least 50 characters." }),
})

export default function InterviewPrepPage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<GenerateInterviewQuestionsOutput | null>(null)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true)
    setQuestions(null)
    toast({
      title: t('Generating Questions...'),
      description: t('Our AI is crafting your interview prep questions.'),
    })

    try {
      const result = await generateInterviewQuestions(values)
      setQuestions(result)
      toast({
        title: t('Prep Material Generated!'),
        description: t('Your interview questions are ready below.'),
      })
    } catch (error) {
      console.error("Interview question generation failed:", error)
      toast({
        title: t('Generation Failed'),
        description: t('There was a problem creating the prep material.'),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('AI Interview Prep')}</h1>
          <p className="text-muted-foreground mt-1">{t('Paste a job description to generate tailored interview questions and tips.')}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('Job Details')}</CardTitle>
          <CardDescription>{t('Provide the job description for the role you are interviewing for.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Job Description')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("Paste the full job description here...")} rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('Generating...')}
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    {t('Generate Prep Questions')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {questions && (
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><UserCheck /> {t('Behavioral Questions')}</CardTitle>
              <CardDescription>{t('Assesses soft skills, cultural fit, and situational judgment.')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {questions.behavioralQuestions.map((q, i) => (
                        <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>{q.question}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p className="flex items-start gap-2 text-primary">
                                    <Lightbulb className="h-4 w-4 mt-1 flex-shrink-0" />
                                    <span className="font-semibold">{t('Tip')}:</span>
                                </p>
                                <p className="pl-6">{q.tip}</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Code /> {t('Technical Questions')}</CardTitle>
              <CardDescription>{t('Tests specific hard skills and role-related knowledge.')}</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {questions.technicalQuestions.map((q, i) => (
                        <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>{q.question}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p className="flex items-start gap-2 text-primary">
                                    <Lightbulb className="h-4 w-4 mt-1 flex-shrink-0" />
                                    <span className="font-semibold">{t('Tip')}:</span>
                                </p>
                                <p className="pl-6">{q.tip}</p>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
