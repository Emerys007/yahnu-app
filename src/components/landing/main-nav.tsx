"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Languages, Menu, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useLocalization } from '@/context/localization-context';

const navLinks = [
  { href: '/be-the-change', fr: 'BE THE CHANGE', en: 'BE THE CHANGE' },
  { href: '/students', fr: 'Jeunes', en: 'Graduates' },
  { href: '/schools', fr: 'Établissements', en: 'Schools' },
  { href: '/companies', fr: 'Entreprises', en: 'Employers' },
  { href: '/institutions', fr: 'Institutions', en: 'Institutions' },
  { href: '/jobs', fr: 'Opportunités', en: 'Opportunities' },
  { href: '/impact', fr: 'Impact', en: 'Impact' },
  { href: '/blog', fr: 'Ressources', en: 'Resources' },
  { href: '/contact?intent=pilot', fr: 'Pilote', en: 'Pilot' },
];

export function MainNav() {
  const { language, setLanguage } = useLocalization();
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const isFrench = language === 'fr';
  const isDark = mounted && resolvedTheme === 'dark';

  useEffect(() => setMounted(true), []);

  const links = (
    <>
      {navLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className="rounded-lg px-2 py-2 text-[0.78rem] font-semibold text-foreground/70 transition-colors hover:bg-primary/[0.07] hover:text-primary 2xl:px-3 2xl:text-sm"
        >
          {isFrench ? link.fr : link.en}
        </Link>
      ))}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-border/70 bg-background/92 backdrop-blur-xl">
      <div className="page-shell flex h-[4.75rem] items-center gap-4">
        <Link href="/" className="group flex items-center gap-2.5" aria-label="Accueil Yahnu">
          <Logo className="h-11 w-11 text-foreground transition-transform duration-200 group-hover:rotate-3" />
          <span className="leading-none">
            <span className="block font-headline text-xl font-bold tracking-[-0.03em]">Yahnu</span>
            <span className="mt-1 block text-[0.68rem] font-bold uppercase tracking-[0.14em] text-primary">Côte d’Ivoire</span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-0.5 xl:flex" aria-label="Navigation principale">
          {links}
        </nav>

        <div className="ml-auto hidden items-center gap-1.5 xl:ml-2 xl:flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setLanguage(isFrench ? 'en' : 'fr')}
            aria-label={isFrench ? 'Switch to English' : 'Passer en français'}
          >
            <Languages />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
            aria-label={mounted
              ? (isDark ? 'Activer le thème clair' : 'Activer le thème sombre')
              : 'Changer de thème'}
          >
            {isDark ? <Sun /> : <Moon />}
          </Button>
          <Button variant="outline" asChild><Link href="/login">{isFrench ? 'Se connecter' : 'Sign in'}</Link></Button>
          <Button variant="terra" asChild><Link href="/signup">{isFrench ? 'Créer mon profil' : 'Create my profile'}</Link></Button>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="ml-auto xl:hidden" aria-label="Ouvrir le menu">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="flex w-[min(90vw,24rem)] flex-col bg-background p-0">
            <SheetHeader className="border-b p-5 text-left">
              <SheetTitle>
                <SheetClose asChild>
                  <Link href="/" className="flex items-center gap-3">
                    <Logo className="h-10 w-10 text-foreground" />
                    <span className="font-headline text-xl font-bold">Yahnu Côte d’Ivoire</span>
                  </Link>
                </SheetClose>
              </SheetTitle>
              <SheetDescription className="sr-only">
                {isFrench
                  ? 'Navigation principale, préférences et accès au compte Yahnu.'
                  : 'Main navigation, preferences, and Yahnu account access.'}
              </SheetDescription>
            </SheetHeader>
            <nav className="flex flex-1 flex-col gap-1 p-4" aria-label="Navigation mobile">
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link href={link.href} className="rounded-xl px-4 py-3 text-lg font-semibold hover:bg-primary/[0.08]">
                    {isFrench ? link.fr : link.en}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="safe-bottom space-y-3 border-t bg-card/60 p-4">
              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => setLanguage(isFrench ? 'en' : 'fr')}><Languages />{isFrench ? 'English' : 'Français'}</Button>
                <Button variant="outline" onClick={() => setTheme(isDark ? 'light' : 'dark')}>
                  {isDark ? <Sun /> : <Moon />}
                  {mounted ? (isDark ? 'Clair' : 'Sombre') : 'Thème'}
                </Button>
              </div>
              <SheetClose asChild><Button variant="outline" className="w-full" asChild><Link href="/login">{isFrench ? 'Se connecter' : 'Sign in'}</Link></Button></SheetClose>
              <SheetClose asChild><Button variant="terra" className="w-full" asChild><Link href="/signup">{isFrench ? 'Créer mon profil' : 'Create my profile'}</Link></Button></SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
