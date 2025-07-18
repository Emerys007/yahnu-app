
import type {Metadata} from 'next';
import { Inter } from 'next/font/google'
import Script from 'next/script';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from "@/components/ui/theme-provider";
import { cn } from '@/lib/utils';
import { LocalizationProvider } from '@/context/localization-context';
import { AuthProvider } from '@/context/auth-context';
import { CountryProvider } from '@/context/country-context';
import { ConfettiProvider } from '@/context/confetti-context';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

export const metadata: Metadata = {
  title: 'Yahnu',
  description: 'A platform for graduates, companies, and schools to connect and find job opportunities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={cn(inter.variable)}>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
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
