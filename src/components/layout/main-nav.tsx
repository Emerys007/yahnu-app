
"use client";

import Link from "next/link";
import {
  Menu,
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
import { Separator } from "@/components/ui/separator";


const navLinks = [
  { href: "/jobs", label: "Emplois" },
  { href: "/companies", label: "Entreprises" },
  { href: "/schools", label: "Écoles" },
  { href: "/blog", label: "Blog" },
  { href: "/about", label: "À propos" },
];

export function MainNav() {

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-20 items-center">
        <div className="mr-6 flex-1 md:flex-initial">
          <Link href="/" className="flex items-center gap-3">
              <Logo className="h-12 w-12" />
              <div>
                <p className="font-bold text-xl">Yahnu</p>
                <p className="text-xs text-muted-foreground">Votre avenir commence ici</p>
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
                  <Link href="/login">Connexion</Link>
                </Button>
                <Button asChild>
                  <Link href="/signup">S'inscrire</Link>
                </Button>
            </div>
            
            <div className="md:hidden flex items-center gap-1">
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
                            <Link href="/login">Connexion</Link>
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button className="w-full text-lg" asChild>
                          <Link href="/signup">S'inscrire</Link>
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
