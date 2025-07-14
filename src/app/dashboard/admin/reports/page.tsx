
"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { generateCustomReport, type CustomReportOutput } from "@/ai/flows/custom-report-builder"
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
import { Wand2, Loader2, FileText, BrainCircuit } from "lucide-react"
import { useLocalization } from "@/context/localization-context"

const reportSchema = z.object({
  query: z.string().min(10, { message: "Query must be at least 10 characters." }),
})

export default function CustomReportPage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<CustomReportOutput | null>(null)

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      query: "Show me a bar chart of new users per month for the last 6 months.",
    },
  })

  async function onSubmit(values: z.infer<typeof reportSchema>) {
    setIsGenerating(true)
    setReport(null)
    toast({
      title: t('Generating Report...'),
      description: t('Our AI is analyzing data and building your report. Please wait.'),
    })

    try {
      const result = await generateCustomReport({ query: values.query })
      setReport(result)
      toast({
        title: t('Report Generated!'),
        description: t('Your custom report is ready below.'),
      })
    } catch (error) {
      console.error("Report generation failed:", error)
      toast({
        title: t('Generation Failed'),
        description: t('There was a problem creating the report.'),
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
            <h1 className="text-3xl font-bold tracking-tight">{t('AI Custom Report Builder')}</h1>
            <p className="text-muted-foreground mt-1">{t('Generate custom reports by asking questions in natural language.')}</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>{t('Report Query')}</CardTitle>
          <CardDescription>{t('Describe the report or data visualization you want to generate.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Your Request')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t("e.g., 'Show me a pie chart of graduates by field of study' or 'What is the quarterly user growth rate?'")} 
                        rows={4} 
                        {...field} 
                      />
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
                    {t('Generate Report')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      {isGenerating && (
          <Card>
            <CardContent className="p-6 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">{t('Generating Report...')}</p>
            </CardContent>
          </Card>
      )}

      {report && (
        <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText /> {t('Generated Report')}</CardTitle>
              <CardDescription>{t('Here is the report based on your query.')}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm max-w-none whitespace-pre-wrap rounded-md border p-4 bg-muted/50">
                <p>{report.report}</p>
                {report.visualizationData && (
                    <>
                        <h4 className="font-semibold mt-4">{t('Visualization Data')}</h4>
                        <code>{report.visualizationData}</code>
                    </>
                )}
              </div>
            </CardContent>
        </Card>
      )}
    </div>
  )
}
