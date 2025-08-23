
"use client"

import { LogOut, User, Settings, Building, MessageSquare, BadgeCheck } from "lucide-react"
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
import { useAuth, type Role } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "../ui/badge"

export function UserNav() {
  const { user, signOut, role } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/')
      toast({
        title: "Déconnexion réussie",
        description: "Vous avez été déconnecté avec succès.",
      })
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Un problème est survenu lors de votre déconnexion.",
        variant: "destructive",
      })
    }
  }

  const getInitials = (name?: string) => {
    if (!name) return "U"
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
  
  const getRoleDisplayName = (role: Role) => {
    const roleMap: Record<Role, string> = {
      graduate: 'Diplômé',
      company: 'Entreprise',
      school: 'École',
      admin: 'Admin',
      super_admin: 'Super Admin',
      content_manager: 'Gestionnaire de contenu',
      support_staff: 'Support',
    };
    return roleMap[role] || role;
  };

  const hasDistinctProfilePage = role === 'graduate' || role === 'company' || role === 'school';
  const canReceiveMessages = role === 'graduate' || role === 'company' || role === 'school' || role === 'support_staff';

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
          <div className="flex flex-col space-y-2">
            <div className="space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || "Utilisateur"}</p>
                <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
                </p>
            </div>
            <Badge variant="outline" className="w-fit">
                <BadgeCheck className="mr-1 h-3 w-3 text-primary" />
                {getRoleDisplayName(role)}
            </Badge>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {hasDistinctProfilePage && (
            <DropdownMenuItem onClick={() => router.push('/dashboard/profile')}>
              <User className="mr-2 h-4 w-4" />
              <span>Profil</span>
            </DropdownMenuItem>
          )}
           {canReceiveMessages && (
             <DropdownMenuItem onClick={() => router.push('/dashboard/messages')}>
                <MessageSquare className="mr-2 h-4 w-4" />
                <span>Messages</span>
            </DropdownMenuItem>
           )}
          <DropdownMenuItem onClick={() => router.push('/dashboard/settings')}>
            <Settings className="mr-2 h-4 w-4" />
            <span>Paramètres</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Déconnexion</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
