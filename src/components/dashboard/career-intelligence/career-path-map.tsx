"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { Route, Star, ArrowRight, Clock } from "lucide-react"
import type { CareerIntelligenceOutput } from "@/ai/flows/career-intelligence"

type CareerPath = CareerIntelligenceOutput["careerPaths"][number]

function getFitColor(score: number) {
  if (score >= 75) return "text-green-600 dark:text-green-400"
  if (score >= 50) return "text-yellow-600 dark:text-yellow-400"
  return "text-orange-600 dark:text-orange-400"
}

function getFitBg(score: number) {
  if (score >= 75) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-orange-500"
}

function PathCard({ path, index }: { path: CareerPath; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.15 }}
    >
      <Card className="h-full hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-lg leading-snug">{path.title}</CardTitle>
            <div className={cn("flex items-center gap-1 font-bold text-lg shrink-0", getFitColor(path.fitScore))}>
              <Star className="h-4 w-4" />
              {path.fitScore}%
            </div>
          </div>
          <CardDescription className="text-sm">{path.reasoning}</CardDescription>
          <Progress value={path.fitScore} className={cn("h-2 mt-2 [&>div]:transition-all", `[&>div]:${getFitBg(path.fitScore)}`)} />
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            {path.roles.map((role, roleIdx) => (
              <div key={roleIdx} className="relative pb-6 last:pb-0">
                {/* Timeline connector */}
                {roleIdx < path.roles.length - 1 && (
                  <div className="absolute left-[-18px] top-6 w-0.5 h-full bg-border" />
                )}
                {/* Timeline dot */}
                <div className={cn(
                  "absolute left-[-22px] top-1.5 w-2.5 h-2.5 rounded-full border-2",
                  roleIdx === 0 ? "bg-primary border-primary" : "bg-background border-muted-foreground"
                )} />

                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-sm">{role.title}</span>
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      {role.yearsFromNow === 0 ? "Now" : `${role.yearsFromNow}y`}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{role.description}</p>
                  <div className="flex gap-1 flex-wrap pt-1">
                    {role.keySkillsNeeded.slice(0, 4).map((skill, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">{skill}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function CareerPathMap({ paths }: { paths: CareerPath[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <Route className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Career Path Map</h2>
          <p className="text-sm text-muted-foreground">AI-recommended career trajectories based on your profile</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {paths.map((path, i) => (
          <PathCard key={i} path={path} index={i} />
        ))}
      </div>
    </div>
  )
}
