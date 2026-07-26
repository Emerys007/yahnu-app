import type { Metadata } from 'next';
import { Afacad_Flux, Bricolage_Grotesque } from 'next/font/google';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ui/theme-provider';
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ConfettiProvider } from '@/context/confetti-context';
import { LocalizationProvider } from '@/context/localization-context';
import { CountryProvider } from '@/context/country-context';

const bodyFont = Afacad_Flux({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const displayFont = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Yahnu — Le talent ivoirien en mouvement',
    template: '%s | Yahnu',
  },
  description: 'La plateforme ivoirienne qui relie jeunes diplômés, établissements, entreprises et institutions pour transformer la formation en insertion mesurée.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://yahnu.org'),
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="fr-CI"
      data-theme="ivory-coast"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={cn(bodyFont.variable, displayFont.variable)}
    >
      <head />
      <body className="font-body antialiased selection:bg-terra/25 selection:text-foreground" suppressHydrationWarning>
        <AuthProvider>
          <CountryProvider>
            <LocalizationProvider>
              <ConfettiProvider>
                <ThemeProvider
                  attribute="class"
                  defaultTheme="light"
                  enableSystem
                  disableTransitionOnChange
                >
                  <div vaul-drawer-wrapper="">
                    <div className="relative flex min-h-screen flex-col bg-background">
                      {children}
                    </div>
                  </div>
                  <Toaster />
                </ThemeProvider>
              </ConfettiProvider>
            </LocalizationProvider>
          </CountryProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
