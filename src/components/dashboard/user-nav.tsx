
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"
import { useAuth, type Role } from "@/context/auth-context"

export function UserNav() {
  const { t } = useLocalization();
  const { role } = useAuth();

  const roleName: Record<Role, string> = {
    'graduate': t('Graduate Account'),
    'company': t('Company Account'),
    'school': t('School Account'),
    'admin': t('Admin Account'),
  }

  const profileLink: Record<Role, string> = {
    'graduate': '/dashboard/profile',
    'company': '/dashboard/company-profile',
    'school': '/dashboard/school-profile',
    'admin': '/dashboard/settings',
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src="https://placehold.co/100x100.png" alt="@user" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{t('User')}</p>
            <p className="text-xs leading-none text-muted-foreground">
              user@example.com
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
            {roleName[role]}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={profileLink[role]}>{t('Profile')}</Link>
          </DropdownMenuItem>
           <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">{t('Settings')}</Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/">{t('Log out')}</Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
