"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { analyzeCareerIntelligence, type CareerIntelligenceInput, type CareerIntelligenceOutput } from "@/ai/flows/career-intelligence"
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Loader2, Sparkles, Brain, RefreshCw, User } from "lucide-react"
import { CareerPathMap } from "@/components/dashboard/career-intelligence/career-path-map"
import { SkillGapAnalyzer } from "@/components/dashboard/career-intelligence/skill-gap-analyzer"
import { MarketPulse } from "@/components/dashboard/career-intelligence/market-pulse"
import { SalaryIntelligence } from "@/components/dashboard/career-intelligence/salary-intelligence"
import { ActionItems } from "@/components/dashboard/career-intelligence/action-items"

const SUPPORTED_COUNTRIES = [
  { value: "Ivory Coast", label: "Ivory Coast" },
  { value: "Ghana", label: "Ghana" },
  { value: "Nigeria", label: "Nigeria" },
  { value: "Senegal", label: "Senegal" },
  { value: "Cameroon", label: "Cameroon" },
  { value: "DR Congo", label: "DR Congo" },
]

export default function CareerIntelligencePage() {
  const { t } = useLocalization()
  const { user } = useAuth()
  const { toast } = useToast()

  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [result, setResult] = useState<CareerIntelligenceOutput | null>(null)

  // Form state — pre-filled from user profile when available
  const profileSkills = Array.isArray(user?.skills)
    ? user.skills
    : typeof user?.skills === "string"
      ? user.skills.split(",").map((s) => s.trim()).filter(Boolean)
      : []

  const profileExperience = Array.isArray(user?.experience)
    ? user.experience
    : typeof user?.experience === "string"
      ? [user.experience]
      : []

  const profileEducation = user?.education
    ? user.education.map((e) => `${e.degree} in ${e.field} (${e.gradYear})`)
    : []

  const [skills, setSkills] = useState(profileSkills.join(", "))
  const [experience, setExperience] = useState(profileExperience.join("\n"))
  const [education, setEducation] = useState(profileEducation.join("\n"))
  const [interests, setInterests] = useState("")
  const [country, setCountry] = useState(SUPPORTED_COUNTRIES[0].value)

  async function handleAnalyze() {
    const skillsList = skills.split(",").map((s) => s.trim()).filter(Boolean)
    const experienceList = experience.split("\n").map((s) => s.trim()).filter(Boolean)
    const educationList = education.split("\n").map((s) => s.trim()).filter(Boolean)

    if (skillsList.length === 0 && experienceList.length === 0 && educationList.length === 0) {
      toast({
        title: t("Missing Information"),
        description: t("Please provide at least some skills, experience, or education to analyze."),
        variant: "destructive",
      })
      return
    }

    setIsAnalyzing(true)
    setResult(null)

    toast({
      title: t("Analyzing Your Career..."),
      description: t("Our AI is mapping your career intelligence. This may take a moment."),
    })

    try {
      const input: CareerIntelligenceInput = {
        skills: skillsList,
        experience: experienceList,
        education: educationList,
        interests: interests || undefined,
        country,
      }

      const output = await analyzeCareerIntelligence(input)
      setResult(output)

      toast({
        title: t("Analysis Complete"),
        description: t("Your personalized career intelligence report is ready."),
      })
    } catch (error) {
      console.error("Career intelligence error:", error)
      toast({
        title: t("Analysis Failed"),
        description: t("Something went wrong. Please try again."),
        variant: "destructive",
      })
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Brain className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t("Career Intelligence Hub")}</h1>
          <p className="text-muted-foreground mt-1">
            {t("AI-powered career strategy personalized for the African job market")}
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {t("Your Profile")}
          </CardTitle>
          <CardDescription>
            {t("Tell us about yourself. The more detail you provide, the better our analysis.")}
            {profileSkills.length > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {t("Pre-filled from your profile")}
              </Badge>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="skills">{t("Skills")} *</Label>
              <Textarea
                id="skills"
                placeholder={t("e.g., Python, Data Analysis, Project Management, French, Excel")}
                value={skills}
                onChange={(e) => setSkills(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("Separate skills with commas")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="experience">{t("Work Experience")}</Label>
              <Textarea
                id="experience"
                placeholder={t("e.g., Marketing Intern at Orange CI (6 months)\nFreelance Web Developer (1 year)")}
                value={experience}
                onChange={(e) => setExperience(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("One entry per line")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="education">{t("Education")}</Label>
              <Textarea
                id="education"
                placeholder={t("e.g., BSc Computer Science, University of Ghana (2024)")}
                value={education}
                onChange={(e) => setEducation(e.target.value)}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">{t("One entry per line")}</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interests">{t("Career Interests & Goals")}</Label>
              <Textarea
                id="interests"
                placeholder={t("e.g., I want to transition into data science and eventually lead a tech team")}
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
            <div className="space-y-2 w-full sm:w-64">
              <Label>{t("Country")}</Label>
              <Select value={country} onValueChange={setCountry}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_COUNTRIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="lg"
              onClick={handleAnalyze}
              disabled={isAnalyzing}
              className="gap-2"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("Analyzing...")}
                </>
              ) : result ? (
                <>
                  <RefreshCw className="h-4 w-4" />
                  {t("Re-analyze")}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  {t("Analyze My Career")}
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      <AnimatePresence>
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="relative">
                  <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 h-16 w-16" />
                  <div className="relative bg-primary/10 p-4 rounded-full">
                    <Brain className="h-8 w-8 text-primary animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                  <h3 className="font-semibold text-lg">{t("Mapping your career intelligence...")}</h3>
                  <p className="text-sm text-muted-foreground mt-1 max-w-md">
                    {t("Our AI is analyzing your profile against the job market in")} {country}.{" "}
                    {t("This typically takes 15-30 seconds.")}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-10"
          >
            {/* Profile Summary */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-start gap-3">
                    <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h2 className="font-bold text-lg mb-1">{t("AI Profile Summary")}</h2>
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {result.profileSummary}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Action Items */}
            <ActionItems items={result.topActionItems} />

            {/* Career Paths */}
            <CareerPathMap paths={result.careerPaths} />

            {/* Skill Gap Analysis */}
            <SkillGapAnalyzer gaps={result.skillGaps} />

            {/* Market Pulse */}
            <MarketPulse insights={result.marketInsights} />

            {/* Salary Intelligence */}
            <SalaryIntelligence salaries={result.salaryIntelligence} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
