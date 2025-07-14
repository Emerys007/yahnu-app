import type {Metadata} from 'next';
import { Inter, Space_Grotesk } from 'next/font/google'
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import { cn } from '@/lib/utils';
import { LocalizationProvider } from '@/context/localization-context';
import { CountryProvider } from '@/context/country-context';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
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
    <html lang="en" suppressHydrationWarning className={cn(inter.variable, spaceGrotesk.variable)}>
      <head />
      <body className="font-body antialiased" suppressHydrationWarning>
        <CountryProvider>
          <LocalizationProvider>
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
              <ScrollToTop />
            </ThemeProvider>
          </LocalizationProvider>
        </CountryProvider>
      </body>
    </html>
  );
}
