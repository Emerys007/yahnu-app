
"use client"

import { useLocalization } from "@/context/localization-context";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, BrainCircuit, Code, DollarSign, Leaf, Truck } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";

const assessments = [
  {
    id: "frontend-basics",
    title: "Frontend Development (React)",
    description: "Validate your fundamental skills in React, JavaScript, and modern CSS.",
    questions: 10,
    time: 20,
    icon: Code,
    category: "IT & Telecoms"
  },
  {
    id: "financial-analysis",
    title: "Financial Analysis Fundamentals",
    description: "Test your knowledge of financial statements, valuation, and modeling.",
    questions: 10,
    time: 20,
    icon: DollarSign,
    category: "Finance & Banking"
  },
  {
    id: "agronomy-principles",
    title: "Modern Agronomy Principles",
    description: "Assess your understanding of crop science, soil management, and sustainable practices.",
    questions: 10,
    time: 15,
    icon: Leaf,
    category: "Agriculture"
  },
   {
    id: "supply-chain",
    title: "Supply Chain Essentials",
    description: "Demonstrate your expertise in logistics, inventory management, and transportation.",
    questions: 10,
    time: 15,
    icon: Truck,
    category: "Logistics"
  },
  {
    id: "cognitive-aptitude",
    title: "Cognitive Aptitude Test",
    description: "Measure your problem-solving, critical thinking, and numerical reasoning skills.",
    questions: 10,
    time: 15,
    icon: BrainCircuit,
    category: "General Aptitude"
  }
];

export default function AssessmentsPage() {
    const { t } = useLocalization();
    const categories = [...new Set(assessments.map(a => a.category))];
    
    return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('Skill Certifications')}</h1>
          <p className="text-muted-foreground mt-1">{t('Prove your skills by taking our proctored assessments and earn badges for your profile.')}</p>
        </div>
      </div>

      {categories.map(category => (
        <div key={category}>
            <h2 className="text-2xl font-bold tracking-tight mb-4">{t(category)}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.filter(a => a.category === category).map((assessment) => (
                <Card key={assessment.id}>
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                        <div className="bg-muted p-3 rounded-full">
                            <assessment.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>{t(assessment.title)}</CardTitle>
                            <CardDescription className="mt-1">{t(assessment.description)}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{t('{count} questions', { count: assessment.questions })}</span>
                            <span>{t('{count} minutes', { count: assessment.time })}</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full">
                            <Link href={`/dashboard/assessment/${assessment.id}`}>{t('Start Assessment')}</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        </div>
      ))}
    </div>
    )
}
