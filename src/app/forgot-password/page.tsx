
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
import { useLocalization } from "@/context/localization-context";

export default function ForgotPasswordPage() {
  const { t } = useLocalization();
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-6">
            <Link href="/" aria-label="Back to home">
                 <Logo className="h-12 w-12 text-primary" />
            </Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('Forgot Password?')}</CardTitle>
            <CardDescription>
              {t('No problem. Enter your email address and we\'ll send you a link to reset your password.')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4">
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
                {t('Send Reset Link')}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <Link
                href="/login"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                <ChevronLeft className="h-4 w-4 mr-1"/>
                {t('Back to login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
