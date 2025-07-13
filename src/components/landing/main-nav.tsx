"use client";

import Link from "next/link"
import { Logo } from "@/components/logo"
import { Button } from "@/components/ui/button"

export function MainNav() {
  return (
    <header className="px-4 lg:px-6 h-16 flex items-center bg-background border-b sticky top-0 z-50">
      <Link href="/" className="flex items-center justify-center gap-2" prefetch={false}>
        <Logo className="h-6 w-6 text-primary" />
        <span className="text-lg font-semibold">Yahnu</span>
      </Link>
      <nav className="ml-auto flex gap-4 sm:gap-6">
        <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
        </Button>
        <Button asChild>
            <Link href="/register">Sign Up</Link>
        </Button>
      </nav>
    </header>
  )
}
