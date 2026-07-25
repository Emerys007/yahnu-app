"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import {
  AlertCircle,
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  Check,
  Clipboard,
  Lightbulb,
  Loader2,
  MapPin,
  MessageCircleQuestion,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  UsersRound,
} from "lucide-react"

import {
  generateInterviewQuestions,
  type GenerateInterviewQuestionsOutput,
} from "@/ai/flows/interview-question-generator"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"

const MAX_JOB_DESCRIPTION_LENGTH = 12_000

const formSchema = z.object({
  jobDescription: z
    .string()
    .trim()
    .min(50, { message: "Ajoute au moins 50 caractères pour obtenir des questions utiles." })
    .max(MAX_JOB_DESCRIPTION_LENGTH, {
      message: "La description ne peut pas dépasser 12 000 caractères.",
    }),
})

const jobExamples = [
  {
    label: "Banque & fintech",
    location: "Abidjan · Plateau",
    description:
      "Analyste data junior — Abidjan Plateau. Une banque ivoirienne recherche un profil Bac+4/5 pour analyser les données de son portefeuille PME, construire des tableaux de bord et présenter des recommandations aux équipes métier. Bonne maîtrise d’Excel, SQL et Power BI demandée. Le poste exige de la rigueur, un français professionnel et une bonne compréhension du tissu économique ivoirien. Une première expérience en stage ou en alternance est appréciée.",
  },
  {
    label: "Agro-industrie",
    location: "Yamoussoukro",
    description:
      "Assistant·e qualité junior — Yamoussoukro. Une entreprise ivoirienne de transformation de cacao recrute pour suivre les contrôles qualité, renseigner les fiches de traçabilité et accompagner les équipes de production. Formation Bac+3 en qualité, agroalimentaire ou biologie. Le poste demande de la méthode, de l’aisance sur le terrain et une bonne communication avec les producteurs et les équipes de l’usine.",
  },
  {
    label: "Numérique",
    location: "Abidjan · Cocody",
    description:
      "Développeur·euse front-end junior — Abidjan Cocody, avec deux jours de télétravail. Une startup ivoirienne conçoit des services numériques pour les commerçants et les PME. La mission consiste à développer des interfaces React accessibles sur mobile, collaborer avec le design et participer aux revues de code. Connaissances de TypeScript, Git et des API REST attendues. Curiosité, autonomie et sens du service sont essentiels.",
  },
] as const

type QuestionGroupProps = {
  description: string
  icon: typeof UsersRound
  questions: GenerateInterviewQuestionsOutput["behavioralQuestions"]
  title: string
  valuePrefix: string
}

