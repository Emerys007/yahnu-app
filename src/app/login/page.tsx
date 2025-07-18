
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/ui/logo';
import { useLocalization } from '@/context/localization-context';
import { useCountry } from '@/context/country-context';
import { WaitlistForm } from '@/components/auth/waitlist-form';

export default function LoginPage() {
  const { t } = useLocalization();
  const { country } = useCountry();

  const isLaunchCountry = country.code === 'CI';

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="hidden bg-primary/10 lg:flex flex-col items-center justify-center p-12">
        <Link href="/" className="flex flex-col items-center gap-2 mb-8 text-center">
           <Logo className="h-16 w-16" />
           <h1 className="text-4xl font-bold text-primary">Yahnu</h1>
           <p className="text-muted-foreground">{t('Your future starts here')}</p>
        </Link>
        <Image
          src="/images/Community.jpeg"
          alt="Yahnu Community"
          width="800"
          height="600"
          className="rounded-xl shadow-2xl"
          data-ai-hint="african professionals community"
        />
        <div className="mt-8 text-center max-w-lg">
          <h2 className="text-3xl font-bold tracking-tight">{t('Connect. Grow. Succeed.')}</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            {t('Your journey to the perfect career or the ideal candidate starts here.')}
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background">
        <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center gap-2 mb-8 text-center lg:hidden">
              <Link href="/">
                <Logo className="h-16 w-16" />
              </Link>
              <h1 className="text-3xl font-bold text-primary">Yahnu</h1>
              <p className="text-muted-foreground">{t('Your future starts here')}</p>
            </div>
            {isLaunchCountry ? <LoginForm /> : <WaitlistForm />}
        </div>
      </div>
    </div>
  );
}
