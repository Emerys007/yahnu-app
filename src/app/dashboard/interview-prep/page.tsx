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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const formSchema = z.object({
  jobDescription: z.string().min(50, { message: "La description de poste doit contenir au moins 50 caractères." }),
})

export default function InterviewPrepPage() {
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
      title: "Génération des questions...",
      description: "Notre IA élabore vos questions de préparation à l'entretien.",
    })

    try {
      const result = await generateInterviewQuestions(values)
      setQuestions(result)
      toast({
        title: "Matériel de préparation généré !",
        description: "Vos questions d'entretien sont prêtes ci-dessous.",
      })
    } catch (error) {
      console.error("Interview question generation failed:", error)
      toast({
        title: "Échec de la génération",
        description: "Un problème est survenu lors de la création du matériel de préparation.",
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
          <h1 className="text-3xl font-bold tracking-tight">Préparation aux entretiens par l'IA</h1>
          <p className="text-muted-foreground mt-1">Collez une description de poste pour générer des questions d'entretien et des conseils personnalisés.</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Détails du poste</CardTitle>
          <CardDescription>Fournissez la description du poste pour lequel vous passez un entretien.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="jobDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description du poste</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Collez ici la description complète du poste..." rows={10} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Générer les questions de préparation
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
              <CardTitle className="flex items-center gap-2"><UserCheck /> Questions comportementales</CardTitle>
              <CardDescription>Évalue les compétences non techniques, l'adéquation culturelle et le jugement situationnel.</CardDescription>
            </CardHeader>
            <CardContent>
                <Accordion type="single" collapsible className="w-full">
                    {questions.behavioralQuestions.map((q, i) => (
                        <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>{q.question}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p className="flex items-start gap-2 text-primary">
                                    <Lightbulb className="h-4 w-4 mt-1 flex-shrink-0" />
                                    <span className="font-semibold">Conseil :</span>
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
              <CardTitle className="flex items-center gap-2"><Code /> Questions techniques</CardTitle>
              <CardDescription>Teste les compétences techniques spécifiques et les connaissances liées au poste.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Accordion type="single" collapsible className="w-full">
                    {questions.technicalQuestions.map((q, i) => (
                        <AccordionItem value={`item-${i}`} key={i}>
                            <AccordionTrigger>{q.question}</AccordionTrigger>
                            <AccordionContent className="space-y-2">
                                <p className="flex items-start gap-2 text-primary">
                                    <Lightbulb className="h-4 w-4 mt-1 flex-shrink-0" />
                                    <span className="font-semibold">Conseil :</span>
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
