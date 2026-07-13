"use client";

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Logo } from '@/components/ui/logo';
import { apiFetch } from '@/lib/api-client';

function VerificationAction() {
  const token = useSearchParams().get('token') ?? '';
  const [state, setState] = useState<'ready' | 'loading' | 'done'>('ready');
  const [error, setError] = useState<string | null>(null);
  const [reauthenticationRequired, setReauthenticationRequired] = useState(false);

  async function verify() {
    setState('loading');
    setError(null);
    try {
      const response = await apiFetch<{ data: { reauthenticationRequired: boolean } }>('/api/auth/verify', {
        method: 'POST',
        body: JSON.stringify({ token }),
      });
      setReauthenticationRequired(response.data.reauthenticationRequired);
      setState('done');
    } catch (verificationError) {
      setState('ready');
      setError(verificationError instanceof Error ? verificationError.message : 'Your email could not be verified.');
    }
  }

  if (!token) {
    return <p className="text-center text-destructive">This verification link is incomplete.</p>;
  }

  if (state === 'done') {
    return (
      <div className="space-y-4 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
        <p>
          {reauthenticationRequired
            ? 'Your email was changed securely. All previous sessions were signed out, so sign in again with your new address.'
            : 'Your email is verified. If your account has also been approved, you can sign in now.'}
        </p>
        <Button className="w-full" onClick={() => window.location.assign('/login')}>Continue to sign in</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 text-center">
      <MailCheck className="mx-auto h-12 w-12 text-primary" />
      <p className="text-sm text-muted-foreground">
        For your security, confirm the action below. The link is one-time use.
      </p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button className="w-full" onClick={verify} disabled={state === 'loading'}>
        {state === 'loading' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {state === 'loading' ? 'Verifying…' : 'Verify my email'}
      </Button>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <Logo className="mx-auto h-12 w-12" />
          <CardTitle>Verify your email</CardTitle>
          <CardDescription>One final step keeps your Yahnu account secure.</CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}>
            <VerificationAction />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
