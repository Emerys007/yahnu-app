
"use client"

import { BarChart3 } from "lucide-react"
import { AnalyticsClient } from "./analytics-client"
import { motion } from "framer-motion"

const analyticsData = {
    totalUsers: 1256,
    pendingRegistrations: 5,
    activeCompanies: 48,
    activeSchools: 12,
    activeGraduates: 1196,
    userGrowthData: [
        { month: "January", users: 150, details: { newGraduates: 140, newCompanies: 8, newSchools: 2 } },
        { month: "February", users: 280, details: { newGraduates: 250, newCompanies: 25, newSchools: 5 } },
        { month: "March", users: 450, details: { newGraduates: 420, newCompanies: 20, newSchools: 10 } },
        { month: "April", users: 680, details: { newGraduates: 650, newCompanies: 20, newSchools: 10 } },
        { month: "May", users: 950, details: { newGraduates: 900, newCompanies: 40, newSchools: 10 } },
        { month: "June", users: 1256, details: { newGraduates: 1196, newCompanies: 48, newSchools: 12 } },
    ],
    userDistribution: [
        { name: "Graduates", value: 1196, fill: "var(--color-graduates)" },
        { name: "Companies", value: 48, fill: "var(--color-companies)" },
        { name: "Schools", value: 12, fill: "var(--color-schools)" },
    ]
}

export default function AdminAnalyticsPage() {
    return (
        <div className="space-y-8">
            <motion.div 
                className="flex items-start justify-between"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
            >
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <BarChart3 className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Analytique de la Plateforme</h1>
                        <p className="text-muted-foreground mt-1">Aperçu de la croissance et de l'engagement des utilisateurs.</p>
                    </div>
                </div>
            </motion.div>

            <AnalyticsClient data={analyticsData} />
        </div>
    )
}
