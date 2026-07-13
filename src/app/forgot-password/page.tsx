
"use client"

import { FormEvent, useState } from "react";
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
import { CheckCircle2, ChevronLeft, Loader2 } from "lucide-react";
import { useLocalization } from "@/context/localization-context";
import { apiFetch } from "@/lib/api-client";

export default function ForgotPasswordPage() {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: { debugUrl?: string } }>('/api/auth/password/forgot', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setDebugUrl(response.data.debugUrl ?? null);
      setSent(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t('Please try again.'));
    } finally {
      setIsSubmitting(false);
    }
  }
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center justify-center mb-6 text-center">
            <Link href="/" aria-label="Back to home">
                 <Logo className="h-12 w-12 text-primary" />
            </Link>
            <h1 className="text-2xl font-bold text-primary mt-2">Yahnu</h1>
            <p className="text-sm text-muted-foreground">{t('landing.hero.title')}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t('common.forgot_your_password')}</CardTitle>
            <CardDescription>
              {t('auth.forgot_password_desc')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {sent ? (
              <div className="space-y-4 text-center" role="status">
                <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {t('If an account exists for that address, a secure reset link is on its way.')}
                </p>
                {debugUrl && <Button asChild variant="outline" className="w-full"><Link href={debugUrl}>{t('Open local reset link')}</Link></Button>}
              </div>
            ) : <form className="grid gap-4" onSubmit={handleSubmit}>
              <div className="grid gap-2">
                <Label htmlFor="email">{t('common.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isSubmitting}
                />
              </div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? t('Sending...') : t('auth.send_reset_link')}
              </Button>
            </form>}
            <div className="mt-4 text-center text-sm">
              <Link
                href="/login"
                className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors"
                >
                <ChevronLeft className="h-4 w-4 mr-1"/>
                {t('auth.back_to_login')}
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
