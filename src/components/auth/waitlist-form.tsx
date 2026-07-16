"use client";

import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function WaitlistForm() {
  return (
    <Card className="mx-auto max-w-md border-primary/20">
      <CardHeader className="text-center">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-primary/10 text-primary"><MapPin className="h-5 w-5" aria-hidden="true" /></span>
        <CardTitle className="pt-3 text-2xl">Yahnu est d’abord disponible en Côte d’Ivoire</CardTitle>
        <CardDescription className="leading-6">Les inscriptions sont actuellement réservées aux diplômés, employeurs et établissements liés à la Côte d’Ivoire. Aucun e-mail n’est collecté sur cet écran.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" className="w-full" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Retour à l’accueil</Link></Button>
      </CardContent>
    </Card>
  );
}
