"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { generateCustomReport, type CustomReportOutput } from "@/ai/flows/custom-report-builder"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Wand2, Loader2, FileText, BarChart2 } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from "@/components/ui/chart"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import { useLocalization } from "@/context/localization-context"


const reportSchema = z.object({
  query: z.string().min(10, { message: "Query must be at least 10 characters long." }),
  availableData: z.string().optional(),
})

export default function CustomReportPage() {
  const { t } = useLocalization();
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [report, setReport] = useState<CustomReportOutput | null>(null)
  const [chartData, setChartData] = useState<any[]>([]);

  const form = useForm<z.infer<typeof reportSchema>>({
    resolver: zodResolver(reportSchema),
    defaultValues: {
      query: "Show me a bar chart of graduates by field of study.",
      availableData: "A list of 500 graduate profiles, including fields of study: Computer Science (150), Business (120), Engineering (100), Arts & Humanities (80), Sciences (50)."
    },
  })

  const tryParseJson = (jsonString: string) => {
    try {
      const data = JSON.parse(jsonString);
      return Array.isArray(data) ? data : null;
    } catch (e) {
      return null;
    }
  };

  async function onSubmit(values: z.infer<typeof reportSchema>) {
    setIsGenerating(true)
    setReport(null)
    setChartData([])
    toast({
      title: t('Generating Report...'),
      description: t('Our AI is crunching the numbers. This might take a moment.'),
    })

    try {
      const result = await generateCustomReport(values)
      setReport(result)

      if(result.visualizationData) {
        const parsedData = tryParseJson(result.visualizationData);
        if(parsedData) {
            setChartData(parsedData);
        }
      }

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

  const chartConfig = {
    graduates: {
      label: t('Graduates'),
      color: "hsl(var(--primary))",
    },
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('AI Custom Report Builder')}</h1>
        <p className="text-muted-foreground mt-1">{t('Generate insightful reports and charts using natural language.')}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Report Query')}</CardTitle>
          <CardDescription>{t('Describe the report you want to generate. You can optionally provide context about available data.')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="query"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Your Query')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t("e.g., 'Show me a pie chart of...' ")} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="availableData"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Available Data (Optional)')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t("Describe the data you have available...")} {...field} />
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

      {report && (
        <div className="grid lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText /> {t('Text Report')}</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              <p>{report.report}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart2 /> {t('Visualization')}</CardTitle>
              <CardDescription>
                {chartData.length > 0 ? t('Visual representation of your data.') : t('No valid visualization data was generated.')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 && (
                 <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
                  <BarChart accessibilityLayer data={chartData}>
                    <CartesianGrid vertical={false} />
                    <XAxis
                      dataKey="name"
                      tickLine={false}
                      tickMargin={10}
                      axisLine={false}
                    />
                    <YAxis />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    <Bar dataKey="graduates" fill="var(--color-graduates)" radius={4} />
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
