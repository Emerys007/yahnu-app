
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
import { Logo } from "@/components/logo"
import { useLocalization } from "@/context/localization-context"
import { useCountry } from "@/context/country-context"
import { Mail } from "lucide-react"

export function WaitlistForm() {
  const { t, countryName } = useLocalization();
  const { country } = useCountry();
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  }

  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle className="text-2xl text-center">{t('Coming Soon to {country}', { country: countryName })}</CardTitle>
        <CardDescription className="text-center">
            {submitted ? 
                t('Thank you! We will notify you when Yahnu is available in {country}.', { country: countryName }) : 
                t('Yahnu is not yet available in your country. Enter your email to be notified when we launch!')
            }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!submitted && (
            <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                />
            </div>
            <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                {t('Notify Me')}
            </Button>
            </form>
        )}
         {submitted && (
             <div className="text-center">
                <p className="text-5xl mb-4">🎉</p>
                <p>{t("You're on the list!")}</p>
             </div>
         )}

         <div className="mt-4 text-center text-sm">
          <Link href="/" className="underline">
            {t('Go back to the homepage')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
