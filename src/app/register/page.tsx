
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/logo';
import { useLocalization } from '@/context/localization-context';
import { useCountry } from '@/context/country-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useState, useEffect } from 'react';
import { Skeleton } from '@/components/ui/skeleton';


const WaitlistForm = () => {
    const { t, countryName } = useLocalization();
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <Card className="mx-auto max-w-sm">
            <CardHeader>
                <div className="flex justify-center mb-4 lg:hidden">
                    <Logo className="h-12 w-12 text-primary" />
                </div>
                <CardTitle className="text-2xl text-center">{t('Coming Soon to {country}', { country: countryName })}</CardTitle>
                {!submitted ? (
                     <CardDescription className="text-center">
                        {t('Yahnu is not yet available in your country. Enter your email to be notified when we launch!')}
                     </CardDescription>
                ) : (
                    <CardDescription className="text-center text-primary">
                        {t('Thank you! We will notify you when Yahnu is available in {country}.', { country: countryName })}
                    </CardDescription>
                )}
            </CardHeader>
            {!submitted && (
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">{t('Email')}</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <Button type="submit" className="w-full">
                            {t('Notify Me')}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        {t('Already have an account?')}
                        <Link href="/login" className="underline ml-1">
                            {t('Sign in')}
                        </Link>
                    </div>
                </CardContent>
            )}
        </Card>
    )
}


export default function RegisterPage() {
  const { t } = useLocalization();
  const { isLaunchCountry } = useCountry();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background order-2 lg:order-1">
       <div className="w-full max-w-md space-y-8">
           {isClient ? (
                isLaunchCountry ? <RegisterForm /> : <WaitlistForm />
           ) : (
              <div className="w-full max-w-sm mx-auto">
                <Skeleton className="h-[600px] w-full" />
              </div>
           )}
       </div>
     </div>
      <div className="hidden bg-primary/10 lg:flex flex-col items-center justify-center p-12 order-1 lg:order-2">
        <Link href="/" className="flex items-center gap-4 mb-8">
           <Logo className="h-12 w-12 text-primary" />
           <h1 className="text-4xl font-bold text-primary">Yahnu</h1>
        </Link>
        <Image
          src="https://placehold.co/800x600.png"
          alt="Yahnu Platform Showcase"
          width="800"
          height="600"
          className="rounded-xl shadow-2xl"
          data-ai-hint="team collaboration"
        />
        <div className="mt-8 text-center max-w-lg">
          <h2 className="text-3xl font-bold tracking-tight">{t('Join a Thriving Community')}</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t('Create your account to unlock a world of opportunities and connections.')}
          </p>
        </div>
      </div>
    </div>
  );
}
