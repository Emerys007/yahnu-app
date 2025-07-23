
"use client"

import { LogOut, User, Settings, Building, MessageSquare } from "lucide-react"
import { useRouter } from "next/navigation"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"

export function UserNav() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const { t } = useLocalization()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      toast({
        title: t("Logged Out"),
        description: t("You have been successfully logged out."),
      })
    } catch (error) {
      toast({
        title: t("Uh oh! Something went wrong."),
        description: t("There was a problem logging you out."),
        variant: "destructive",
      })
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src="/avatars/03.png" alt={user?.name || "User"} />
            <AvatarFallback>{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user?.name || "User"}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
            <User className="mr-2 h-4 w-4" />
            <span>{t("Profile")}</span>
          </DropdownMenuItem>
          {user?.role === 'company' && (
            <DropdownMenuItem onClick={() => router.push('/dashboard/company-profile')}>
              <Building className="mr-2 h-4 w-4" />
              <span>{t("Company Profile")}</span>
            </DropdownMenuItem>
          )}
           <DropdownMenuItem onClick={() => router.push('/dashboard/messages')}>
            <MessageSquare className="mr-2 h-4 w-4" />
            <span>{t("Messages")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>{t("Settings")}</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{t("Log out")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
