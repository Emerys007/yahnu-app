"use client"

import Link from "next/link"
import { Facebook, Twitter, Linkedin } from "lucide-react"

import { Logo } from "@/components/logo"
import { Separator } from "@/components/ui/separator"

export function Footer() {
  return (
    <footer className="bg-background border-t">
      <div className="container mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Brand & Socials Section */}
          <div className="lg:col-span-5">
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Yahnu</span>
            </div>
            <p className="mt-4 max-w-sm text-muted-foreground">
              Connecting talent, companies, and schools in Côte d&apos;Ivoire. Your future starts here.
            </p>
            <div className="mt-6 flex gap-4">
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

          {/* Links Section */}
          <div className="grid grid-cols-2 gap-8 lg:col-span-7 md:grid-cols-3">
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Platform</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/jobs" className="text-muted-foreground hover:text-primary transition-colors">Jobs</Link></li>
                <li><Link href="/companies" className="text-muted-foreground hover:text-primary transition-colors">Companies</Link></li>
                <li><Link href="/schools" className="text-muted-foreground hover:text-primary transition-colors">Schools</Link></li>
                <li><Link href="/blog" className="text-muted-foreground hover:text-primary transition-colors">Blog</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Company</h3>
              <ul className="mt-4 space-y-2 text-sm">
                 <li><Link href="/about" className="text-muted-foreground hover:text-primary transition-colors">About Us</Link></li>
                <li><Link href="/contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
             <div>
              <h3 className="text-sm font-semibold tracking-wider uppercase text-foreground">Legal</h3>
              <ul className="mt-4 space-y-2 text-sm">
                <li><Link href="/privacy" className="text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms" className="text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Copyright Section */}
        <div className="mt-12 pt-8 border-t">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} Yahnu. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