function QuestionGroup({ description, icon: Icon, questions, title, valuePrefix }: QuestionGroupProps) {
  return (
    <Card className="h-fit overflow-hidden border-border/80 bg-card/95">
      <CardHeader className="border-b border-border/70 bg-muted/35">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon aria-hidden="true" className="size-5" />
          </div>
          <div className="min-w-0">
            <CardTitle className="text-xl">{title}</CardTitle>
            <CardDescription className="mt-1 leading-relaxed">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-2 sm:pt-3">
        <Accordion className="w-full" collapsible type="single">
          {questions.map((question, index) => (
            <AccordionItem key={`${valuePrefix}-${index}`} value={`${valuePrefix}-${index}`}>
              <AccordionTrigger className="gap-3 py-4 text-left text-[0.95rem] font-semibold leading-snug hover:no-underline">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs text-muted-foreground">
                  {index + 1}
                </span>
                <span className="flex-1">{question.question}</span>
              </AccordionTrigger>
              <AccordionContent className="pb-5 pl-10 pr-1">
                <div className="rounded-2xl border border-terra/20 bg-terra/10 p-4 text-sm leading-relaxed text-foreground">
                  <p className="mb-2 flex items-center gap-2 font-semibold text-terra-foreground">
                    <Lightbulb aria-hidden="true" className="size-4 text-terra" />
                    Piste pour construire ta réponse
                  </p>
                  <p>{question.tip}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}

function PreparationLoading() {
  return (
    <Card aria-live="polite" aria-busy="true" className="overflow-hidden border-primary/20 bg-primary/[0.035]">
      <CardContent className="p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Loader2 aria-hidden="true" className="size-5 animate-spin motion-reduce:animate-none" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-display text-lg font-semibold">Le coach prépare ta séance…</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Nous repérons les missions, les compétences et les situations à travailler dans l’annonce.
            </p>
            <div className="mt-5 space-y-3" aria-hidden="true">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-[94%] rounded-xl" />
              <Skeleton className="h-12 w-[88%] rounded-xl" />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InterviewPrepPage() {
  const { toast } = useToast()
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<GenerateInterviewQuestionsOutput | null>(null)
  const [generationError, setGenerationError] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jobDescription: "",
    },
  })

  const jobDescription = form.watch("jobDescription")
  const questionCount = questions
    ? questions.behavioralQuestions.length + questions.technicalQuestions.length
    : 0

  function selectExample(description: string) {
    form.setValue("jobDescription", description, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    })
    setQuestions(null)
    setGenerationError(false)
  }

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsGenerating(true)
    setQuestions(null)
    setGenerationError(false)

    try {
      const result = await generateInterviewQuestions(values)
      const hasUsableResult =
        result?.behavioralQuestions?.length > 0 && result?.technicalQuestions?.length > 0

      if (!hasUsableResult) {
        throw new Error("EMPTY_INTERVIEW_PREPARATION")
      }

      setQuestions(result)
      toast({
        title: "Ton brouillon de préparation est prêt",
        description: "Parcours les pistes, puis adapte chaque réponse à ton expérience réelle.",
      })
    } catch {
      setGenerationError(true)
      toast({
        title: "Le coach n’est pas disponible pour le moment",
        description: "Ton annonce est toujours ici. Tu pourras relancer la préparation dans un instant.",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  async function copyPreparation() {
    if (!questions) return

    const text = [
      "Préparation d’entretien Yahnu",
      "",
      "PARCOURS & SITUATIONS",
      ...questions.behavioralQuestions.flatMap((item, index) => [
        `${index + 1}. ${item.question}`,
        `Piste : ${item.tip}`,
        "",
      ]),
      "MÉTIER & PRATIQUE",
      ...questions.technicalQuestions.flatMap((item, index) => [
        `${index + 1}. ${item.question}`,
        `Piste : ${item.tip}`,
        "",
      ]),
    ].join("\n")

    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: "Préparation copiée",
        description: "Tu peux maintenant la reprendre dans tes notes et écrire tes propres réponses.",
      })
    } catch {
      toast({
        title: "Copie impossible",
        description: "Ton navigateur n’a pas autorisé la copie. Les questions restent disponibles sur cette page.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="space-y-6 pb-10 sm:space-y-8">
      <section className="ci-pattern relative overflow-hidden rounded-[1.75rem] border border-primary/15 bg-gradient-to-br from-primary/[0.12] via-background to-lagoon/10 p-5 sm:p-8 lg:p-10">
        <div aria-hidden="true" className="absolute -right-16 -top-20 size-64 rounded-full bg-terra/15 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-24 left-1/3 size-72 rounded-full bg-lagoon/10 blur-3xl" />

        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.45fr)_minmax(17rem,0.55fr)] lg:items-end">
          <div className="max-w-3xl">
            <div className="section-kicker mb-4">
              <Sparkles aria-hidden="true" className="size-4" />
              Coaching entretien · Côte d’Ivoire
            </div>
            <h1 className="display-title text-3xl sm:text-4xl lg:text-5xl">
              Arrive à l’entretien avec des histoires à raconter.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Colle l’annonce qui t’intéresse. Yahnu te propose un brouillon de questions pour t’entraîner,
              structurer tes exemples et parler de ton parcours avec assurance.
            </p>
            <div className="mt-6 flex flex-wrap gap-2 text-sm">
              <Badge className="gap-1.5" variant="secondary">
                <MapPin aria-hidden="true" className="size-3.5" />
                Abidjan, Bouaké, Yamoussoukro et partout au pays
              </Badge>
              <Badge className="gap-1.5" variant="outline">
                <ShieldCheck aria-hidden="true" className="size-3.5" />
                Tes réponses restent les tiennes
              </Badge>
            </div>
          </div>

          <div className="rounded-3xl border border-white/50 bg-background/80 p-5 shadow-soft backdrop-blur-sm dark:border-white/10">
            <p className="font-display text-base font-semibold">Une séance, trois temps</p>
            <ol className="mt-4 space-y-3 text-sm">
              {[
                "Choisis une annonce ivoirienne",
                "Explore les questions suggérées",
                "Prépare des exemples vécus et précis",
              ].map((step, index) => (
                <li className="flex items-center gap-3" key={step}>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Card className="overflow-hidden border-border/80">
          <CardHeader className="border-b border-border/70 bg-muted/25">
            <div className="flex items-start gap-3">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-terra/15 text-terra">
                <BriefcaseBusiness aria-hidden="true" className="size-5" />
              </div>
              <div>
                <CardTitle className="text-xl sm:text-2xl">Partons de l’annonce réelle</CardTitle>
                <CardDescription className="mt-1 leading-relaxed">
                  Copie le titre, les missions et le profil recherché. Retire le nom d’une personne ou toute donnée confidentielle.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form className="space-y-5" noValidate onSubmit={form.handleSubmit(onSubmit)}>
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex flex-wrap items-end justify-between gap-2">
                        <FormLabel className="text-base">Description du poste</FormLabel>
                        <span
                          aria-live="polite"
                          className={`text-xs ${
                            jobDescription.length > MAX_JOB_DESCRIPTION_LENGTH
                              ? "font-semibold text-destructive"
                              : "text-muted-foreground"
                          }`}
                        >
                          {jobDescription.length.toLocaleString("fr-CI")} / {MAX_JOB_DESCRIPTION_LENGTH.toLocaleString("fr-CI")}
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          aria-describedby="job-description-help"
                          className="min-h-56 resize-y rounded-2xl border-border/90 bg-background p-4 text-base leading-relaxed placeholder:leading-relaxed focus-visible:ring-primary sm:min-h-64"
                          disabled={isGenerating}
                          maxLength={MAX_JOB_DESCRIPTION_LENGTH + 1}
                          placeholder="Exemple : Chargé·e de clientèle junior à Abidjan. Missions : accompagner un portefeuille de PME, préparer les rendez-vous… Profil : Bac+3, sens du contact, maîtrise d’Excel…"
                          {...field}
                          onChange={(event) => {
                            field.onChange(event)
                            setQuestions(null)
                            setGenerationError(false)
                          }}
                        />
                      </FormControl>
                      <FormDescription id="job-description-help">
                        Plus l’annonce est précise, plus la séance sera utile. Minimum : 50 caractères.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="rounded-2xl border border-dashed border-border bg-muted/25 p-4">
                  <p className="text-sm font-semibold">Pas d’annonce sous la main ? Essaie un exemple local.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {jobExamples.map((example) => (
                      <Button
                        className="h-auto min-h-10 whitespace-normal px-3 py-2 text-left"
                        disabled={isGenerating}
                        key={example.label}
                        onClick={() => selectExample(example.description)}
                        type="button"
                        variant="outline"
                      >
                        <span>
                          <span className="block font-semibold">{example.label}</span>
                          <span className="block text-xs font-normal text-muted-foreground">{example.location}</span>
                        </span>
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <p className="max-w-lg text-xs leading-relaxed text-muted-foreground">
                    Les questions sont générées pour l’entraînement. Elles ne viennent pas forcément du recruteur et ne garantissent pas le contenu de l’entretien.
                  </p>
                  <Button className="w-full shrink-0 sm:w-auto" disabled={isGenerating} size="lg" type="submit">
                    {isGenerating ? (
                      <>
                        <Loader2 aria-hidden="true" className="animate-spin motion-reduce:animate-none" />
                        Préparation en cours…
                      </>
                    ) : (
                      <>
                        Préparer ma séance
                        <ArrowRight aria-hidden="true" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <aside className="space-y-4 xl:sticky xl:top-24">
          <Card className="border-lagoon/25 bg-lagoon/[0.06]">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target aria-hidden="true" className="size-5 text-lagoon" />
                Le réflexe qui change tout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm leading-relaxed">
              <p>
                Pour chaque réponse, raconte une situation réelle : le contexte, ton action et le résultat. Un projet de fin d’études ou une association étudiante compte aussi.
              </p>
              <div className="space-y-2">
                {["Une situation précise", "Ce que tu as fait toi-même", "Un résultat ou un apprentissage"].map((item) => (
                  <p className="flex items-start gap-2" key={item}>
                    <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                    {item}
                  </p>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-3xl bg-cocoa p-5 text-ivory shadow-soft">
            <p className="font-display font-semibold">Avant le rendez-vous</p>
            <p className="mt-2 text-sm leading-relaxed text-ivory/75">
              Vérifie le lieu et ton trajet, surtout aux heures de pointe à Abidjan. Garde aussi une copie de ton CV et le contact du recruteur.
            </p>
          </div>
        </aside>
      </div>

      <section aria-label="Résultats de la préparation" className="space-y-5">
        {isGenerating ? <PreparationLoading /> : null}

        {!isGenerating && generationError ? (
          <Alert className="rounded-2xl border-destructive/30 bg-destructive/[0.06]" variant="destructive">
            <AlertCircle aria-hidden="true" className="size-4" />
            <AlertTitle>Impossible de préparer la séance maintenant</AlertTitle>
            <AlertDescription>
              <p>Le service de génération est peut-être momentanément indisponible. Ton texte n’a pas été effacé.</p>
              <Button
                className="mt-4"
                onClick={() => void form.handleSubmit(onSubmit)()}
                size="sm"
                type="button"
                variant="outline"
              >
                <RefreshCw aria-hidden="true" />
                Réessayer
              </Button>
            </AlertDescription>
          </Alert>
        ) : null}

        {!isGenerating && questions ? (
          <>
            <div className="flex flex-col gap-4 rounded-3xl border border-primary/20 bg-primary/[0.045] p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
              <div>
                <p className="section-kicker mb-2">Brouillon d’entraînement</p>
                <h2 className="font-display text-2xl font-bold sm:text-3xl" id="preparation-results-title">
                  {questionCount} questions pour lancer ta préparation
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                  Ouvre chaque question et note un exemple personnel. Les pistes ci-dessous sont des suggestions à relire, pas des réponses vérifiées ni une prédiction de l’entretien.
                </p>
              </div>
              <Button className="w-full shrink-0 sm:w-auto" onClick={() => void copyPreparation()} type="button" variant="outline">
                <Clipboard aria-hidden="true" />
                Copier dans mes notes
              </Button>
            </div>

            <div className="grid items-start gap-5 lg:grid-cols-2">
              <QuestionGroup
                description="Pour parler de ton parcours, de ta façon de collaborer et de situations concrètes."
                icon={UsersRound}
                questions={questions.behavioralQuestions}
                title="Parcours & situations"
                valuePrefix="behavioral"
              />
              <QuestionGroup
                description="Pour réviser les savoir-faire, outils et décisions directement liés au poste."
                icon={BadgeCheck}
                questions={questions.technicalQuestions}
                title="Métier & pratique"
                valuePrefix="technical"
              />
            </div>
          </>
        ) : null}

        {!isGenerating && !questions && !generationError ? (
          <Card className="border-dashed bg-muted/20">
            <CardContent className="flex flex-col items-center px-5 py-10 text-center sm:py-14">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <MessageCircleQuestion aria-hidden="true" className="size-7" />
              </div>
              <h2 className="mt-4 font-display text-xl font-semibold" id="preparation-results-title">
                Tes questions apparaîtront ici
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                Commence avec une annonce qui te motive. Tu pourras ensuite ouvrir les conseils un par un et préparer tes réponses à ton rythme.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </section>
    </div>
  )
}
