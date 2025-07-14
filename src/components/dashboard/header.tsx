"use client"
import Link from "next/link"
import {
  Menu,
  Search,
  Languages,
  PanelLeft,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { UserNav } from "@/components/dashboard/user-nav"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "./sidebar"
import { useLocalization } from "@/context/localization-context"


export function DashboardHeader() {
  const { toggleSidebar } = useSidebar();
  const { t, setLanguage } = useLocalization();
  
  return (
    <header className="flex h-16 items-center gap-4 border-b bg-card px-4 md:px-6 sticky top-0 z-30">
        <Button
            variant="ghost"
            size="icon"
            className="shrink-0 lg:hidden"
            onClick={toggleSidebar}
          >
            <Menu className="h-5 w-5" />
            <span className="sr-only">{t('Toggle navigation menu')}</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex"
            onClick={toggleSidebar}
          >
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{t('Toggle navigation menu')}</span>
          </Button>
      {/* Search Bar */}
      <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
        <form className="ml-auto flex-1 sm:flex-initial">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder={t('Search...')}
              className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
            />
          </div>
        </form>
        {/* Language Switcher */}
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <Languages className="h-[1.2rem] w-[1.2rem]" />
                <span className="sr-only">{t('Switch language')}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage('en')}>English</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage('fr')}>Français</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        {/* Theme Toggle */}
        <ThemeToggle />
        {/* User Menu */}
        <UserNav />
      </div>
    </header>
  )
}
