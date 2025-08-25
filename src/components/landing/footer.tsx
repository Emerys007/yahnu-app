"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Facebook, Twitter, Linkedin, Mail, Phone } from "lucide-react"

import { Logo } from "@/components/ui/logo"

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <footer className="bg-background border-t">
      <div className="w-full py-8 px-4 sm:px-6 lg:px-8">
        {!isDashboard && (
          <>
            <div className="flex justify-center">
              <div className="flex flex-col lg:flex-row justify-center items-center gap-8 lg:gap-16 text-center">
                {/* Brand Section */}
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3">
                    <Logo className="h-8 w-8 text-primary" />
                    <span className="text-xl font-bold">Yahnu</span>
                  </div>
                  <p className="mt-4 text-sm text-muted-foreground max-w-xs">
                    Connecter les talents, les entreprises et les écoles en Côte d'Ivoire.
                  </p>
                </div>

                {/* Platform Links */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Plateforme</h3>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li><Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">Emplois</Link></li>
                    <li><Link href="/companies" className="text-muted-foreground hover:text-primary transition-colors">Entreprises</Link></li>
                    <li><Link href="/schools" className="text-muted-foreground hover:text-primary transition-colors">Écoles</Link></li>
                    <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Légal</h3>
                  <ul className="mt-4 space-y-2 text-sm">
                    <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
                    <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
                  </ul>
                </div>

                {/* Contact Section */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Nous contacter</h3>
                  <ul className="mt-4 space-y-2 text-sm">
                      <li>
                        <a href="mailto:contact@yahnu.org" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Mail className="h-4 w-4" />
                          contact@yahnu.org
                        </a>
                      </li>
                      <li>
                        <a href="tel:+2250102030405" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                          <Phone className="h-4 w-4" />
                          +225 0102030405
                        </a>
                      </li>
                  </ul>
                </div>

                {/* Socials Section */}
                <div className="flex flex-col items-center">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Suivez-nous</h3>
                  <div className="mt-4 flex gap-4">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <span className="sr-only">Twitter</span>
                      <Twitter className="h-6 w-6" />
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <span className="sr-only">LinkedIn</span>
                      <Linkedin className="h-6 w-6" />
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                      <span className="sr-only">Facebook</span>
                      <Facebook className="h-6 w-6" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t flex justify-center">
                <div className="text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Yahnu. Tous droits réservés.</p>
                </div>
            </div>
          </>
        )}
        {isDashboard && (
             <div className="text-center text-sm text-muted-foreground max-w-6xl mx-auto">
                <p>&copy; {new Date().getFullYear()} Yahnu. {t('footer.rights_reserved')}</p>
            </div>
        )}
      </div>
    </footer>
  )
}