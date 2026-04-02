"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { Target, AlertTriangle, ArrowUp, Minus, ChevronRight } from "lucide-react"
import type { CareerIntelligenceOutput } from "@/ai/flows/career-intelligence"

type SkillGap = CareerIntelligenceOutput["skillGaps"][number]

const levelMap = { none: 0, beginner: 1, intermediate: 2, advanced: 3, expert: 4 }
const levelLabels = { none: "None", beginner: "Beginner", intermediate: "Intermediate", advanced: "Advanced", expert: "Expert" }

const priorityConfig = {
  critical: { color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30", icon: AlertTriangle, label: "Critical" },
  high: { color: "bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/30", icon: ArrowUp, label: "High" },
  medium: { color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30", icon: Minus, label: "Medium" },
  low: { color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30", icon: ChevronRight, label: "Low" },
}

function LevelBar({ current, target }: { current: number; target: number }) {
  const maxLevel = 4
  return (
    <div className="flex gap-1 items-center">
      {Array.from({ length: maxLevel }).map((_, i) => {
        const filled = i < current
        const isTarget = i < target
        return (
          <div
            key={i}
            className={cn(
              "h-2.5 flex-1 rounded-sm transition-colors",
              filled ? "bg-primary" : isTarget ? "bg-primary/20 border border-dashed border-primary/40" : "bg-muted"
            )}
          />
        )
      })}
    </div>
  )
}

function SkillGapCard({ gap, index }: { gap: SkillGap; index: number }) {
  const config = priorityConfig[gap.priority]
  const PriorityIcon = config.icon
  const currentNum = levelMap[gap.currentLevel]
  const targetNum = levelMap[gap.targetLevel]

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-sm truncate">{gap.skill}</h3>
                <Badge variant="outline" className={cn("text-xs shrink-0 gap-1", config.color)}>
                  <PriorityIcon className="h-3 w-3" />
                  {config.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                <span>{levelLabels[gap.currentLevel]}</span>
                <ArrowUp className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground">{levelLabels[gap.targetLevel]}</span>
              </div>
              <LevelBar current={currentNum} target={targetNum} />
            </div>
          </div>
          <p className="text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
            {gap.recommendation}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SkillGapAnalyzer({ gaps }: { gaps: SkillGap[] }) {
  const sortedGaps = [...gaps].sort((a, b) => {
    const order = { critical: 0, high: 1, medium: 2, low: 3 }
    return order[a.priority] - order[b.priority]
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Skill Gap Analysis</h2>
          <p className="text-sm text-muted-foreground">Skills you need to develop, prioritized by impact</p>
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {sortedGaps.map((gap, i) => (
          <SkillGapCard key={i} gap={gap} index={i} />
        ))}
      </div>
    </div>
  )
}
