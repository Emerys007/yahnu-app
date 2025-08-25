
import type {Metadata} from 'next';
import { Inter, Playfair_Display } from 'next/font/google'
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ui/theme-provider";
import { cn } from '@/lib/utils';
import { AuthProvider } from '@/context/auth-context';
import { ConfettiProvider } from '@/context/confetti-context';
import { LocalizationProvider } from '@/context/localization-context';
import { CountryProvider } from '@/context/country-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: 'Yahnu',
  description: 'Une plateforme pour les diplômés, les entreprises et les écoles pour se connecter et trouver des opportunités d\'emploi.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn(inter.variable, playfair.variable)}>
      <head>
        <link rel="dns-prefetch" href="//js.hs-scripts.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="font-body antialiased">
        <AuthProvider>
          <CountryProvider>
            <LocalizationProvider>
              <ConfettiProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
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
        <Script
          id="hs-script-loader"
          src="//js.hs-scripts.com/8886743.js?businessUnitId=2764550"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
