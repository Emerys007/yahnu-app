"use client";

import Link from "next/link";
import { Menu, MoreVertical, Sun, Moon, Languages } from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from "@/components/ui/dropdown-menu"
import { useTheme } from "next-themes";

const navLinks = [
  { href: "/jobs", label: "Emplois" },
  { href: "/companies", label: "Entreprises" },
  { href: "/schools", label: "Écoles" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "À propos" },
];

// Simple localization function
const localize = (key: string) => {
  const translations: Record<string, string> = {
    'Home': 'Accueil',
    'About': 'À propos',
    'Schools': 'Écoles',
    'Companies': 'Entreprises',
    'Jobs': 'Emplois',
    'Blog': 'Blog',
    'Login': 'Connexion',
    'Get Started': 'Commencer'
  }
  return translations[key] || key
}

export function MainNav() {
  const { setTheme } = useTheme()

  const [selectedCountry, setSelectedCountry] = React.useState("ivory-coast")
  const [isOpen, setIsOpen] = React.useState(false)
  const [expandedItems, setExpandedItems] = React.useState<string[]>([])

  // Fix: Move localStorage access to useEffect to avoid setState during render
  React.useEffect(() => {
    const savedCountry = localStorage.getItem('selectedCountry') || 'ivory-coast'
    setSelectedCountry(savedCountry)
  }, [])

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 glass backdrop-blur-xl">
      <div className="container flex h-18 items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center gap-3">
              <Logo className="h-9 w-auto transform hover:scale-105 transition-transform duration-300" />
              <div>
                <p className="font-bold text-xl">Yahnu</p>
                <p className="text-xs text-muted-foreground">Votre avenir commence ici</p>
              </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 ml-auto">
            <nav className="hidden md:flex items-center space-x-8 text-sm font-medium">
                {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="relative py-2 transition-all duration-300 hover:text-primary text-foreground/70 hover:text-foreground font-semibold group"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                    </Link>
                ))}
            </nav>
            <div className="hidden md:flex items-center space-x-3">
                {/* Language Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-9 w-9 px-0 hover:bg-primary/10 transition-colors">
                            <Languages className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Clair</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Sombre</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Clair</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Sombre</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="flex items-center gap-2 md:ml-6">
                <Link href="/login">
                  <Button variant="ghost" size="sm" className="font-semibold hover:bg-primary/10 transition-colors">
                    {localize('Login')}
                  </Button>
                </Link>
                <Link href="/signup">
                  <Button size="sm" className="font-semibold bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300">
                    {localize('Get Started')}
                  </Button>
                </Link>
            </div>

            <div className="md:hidden flex items-center gap-1">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                            <MoreVertical className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                        <Sun className="mr-2 h-4 w-4" />
                        <span>Clair</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                        <Moon className="mr-2 h-4 w-4" />
                        <span>Sombre</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                <Sheet>
                    <SheetTrigger asChild>
                    <Button variant="outline" size="icon">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Ouvrir le menu</span>
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
                                    <p className="text-xs text-muted-foreground">Votre avenir commence ici</p>
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
                                <Link href="/login">{localize('Login')}</Link>
                            </Button>
                        </SheetClose>
                        <SheetClose asChild>
                            <Button className="w-full text-lg" asChild>
                            <Link href="/signup">{localize('Get Started')}</Link>
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