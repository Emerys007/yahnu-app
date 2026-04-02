"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { TrendingUp, Building2, Activity } from "lucide-react"
import type { CareerIntelligenceOutput } from "@/ai/flows/career-intelligence"

type MarketInsight = CareerIntelligenceOutput["marketInsights"][number]

const demandConfig = {
  very_high: { label: "Very High Demand", color: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30" },
  high: { label: "High Demand", color: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30" },
  moderate: { label: "Moderate Demand", color: "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border-yellow-500/30" },
  low: { label: "Low Demand", color: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30" },
}

const trendConfig = {
  rapidly_growing: { label: "Rapidly Growing", icon: "🚀" },
  growing: { label: "Growing", icon: "📈" },
  stable: { label: "Stable", icon: "➡️" },
  declining: { label: "Declining", icon: "📉" },
}

function MarketCard({ insight, index }: { insight: MarketInsight; index: number }) {
  const demand = demandConfig[insight.demandLevel]
  const trend = trendConfig[insight.growthTrend]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.12 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-2 mb-3">
            <h3 className="font-bold text-base">{insight.sector}</h3>
            <span className="text-lg" title={trend.label}>{trend.icon}</span>
          </div>

          <div className="flex gap-2 flex-wrap mb-3">
            <Badge variant="outline" className={cn("text-xs", demand.color)}>
              {demand.label}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {trend.label}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-4">{insight.insight}</p>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
              <Building2 className="h-3 w-3" /> Top Employers
            </p>
            <div className="flex gap-1.5 flex-wrap">
              {insight.topEmployers.map((employer, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {employer}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function MarketPulse({ insights }: { insights: MarketInsight[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <Activity className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Market Pulse</h2>
          <p className="text-sm text-muted-foreground">Job market insights for your region and field</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {insights.map((insight, i) => (
          <MarketCard key={i} insight={insight} index={i} />
        ))}
      </div>
    </div>
  )
}
