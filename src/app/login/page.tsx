
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { LoginForm } from '@/components/auth/login-form';
import { Logo } from '@/components/logo';
import { useLocalization } from '@/context/localization-context';

export default function LoginPage() {
  const { t } = useLocalization();

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="hidden bg-primary/10 lg:flex flex-col items-center justify-center p-12">
        <Link href="/" className="flex items-center gap-4 mb-8">
           <Logo className="h-12 w-12 text-primary" />
            <div>
              <h1 className="text-4xl font-bold text-primary">Yahnu</h1>
            </div>
        </Link>
        <Image
          src="https://placehold.co/800x600.png"
          alt="Yahnu Platform Showcase"
          width="800"
          height="600"
          className="rounded-xl shadow-2xl"
          data-ai-hint="graduates career"
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
            <LoginForm />
        </div>
      </div>
    </div>
  );
}
