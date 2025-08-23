
"use client"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Award, BrainCircuit, Code, DollarSign, Leaf, Truck, HeartHandshake } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

const assessments = [
  {
    id: "frontend-basics",
    title: "Développement Frontend (React)",
    description: "Validez vos compétences fondamentales en React, JavaScript et CSS moderne.",
    questions: 20,
    time: 35,
    icon: Code,
    category: "IT & Télécoms"
  },
  {
    id: "financial-analysis",
    title: "Principes de l'Analyse Financière",
    description: "Testez vos connaissances sur les états financiers, l'évaluation et la modélisation.",
    questions: 20,
    time: 35,
    icon: DollarSign,
    category: "Finance & Banque"
  },
  {
    id: "agronomy-principles",
    title: "Principes d'Agronomie Moderne",
    description: "Évaluez votre compréhension de la science des cultures, de la gestion des sols et des pratiques durables.",
    questions: 20,
    time: 30,
    icon: Leaf,
    category: "Agriculture"
  },
   {
    id: "supply-chain",
    title: "Essentiels de la Chaîne d'Approvisionnement",
    description: "Démontrez votre expertise en logistique, gestion des stocks et transport.",
    questions: 20,
    time: 30,
    icon: Truck,
    category: "Logistique"
  },
  {
    id: "customer-service",
    title: "Excellence du Service Client",
    description: "Prouvez votre capacité à traiter les demandes des clients et à résoudre les problèmes efficacement.",
    questions: 20,
    time: 30,
    icon: HeartHandshake,
    category: "Professionnel Général"
  },
  {
    id: "cognitive-aptitude",
    title: "Test d'Aptitude Cognitive",
    description: "Mesurez vos compétences en résolution de problèmes, en pensée critique et en raisonnement numérique.",
    questions: 20,
    time: 25,
    icon: BrainCircuit,
    category: "Professionnel Général"
  }
];

export default function AssessmentsPage() {
    const categories = [...new Set(assessments.map(a => a.category))].sort((a, b) => a.localeCompare(b));
    
    return (
    <div className="space-y-8">
       <motion.div 
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
        <div className="bg-primary/10 p-3 rounded-lg">
          <Award className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Certifications de Compétences</h1>
          <p className="text-muted-foreground mt-1">Prouvez vos compétences en passant nos évaluations surveillées et gagnez des badges pour votre profil.</p>
        </div>
      </motion.div>

      {categories.map((category, i) => (
        <motion.div 
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
        >
            <h2 className="text-2xl font-bold tracking-tight mb-4">{category}</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {assessments.filter(a => a.category === category).map((assessment) => (
                <Card key={assessment.id}>
                    <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                        <div className="bg-muted p-3 rounded-full">
                            <assessment.icon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle>{assessment.title}</CardTitle>
                            <CardDescription className="mt-1">{assessment.description}</CardDescription>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{assessment.questions} questions</span>
                            <span>{assessment.time} minutes</span>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button asChild className="w-full" data-hs-event-name="assessment_started">
                            <Link href={`/dashboard/assessment/${assessment.id}`}>Démarrer l'évaluation</Link>
                        </Button>
                    </CardFooter>
                </Card>
            ))}
            </div>
        </motion.div>
      ))}
    </div>
    )
}
