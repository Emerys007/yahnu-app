"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Facebook, Twitter, Linkedin, Mail, Phone } from "lucide-react"

import { Logo } from "@/components/ui/logo"
import { useLocalization } from "@/context/localization-context"

export function Footer() {
  const { t } = useLocalization();
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/dashboard");

  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {!isDashboard && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8">
              {/* Brand Section */}
              <div className="col-span-2 lg:col-span-1">
                <div className="flex items-center gap-3">
                  <Logo className="h-8 w-8 text-primary" />
                  <span className="text-xl font-bold">Yahnu</span>
                </div>
                <p className="mt-4 text-sm text-muted-foreground">
                  {t('landing.footer.tagline')}
                </p>
              </div>

              {/* Platform Links */}
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-foreground">{t('common.platform')}</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li><Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">{t('common.jobs')}</Link></li>
                  <li><Link href="/companies" className="text-muted-foreground hover:text-primary transition-colors">{t('common.companies')}</Link></li>
                  <li><Link href="/schools" className="text-muted-foreground hover:text-primary transition-colors">{t('common.schools')}</Link></li>
                  <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">{t('common.blog')}</Link></li>
                </ul>
              </div>

              {/* Legal Links */}
              <div>
                <h3 className="text-sm font-semibold tracking-wider text-foreground">{t('common.legal')}</h3>
                <ul className="mt-4 space-y-2 text-sm">
                  <li><Link href="/privacy-policy" className="text-muted-foreground hover:text-primary transition-colors">{t('common.privacy_policy')}</Link></li>
                  <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-primary transition-colors">{t('common.terms_of_service')}</Link></li>
                </ul>
              </div>

              {/* Contact and Socials Container */}
              <div className="col-span-2 md:col-span-2 lg:col-span-2 flex flex-row gap-8">
                 {/* Contact Section */}
                <div className="w-1/2">
                    <h3 className="text-sm font-semibold tracking-wider text-foreground">{t('common.contact_us')}</h3>
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
                <div className="w-1/2">
                    <h3 className="text-sm font-semibold tracking-wider text-foreground">{t('common.follow_us')}</h3>
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
            <div className="mt-12 pt-8 border-t">
                <div className="text-center text-sm text-muted-foreground">
                    <p>&copy; {new Date().getFullYear()} Yahnu. {t('common.all_rights_reserved')}</p>
                </div>
            </div>
          </>
        )}
        {isDashboard && (
             <div className="text-center text-sm text-muted-foreground">
                <p>&copy; {new Date().getFullYear()} Yahnu. {t('common.all_rights_reserved')}</p>
            </div>
        )}
      </div>
    </footer>
  )
}