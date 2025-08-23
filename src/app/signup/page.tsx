
"use client"

import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/ui/logo';

export default function SignupPage() {
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background order-2 lg:order-1">
       <div className="w-full max-w-md space-y-8">
            <div className="flex flex-col items-center gap-2 mb-8 text-center lg:hidden">
              <Link href="/">
                <Logo className="h-16 w-16" />
              </Link>
              <h1 className="text-3xl font-bold text-primary">Yahnu</h1>
              <p className="text-muted-foreground">Votre avenir commence ici</p>
            </div>
           <RegisterForm />
       </div>
     </div>
      <div className="hidden bg-primary/10 lg:flex flex-col items-center justify-center p-12 order-1 lg:order-2">
        <Link href="/" className="flex flex-col items-center gap-2 mb-8 text-center">
           <Logo className="h-16 w-16" />
           <h1 className="text-4xl font-bold text-primary">Yahnu</h1>
           <p className="text-muted-foreground">Votre avenir commence ici</p>
        </Link>
        <Image
          src="/images/Community.jpeg"
          alt="Communauté Yahnu"
          width="800"
          height="600"
          className="rounded-xl shadow-2xl"
          data-ai-hint="communauté de professionnels africains"
        />
        <div className="mt-8 text-center max-w-lg">
          <h2 className="text-3xl font-bold tracking-tight">Rejoignez une communauté florissante</h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Créez votre compte pour débloquer un monde d'opportunités et de connexions.
          </p>
        </div>
      </div>
    </div>
  );
}
