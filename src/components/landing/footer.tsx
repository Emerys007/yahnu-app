
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
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        {!isDashboard && (
          <>
            <div className="max-w-7xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 text-center">
                {/* Brand Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Logo className="h-10 w-10 text-primary" />
                    <span className="text-2xl font-bold text-foreground">Yahnu</span>
                  </div>
                  <p className="text-muted-foreground max-w-md mx-auto leading-relaxed">
                    Connecter les talents, les entreprises et les écoles en Côte d'Ivoire pour un avenir professionnel brillant.
                  </p>
                </div>

                {/* Platform Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Plateforme</h3>
                  <ul className="space-y-3">
                    <li><Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">Emplois</Link></li>
                    <li><Link href="/companies" className="text-muted-foreground hover:text-primary transition-colors">Entreprises</Link></li>
                    <li><Link href="/schools" className="text-muted-foreground hover:text-primary transition-colors">Écoles</Link></li>
                    <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
                  </ul>
                </div>

                {/* Legal Links */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Légal</h3>
                  <ul className="space-y-3">
                    <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">Politique de confidentialité</Link></li>
                    <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">Conditions d'utilisation</Link></li>
                  </ul>
                </div>

                {/* Contact and Social Section */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Nous contacter</h3>
                  <ul className="space-y-3">
                    <li>
                      <a href="mailto:contact@yahnu.org" className="flex items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
                        <Mail className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span>contact@yahnu.org</span>
                      </a>
                    </li>
                    <li>
                      <a href="tel:+2250102030405" className="flex items-center justify-center gap-3 text-muted-foreground hover:text-primary transition-colors group">
                        <Phone className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span>+225 0102030405</span>
                      </a>
                    </li>
                  </ul>
                  
                  {/* Social Media Links */}
                  <div className="pt-4">
                    <h4 className="text-xs font-medium tracking-wider uppercase text-foreground mb-3">Suivez-nous</h4>
                    <div className="flex justify-center gap-4">
                      <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" 
                         className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent">
                        <span className="sr-only">Twitter</span>
                        <Twitter className="h-5 w-5" />
                      </a>
                      <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" 
                         className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent">
                        <span className="sr-only">LinkedIn</span>
                        <Linkedin className="h-5 w-5" />
                      </a>
                      <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                         className="text-muted-foreground hover:text-primary transition-colors p-2 rounded-full hover:bg-accent">
                        <span className="sr-only">Facebook</span>
                        <Facebook className="h-5 w-5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Section */}
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-border">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  &copy; {new Date().getFullYear()} Yahnu. Tous droits réservés.
                </p>
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
