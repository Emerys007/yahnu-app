
"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Mail } from "lucide-react"

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">Bientôt disponible</CardTitle>
        <CardDescription className="text-center">
            {submitted ? 
                'Merci ! Nous vous informerons lorsque Yahnu sera disponible.' : 
                'Yahnu n\'est pas encore disponible dans votre pays. Entrez votre email pour être averti lors du lancement !'
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submitted && (
            <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                />
            </div>
            <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                M'avertir
            </Button>
            </form>
        )}
         {submitted && (
             <div className="text-center">
                <p className="text-5xl mb-4">🎉</p>
                <p>Vous êtes sur la liste !</p>
             </div>
         )}

         <div className="mt-4 text-center text-sm">
          <Link href="/" className="underline">
            Retour à l'accueil
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
