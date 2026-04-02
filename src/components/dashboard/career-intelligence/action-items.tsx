"use client"

import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, CheckCircle2 } from "lucide-react"

export function ActionItems({ items }: { items: string[] }) {
  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 p-2.5 rounded-lg">
            <Zap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-xl">Your Next Steps</CardTitle>
            <p className="text-sm text-muted-foreground">Prioritized actions to accelerate your career</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-lg bg-background/80 border"
            >
              <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm leading-relaxed">{item}</p>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
