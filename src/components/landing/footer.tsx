"use client"

import Link from "next/link"
import { Facebook, Twitter, Linkedin, Mail, Phone } from "lucide-react"

import { Logo } from "@/components/logo"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="md:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Yahnu</span>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              Connecting talent, companies, and schools in Côte d&apos;Ivoire.
            </p>
          </div>

          {/* Links Columns */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Platform</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Jobs</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Companies</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Schools</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Legal</h3>
            <ul className="mt-4 space-y-2 text-sm">
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link href="#" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
            </ul>
          </div>
          
          {/* Contact and Socials */}
          <div>
            <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Contact Us</h3>
             <ul className="mt-4 space-y-2 text-sm">
                <li>
                  <a href="mailto:contact@yahnu.ci" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Mail className="h-4 w-4" />
                    contact@yahnu.ci
                  </a>
                </li>
                <li>
                  <a href="tel:+2250102030405" className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
                    <Phone className="h-4 w-4" />
                    +225 0102030405
                  </a>
                </li>
            </ul>
            <h3 className="mt-6 text-sm font-semibold tracking-wider uppercase text-foreground">Follow Us</h3>
            <div className="mt-4 flex gap-4">
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Twitter</span>
                <Twitter className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">LinkedIn</span>
                <Linkedin className="h-6 w-6" />
              </a>
              <a href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <span className="sr-only">Facebook</span>
                <Facebook className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} Yahnu. All rights reserved.</p>
            <p className="mt-1">Made with passion and Look Time Life.</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
