
"use client";

import Link from "next/link";
import {
  Menu,
  MoreVertical,
  Languages,
  Monitor,
  Sun,
  Moon,
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
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useLocalization } from "@/context/localization-context";

const getNavLinks = (t: (key: string) => string) => [
  { href: "/dashboard/jobs", label: t("Jobs") },
  { href: "/companies", label: t("Companies") },
  { href: "/schools", label: t("Schools") },
  { href: "/blog", label: t("Blog") },
];

export function MainNav() {
  const { setTheme } = useTheme();
  const { t, setLanguage } = useLocalization();
  const navLinks = getNavLinks(t);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/" className="mr-6 flex items-center gap-2">
            <Logo className="h-8 w-8 text-primary" />
            <div>
              <span className="text-lg font-bold">Yahnu</span>
              <p className="text-xs text-muted-foreground">
                {t('Your future starts here')}
              </p>
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
          {/* Settings Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">{t('Settings')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Sun className="h-4 w-4 mr-2 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 mr-2 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span>{t('Theme')}</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem onClick={() => setTheme("light")}>
                      <Sun className="mr-2 h-4 w-4" />
                      {t('Light')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("dark")}>
                      <Moon className="mr-2 h-4 w-4" />
                      {t('Dark')}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTheme("system")}>
                      <Monitor className="mr-2 h-4 w-4" />
                      {t('System')}
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
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
