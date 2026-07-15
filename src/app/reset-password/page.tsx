"use client";

import { FormEvent, Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/ui/logo';
import { PasswordInput } from '@/components/ui/password-input';
import { apiFetch } from '@/lib/api-client';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password !== confirmation) return setError('Passwords do not match.');
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch('/api/auth/password/reset', { method: 'POST', body: JSON.stringify({ token, password }) });
      setDone(true);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'The password could not be reset.');
    } finally {
      setSubmitting(false);
    }
  }

  if (done) return (
    <div className="space-y-4 text-center">
      <CheckCircle2 className="mx-auto h-12 w-12 text-primary" />
      <p>Your password has been updated and all older sessions have been signed out.</p>
      <Button asChild className="w-full"><Link href="/login">Continue to sign in</Link></Button>
    </div>
  );

  if (!token) return <p className="text-center text-destructive">This reset link is incomplete. Request a new link and try again.</p>;

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2"><Label htmlFor="password">New password</Label><PasswordInput id="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={12} required autoComplete="new-password" /></div>
      <div className="space-y-2"><Label htmlFor="confirmation">Confirm new password</Label><PasswordInput id="confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={12} required autoComplete="new-password" hideSuggestions /></div>
      <p className="text-xs text-muted-foreground">Use at least 12 characters with a letter and a number.</p>
      {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
      <Button className="w-full" disabled={submitting}>{submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{submitting ? 'Updating password…' : 'Update password'}</Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4"><Card className="w-full max-w-md"><CardHeader className="text-center"><Logo className="mx-auto h-12 w-12" /><CardTitle>Choose a new password</CardTitle><CardDescription>This secure link can be used once and expires after one hour.</CardDescription></CardHeader><CardContent><Suspense fallback={<Loader2 className="mx-auto h-8 w-8 animate-spin" />}><ResetPasswordForm /></Suspense></CardContent></Card></div>;
}

