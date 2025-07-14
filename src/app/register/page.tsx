import Image from 'next/image';
import Link from 'next/link';
import { RegisterForm } from '@/components/auth/register-form';
import { Logo } from '@/components/logo';
import { useLocalization } from '@/context/localization-context';

export default function RegisterPage() {
  const { t } = useLocalization();
  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      <div className="flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-background order-2 lg:order-1">
       <div className="w-full max-w-md space-y-8">
           <RegisterForm />
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
