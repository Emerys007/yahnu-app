
"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Facebook, Twitter, Linkedin, Mail, Phone, MapPin } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  if (isDashboard) {
    return null;
  }

  return (
    <footer className="bg-background border-t">
      <div className="w-full py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
            {/* Brand Section */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-sm">Y</span>
                </div>
                <span className="text-xl font-bold">Yahnu</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                Connecter les talents, les entreprises et les écoles en Côte d'Ivoire pour un avenir professionnel brillant.
              </p>
            </div>

            {/* Platform Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Plateforme</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/jobs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Offres d'emploi
                  </Link>
                </li>
                <li>
                  <Link href="/companies" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Entreprises
                  </Link>
                </li>
                <li>
                  <Link href="/schools" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Écoles
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Blog
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal Links */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Légal</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/terms-of-service" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Conditions d'utilisation
                  </Link>
                </li>
                <li>
                  <Link href="/privacy-policy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                    Politique de confidentialité
                  </Link>
                </li>
              </ul>
              <div className="space-y-4 mt-6">
                <h3 className="text-sm font-semibold tracking-wider uppercase">Nous contacter</h3>
                <ul className="space-y-3">
                  <li className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">contact@yahnu.ci</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">+225 XX XX XX XX</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Abidjan, Côte d'Ivoire</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Social Media */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold tracking-wider uppercase">Suivez-nous</h3>
              <div className="flex gap-3">
                <a 
                  href="https://twitter.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label="Twitter"
                >
                  <Twitter className="h-4 w-4" />
                </a>
                <a 
                  href="https://linkedin.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                  aria-label="Facebook"
                >
                  <Facebook className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="mt-12 pt-8 border-t border-border">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                &copy; {new Date().getFullYear()} Yahnu. Tous droits réservés.
              </p>
              <p className="text-xs text-muted-foreground">
                Fait avec ❤️ par Look Time Life
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
