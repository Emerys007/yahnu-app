"use client"

import { motion } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { DollarSign, Info } from "lucide-react"
import type { CareerIntelligenceOutput } from "@/ai/flows/career-intelligence"

type SalaryRange = CareerIntelligenceOutput["salaryIntelligence"][number]

function SalaryCard({ salary, index }: { salary: SalaryRange; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="h-full hover:shadow-md transition-shadow">
        <CardContent className="p-5">
          <h3 className="font-bold text-base mb-1">{salary.role}</h3>
          <p className="text-xs text-muted-foreground mb-4">{salary.currency}</p>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Entry Level</span>
              <span className="font-semibold text-sm">{salary.entryLevel}</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary/60 via-primary to-primary/80 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: index * 0.1 + 0.3, duration: 0.8 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Mid Level</span>
              <span className="font-semibold text-sm">{salary.midLevel}</span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-primary to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: index * 0.1 + 0.5, duration: 0.8 }}
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Senior Level</span>
              <span className="font-bold text-sm text-primary">{salary.seniorLevel}</span>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 rounded-md p-2.5">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
            <span>{salary.note}</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

export function SalaryIntelligence({ salaries }: { salaries: SalaryRange[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-primary/10 p-2.5 rounded-lg">
          <DollarSign className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Salary Intelligence</h2>
          <p className="text-sm text-muted-foreground">Expected salary ranges for recommended roles in your region</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {salaries.map((salary, i) => (
          <SalaryCard key={i} salary={salary} index={i} />
        ))}
      </div>
    </div>
  )
}
