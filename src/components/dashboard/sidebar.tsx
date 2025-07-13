"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Logo } from "@/components/logo"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  User,
  Briefcase,
  Building,
  ClipboardCheck,
  BarChart3,
  Book,
  LifeBuoy,
  Settings,
} from "lucide-react"
import { Button } from "@/components/ui/button"

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/dashboard/profile", icon: User, label: "Profile" },
  { href: "/dashboard/jobs", icon: Briefcase, label: "Job Search" },
  { href: "/dashboard/company-profile", icon: Building, label: "Company Profile" },
  { type: "divider", label: "AI Tools" },
  { href: "/dashboard/assessments", icon: ClipboardCheck, label: "Assessments" },
  { href: "/dashboard/reports", icon: BarChart3, label: "Reports" },
];

const helpAndSettingsItems = [
    { href: "#", icon: LifeBuoy, label: "Support" },
    { href: "#", icon: Settings, label: "Settings" },
]

export function DashboardSidebar() {
  const pathname = usePathname()

  const renderNavItem = (item: any, index: number) => {
    if (item.type === 'divider') {
        return (
            <div key={`divider-${index}`} className="px-3 py-2">
                <h2 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">{item.label}</h2>
            </div>
        )
    }

    const isActive = pathname === item.href

    return (
        <Link key={item.href} href={item.href}>
          <Button
            variant={isActive ? "secondary" : "ghost"}
            className="w-full justify-start h-10"
          >
            <item.icon className="mr-3 h-5 w-5" />
            {item.label}
          </Button>
        </Link>
    )
  }

  return (
    <div className="hidden lg:flex lg:flex-col lg:w-64 border-r bg-card">
        <div className="flex flex-col flex-grow">
            <div className="flex items-center h-16 px-6 border-b gap-3">
                <Logo className="h-8 w-8 text-primary" />
                <h1 className="text-xl font-bold">Yahnu</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-1">
                {navItems.map(renderNavItem)}
            </nav>
            <div className="mt-auto p-4 space-y-1 border-t">
                 {helpAndSettingsItems.map(renderNavItem)}
            </div>
        </div>
    </div>
  )
}
