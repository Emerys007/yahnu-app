
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Facebook, Twitter, Linkedin, Mail, Phone } from "lucide-react"
import { useLocalization } from "@/context/localization-context"

import { Logo } from "@/components/ui/logo"

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");
  const { t } = useLocalization();

  return (
    <footer className="bg-background border-t">
      <div className="w-full py-16 px-4 sm:px-6 lg:px-8">
        {!isDashboard && (
          <>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-8 lg:gap-12">
                {/* Brand Section */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="flex items-center gap-3">
                    <Logo className="h-10 w-10 text-primary" />
                    <span className="text-2xl font-bold text-foreground">Yahnu</span>
                  </div>
                  <p className="text-muted-foreground max-w-md leading-relaxed text-sm">
                    Connecter les talents, les entreprises et les écoles en Côte d'Ivoire pour un avenir professionnel brillant.
                  </p>
                </div>

                {/* Social Media */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Suivez-nous</h3>
                  <div className="flex gap-4">
                    <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 group">
                      <Twitter className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="sr-only">Twitter</span>
                    </a>
                    <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 group">
                      <Linkedin className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="sr-only">LinkedIn</span>
                    </a>
                    <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                       className="flex items-center justify-center w-10 h-10 rounded-full bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200 group">
                      <Facebook className="h-4 w-4 group-hover:scale-110 transition-transform" />
                      <span className="sr-only">Facebook</span>
                    </a>
                  </div>
                </div>

                {/* Platform Links */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Plateforme</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/jobs" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Emplois
                      </Link>
                    </li>
                    <li>
                      <Link href="/companies" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Entreprises
                      </Link>
                    </li>
                    <li>
                      <Link href="/schools" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Écoles
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Blog
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Légal</h3>
                  <ul className="space-y-4">
                    <li>
                      <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Politique de confidentialité
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-primary transition-colors duration-200 font-medium">
                        Conditions d'utilisation
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Contact Section */}
                <div className="space-y-6">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Nous contacter</h3>
                  <ul className="space-y-4">
                    <li>
                      <a href="mailto:contact@yahnu.org" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group font-medium">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <Mail className="h-4 w-4" />
                        </div>
                        <span>contact@yahnu.org</span>
                      </a>
                    </li>
                    <li>
                      <a href="tel:+2250102030405" className="flex items-center gap-3 text-sm text-muted-foreground hover:text-primary transition-colors duration-200 group font-medium">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted group-hover:bg-primary/10 transition-colors">
                          <Phone className="h-4 w-4" />
                        </div>
                        <span>+225 0102030405</span>
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-border/60">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-sm text-muted-foreground font-medium">
                  &copy; {new Date().getFullYear()} Yahnu. Tous droits réservés.
                </p>
                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <span>Fait avec ❤️ en Côte d'Ivoire</span>
                </div>
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
