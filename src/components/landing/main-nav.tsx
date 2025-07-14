
"use client";

import Link from "next/link";
import {
  Menu,
  MoreVertical,
  Languages,
  Monitor,
  Sun,
  Moon,
  Globe,
  ChevronDown
} from "lucide-react";
import { useTheme } from "next-themes";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useLocalization } from "@/context/localization-context";
import { useCountry, allCountries } from "@/context/country-context";
import { Flag } from "../flag";

const getNavLinks = (t: (key: string) => string) => [
  { href: "/dashboard/jobs", label: t("Jobs") },
  { href: "/companies", label: t("Companies") },
  { href: "/schools", label: t("Schools") },
  { href: "/blog", label: t("Blog") },
];

export function MainNav() {
  const { setTheme } = useTheme();
  const { t, language, setLanguage } = useLocalization();
  const { country, setCountry } = useCountry();
  const navLinks = getNavLinks(t);

  const selectedCountry = allCountries.find(c => c.code === country.code);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <div>
              <span className="text-lg font-bold">Yahnu</span>
            </div>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm ml-auto mr-4">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="font-medium text-muted-foreground transition-colors hover:text-foreground/80"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        
        <div className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/login">{t('Login')}</Link>
            </Button>
            <Button asChild>
              <Link href="/register">{t('Sign Up')}</Link>
            </Button>
        </div>

        <div className="flex items-center gap-2 ml-auto md:ml-0">
          {/* Country Dropdown */}
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                      <div className="flex items-center gap-2">
                        <Flag countryCode={country.code} className="h-4 w-4" />
                        <span>{language === 'fr' ? selectedCountry?.name.fr : selectedCountry?.name.en}</span>
                        <ChevronDown className="h-4 w-4 opacity-50" />
                      </div>
                  </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 max-h-96 overflow-y-auto" align="end">
                  {allCountries.map((c) => (
                      <DropdownMenuItem key={c.code} onClick={() => setCountry(c)}>
                          <Flag countryCode={c.code} className="h-4 w-4 mr-2" />
                          <span>{language === 'fr' ? c.name.fr : c.name.en}</span>
                      </DropdownMenuItem>
                  ))}
              </DropdownMenuContent>
          </DropdownMenu>

          {/* Mobile Navigation */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon">
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">{t('Open menu')}</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[80%]">
                <SheetHeader>
                  <SheetTitle>
                    <SheetClose asChild>
                      <Link
                        href="/"
                        className="flex items-center gap-2"
                      >
                        <Logo className="h-6 w-6 text-primary" />
                        <span className="font-bold">Yahnu</span>
                      </Link>
                    </SheetClose>
                  </SheetTitle>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-4">
                  {navLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className="text-lg font-medium text-foreground hover:text-muted-foreground"
                      >
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-4">
                    <SheetClose asChild>
                      <Button
                        variant="ghost"
                        className="justify-start text-lg"
                        asChild
                      >
                        <Link href="/login">{t('Login')}</Link>
                      </Button>
                    </SheetClose>
                    <SheetClose asChild>
                      <Button
                        className="justify-start text-lg"
                        asChild
                      >
                        <Link href="/register">{t('Sign Up')}</Link>
                      </Button>
                    </SheetClose>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
