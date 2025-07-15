
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Loader2, Mic, ChevronLeft, ChevronRight, BrainCircuit } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { AnimatePresence, motion } from "framer-motion"

const interviewPrepSchema = z.object({
  jobTitle: z.string().min(3, { message: "Job title must be at least 3 characters." }),
})

export default function InterviewPrepPage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<string[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)

  const form = useForm<z.infer<typeof interviewPrepSchema>>({
    resolver: zodResolver(interviewPrepSchema),
    defaultValues: {
      jobTitle: "Software Engineer",
    },
  })

  async function onSubmit(values: z.infer<typeof interviewPrepSchema>) {
    setIsGenerating(true)
    setQuestions([])
    toast({
      title: t('Generating Questions...'),
      description: t('Our AI is preparing your interview questions. Please wait.'),
    })

    try {
      const result = await generateInterviewQuestions({ jobTitle: values.jobTitle, questionCount: 10 })
      setQuestions(result.questions)
      setCurrentQuestionIndex(0)
      toast({
        title: t('Ready to Practice!'),
        description: t('Your mock interview questions are ready.'),
      })
    } catch (error) {
      console.error("Question generation failed:", error)
      toast({
        title: t('Generation Failed'),
        description: t('There was a problem generating questions.'),
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex(prev => prev + 1)
    }
  }
  
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
            <BrainCircuit className="h-6 w-6 text-primary" />
        </div>
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('AI Interview Coach')}</h1>
            <p className="text-muted-foreground mt-1">{t('Practice for your next interview with an AI-powered coach.')}</p>
        </div>
      </div>
      
      {!questions.length && (
        <Card>
            <CardHeader>
            <CardTitle>{t('Start Your Practice Session')}</CardTitle>
            <CardDescription>{t('Enter the job title you are interviewing for to get started.')}</CardDescription>
            </CardHeader>
            <CardContent>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                    control={form.control}
                    name="jobTitle"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>{t('Job Title')}</FormLabel>
                        <FormControl>
                            <Input placeholder={t("e.g., 'Product Manager'")} {...field} />
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
                        {t('Start Practice')}
                    </>
                    )}
                </Button>
                </form>
            </Form>
            </CardContent>
        </Card>
      )}
      
      {questions.length > 0 && (
          <Card className="min-h-[50vh] flex flex-col">
            <CardHeader>
                <CardTitle>{t('Interview for: ')}<span className="text-primary">{form.getValues("jobTitle")}</span></CardTitle>
                <CardDescription>{t('Question {current} of {total}', { current: currentQuestionIndex + 1, total: questions.length })}</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex items-center justify-center text-center">
                 <AnimatePresence mode="wait">
                    <motion.p 
                        key={currentQuestionIndex}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.3 }}
                        className="text-2xl font-semibold max-w-3xl"
                    >
                        {questions[currentQuestionIndex]}
                    </motion.p>
                 </AnimatePresence>
            </CardContent>
            <CardFooter className="flex-col items-center gap-4">
                <Button size="lg" className="rounded-full w-24 h-24">
                    <Mic className="h-8 w-8"/>
                    <span className="sr-only">{t('Record Answer')}</span>
                </Button>
                <div className="flex items-center gap-4">
                     <Button variant="outline" size="icon" onClick={prevQuestion} disabled={currentQuestionIndex === 0}>
                        <ChevronLeft className="h-4 w-4" />
                     </Button>
                      <Button variant="outline" size="icon" onClick={nextQuestion} disabled={currentQuestionIndex === questions.length - 1}>
                        <ChevronRight className="h-4 w-4" />
                     </Button>
                </div>
                <Button variant="link" onClick={() => setQuestions([])}>{t('End Practice Session')}</Button>
            </CardFooter>
          </Card>
      )}

    </div>
  )
}
