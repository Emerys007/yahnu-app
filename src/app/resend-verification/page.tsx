"use client";

import { FormEvent, useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { useLocalization } from '@/context/localization-context';
import { apiFetch } from '@/lib/api-client';

export default function ResendVerificationPage() {
  const { t } = useLocalization();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debugUrl, setDebugUrl] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const response = await apiFetch<{ data: { debugUrl?: string } }>('/api/auth/verify/resend', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      setDebugUrl(response.data.debugUrl ?? null);
      setSent(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : t('auth.resend_verification.generic_error'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Link href="/" className="mx-auto"><Logo className="h-12 w-12" /></Link>
          <CardTitle>{t('auth.resend_verification.title')}</CardTitle>
          <CardDescription>{t('auth.resend_verification.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center" role="status">
              <CheckCircle2 className="mx-auto h-10 w-10 text-primary" />
              <p className="text-sm text-muted-foreground">{t('auth.resend_verification.success')}</p>
              {debugUrl && <Button asChild variant="outline" className="w-full"><Link href={debugUrl}>{t('auth.resend_verification.debug_link')}</Link></Button>}
              <Button asChild className="w-full"><Link href="/login">{t('auth.back_to_login')}</Link></Button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={submit}>
              <div className="space-y-2"><Label htmlFor="email">{t('auth.resend_verification.email_address')}</Label><Input id="email" type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} disabled={submitting} /></div>
              {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
              <Button className="w-full" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{submitting ? t('auth.resend_verification.sending') : t('auth.resend_verification.send')}</Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
