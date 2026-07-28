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
import { JsonLd } from '@/components/seo/json-ld';
import {
  defaultDescription,
  organizationJsonLd,
  siteName,
  siteOrigin,
  websiteJsonLd,
} from '@/lib/seo';

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
  description: defaultDescription,
  metadataBase: siteOrigin,
  applicationName: siteName,
  authors: [{ name: 'Yahnu', url: siteOrigin }],
  creator: 'Yahnu',
  publisher: 'Yahnu',
  category: 'emploi et insertion professionnelle',
  keywords: [
    'emploi Côte d’Ivoire',
    'jeunes diplômés ivoiriens',
    'recrutement Abidjan',
    'stages Côte d’Ivoire',
    'insertion professionnelle',
    'universités Côte d’Ivoire',
    'compétences Afrique',
  ],
  formatDetection: {
    address: false,
    email: false,
    telephone: false,
  },
  openGraph: {
    type: 'website',
    locale: 'fr_CI',
    siteName,
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Yahnu — Le talent ivoirien en mouvement' }],
  },
  twitter: {
    card: 'summary_large_image',
    images: ['/twitter-image'],
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon',
  },
  manifest: '/manifest.webmanifest',
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
      <head>
        <JsonLd data={[organizationJsonLd, websiteJsonLd]} />
      </head>
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
