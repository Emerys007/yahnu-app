
"use client"

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Logo } from "@/components/ui/logo";
import { ChevronLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
            <Link href="/" aria-label="Back to home">
                 <Logo className="h-12 w-12 text-primary" />
            </Link>
            <h1 className="text-2xl font-bold text-primary mt-2">Yahnu</h1>
            <p className="text-sm text-muted-foreground">Connecter les talents à l'opportunité.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Mot de passe oublié ?</CardTitle>
            <CardDescription>
              Ne vous inquiétez pas, cela arrive. Entrez votre email et nous vous enverrons un lien de réinitialisation.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
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
                Envoyer le lien de réinitialisation
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link
                href="/login"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                <ChevronLeft className="h-4 w-4 mr-1"/>
                Retour à la connexion
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
