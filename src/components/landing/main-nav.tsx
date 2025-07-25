
"use client";

import Link from "next/link";
import {
  Menu,
  Languages,
  MoreVertical,
  Sun,
  Moon,
  Monitor,
  Search,
} from "lucide-react";
import { Logo } from "@/components/ui/logo";
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
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useLocalization } from "@/context/localization-context";
import { useCountry, allCountries } from "@/context/country-context";
import { Flag } from "../flag";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

const getNavLinks = (t: (key: string) => string) => [
  { href: "/jobs", label: t("Jobs") },
  { href: "/companies", label: t("Companies") },
  { href: "/schools", label: t("Schools") },
  { href: "/blog", label: t("Blog") },
  { href: "/about", label: t("About") },
];

export function MainNav() {
  const { t, setLanguage, countryName } = useLocalization();
  const { country, setCountry } = useCountry();
  const { setTheme } = useTheme();
  const navLinks = getNavLinks(t);

  const countrySelectorMenu = (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
         <Flag countryCode={country.code} className="mr-2"/>
         <span>{countryName}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent className="w-40 max-h-80 overflow-y-auto">
          {allCountries.map((c) => (
            <DropdownMenuItem key={c.code} onClick={() => setCountry(c)}>
                <Flag countryCode={c.code} className="h-4 w-4 mr-2" />
                <span>{t(c.name.en)}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  )

  const languageSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Languages className="mr-2 h-4 w-4" />
           <span>{t('Language')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
      </DropdownMenuSub>
  )

  const themeSelectorMenu = (
     <DropdownMenuSub>
        <DropdownMenuSubTrigger>
           <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
           <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
           <span>{t('Theme')}</span>
        </DropdownMenuSubTrigger>
        <DropdownMenuPortal>
           <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>{t('Light')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>{t('Dark')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>{t('System')}</DropdownMenuItem>
            </DropdownMenuSubContent>
        </DropdownMenuPortal>
     </DropdownMenuSub>
  )


  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-6 flex-1 md:flex-initial">
          <Link href="/" className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div>
                <p className="font-bold text-xl">Yahnu</p>
                <p className="text-xs text-muted-foreground">{t('Your future starts here')}</p>
              </div>
          </Link>
        </div>
        
        <div className="flex items-center gap-2 ml-auto">
            <nav className="hidden md:flex items-center gap-6 text-sm">
                {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="group relative font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                      <span className="absolute bottom-[-2px] left-0 h-0.5 w-0 rounded-full bg-primary transition-all duration-300 group-hover:w-full" />
                    </Link>
                ))}
            </nav>
            <div className="hidden items-center gap-2 md:flex md:ml-6">
                <Button variant="outline" asChild>
                  <Link href="/login">{t('Login')}</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">{t('Sign Up')}</Link>
                </Button>
            </div>
            
            <div className="hidden md:flex items-center gap-2">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                       <Flag countryCode={country.code} />
                       {countryName}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuPortal>
                    <DropdownMenuContent align="end" className="w-40 max-h-80 overflow-y-auto">
                      {allCountries.map((c) => (
                        <DropdownMenuItem key={c.code} onClick={() => setCountry(c)}>
                            <Flag countryCode={c.code} className="h-4 w-4 mr-2" />
                            <span>{t(c.name.en)}</span>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenuPortal>
              </DropdownMenu>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical className="h-5 w-5" />
                    <span className="sr-only">More options</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {languageSelectorMenu}
                  {themeSelectorMenu}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <div className="md:hidden flex items-center gap-1">
              <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="outline" size="icon">
                        <MoreVertical className="h-5 w-5" />
                        <span className="sr-only">More options</span>
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                     {countrySelectorMenu}
                     {languageSelectorMenu}
                     {themeSelectorMenu}
                  </DropdownMenuContent>
              </DropdownMenu>
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">{t('Open menu')}</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[80%]">
                  <SheetHeader className="text-left">
                    <SheetTitle>
                      <SheetClose asChild>
                        <Link href="/">
                          <div className="flex items-center gap-3">
                            <Logo className="h-10 w-10" />
                            <div>
                                <p className="font-bold text-lg">Yahnu</p>
                                <p className="text-xs text-muted-foreground">{t('Your future starts here')}</p>
                            </div>
                          </div>
                        </Link>
                      </SheetClose>
                    </SheetTitle>
                  </SheetHeader>
                  <Separator className="my-4" />
                  <div className="flex flex-col gap-4">
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
                    <div className="flex flex-col items-center gap-4">
                      <SheetClose asChild>
                        <Button variant="outline" className="w-full text-lg" asChild>
                            <Link href="/login">{t('Login')}</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-full text-lg" asChild>
                          <Link href="/signup">{t('Sign Up')}</Link>
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
