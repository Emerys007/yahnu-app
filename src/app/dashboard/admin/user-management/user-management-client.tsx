"use client"

import { useEffect, useMemo, useState } from "react"
import { Building2, Filter, Loader2, Search, School, Trash2, UserRound, Users } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Role, UserStatus } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApiClientError, apiFetch } from "@/lib/api-client"

export type User = {
  id: string
  name: string
  email: string
  accountType: Role
  status: UserStatus
  date: string
}

const roleLabels: Record<Role, string> = {
  graduate: "Jeune diplômé",
  company: "Entreprise",
  school: "École ou université",
  admin: "Administrateur",
  super_admin: "Super administrateur",
  content_manager: "Responsable éditorial",
  content_moderator: "Modérateur",
  support_staff: "Équipe support",
}

const statusLabels: Record<UserStatus, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
  declined: "Refusé",
}

function formatDate(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date non disponible"
  return new Intl.DateTimeFormat("fr-CI", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Abidjan",
  }).format(date)
}

function userError(error: unknown, fallback: string) {
  if (error instanceof ApiClientError && error.code === "user_not_found") {
    return "Ce compte n’existe plus ou a déjà été supprimé."
  }
  return fallback
}

function roleIcon(role: Role) {
  if (role === "company") return Building2
  if (role === "school") return School
  return UserRound
}

function statusVariant(status: UserStatus): "default" | "secondary" | "destructive" | "outline" {
  if (status === "active") return "secondary"
  if (status === "suspended" || status === "declined") return "destructive"
  return "outline"
}

function ManageUserDialog({ user, onUserUpdate, onUserDelete }: {
  user: User
  onUserUpdate: (user: User) => void
  onUserDelete: (userId: string) => void
}) {
  const { toast } = useToast()
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isManageOpen, setIsManageOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      const response = await apiFetch<{ data: { user: User } }>(`/api/admin/users/${encodeURIComponent(user.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })
      onUserUpdate(response.data.user)
      toast({
        title: newStatus === "active" ? "Compte activé" : "Compte suspendu",
        description: newStatus === "active"
          ? `${user.name} peut maintenant se connecter à Yahnu.`
          : `Les sessions de ${user.name} ont été fermées.`,
      })
      setIsManageOpen(false)
    } catch (error) {
      console.error("Unable to update user status", error)
      toast({
        title: "Statut inchangé",
        description: userError(error, "La modification n’a pas pu être enregistrée. Réessayez dans un instant."),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await apiFetch(`/api/admin/users/${encodeURIComponent(user.id)}`, { method: "DELETE" })
      onUserDelete(user.id)
      toast({ title: "Compte supprimé", description: `${user.name} a été retiré de la plateforme.` })
      setIsDeleteDialogOpen(false)
      setIsManageOpen(false)
    } catch (error) {
      console.error("Unable to delete user", error)
      toast({
        title: "Suppression impossible",
        description: userError(error, "Le compte est resté en place. Réessayez dans un instant."),
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Dialog open={isManageOpen} onOpenChange={setIsManageOpen}>
      <DialogTrigger asChild><Button variant="outline" size="sm">Gérer</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gérer le compte de {user.name}</DialogTitle>
          <DialogDescription>Les changements de statut s’appliquent immédiatement et sont inscrits dans le journal d’audit.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 py-2">
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="font-medium">{user.name}</p>
            <p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p>
            <div className="mt-3 flex flex-wrap gap-2"><Badge variant="outline">{roleLabels[user.accountType]}</Badge><Badge variant={statusVariant(user.status)}>{statusLabels[user.status]}</Badge></div>
          </div>
          <div className="space-y-2">
            <Label>Modifier l’accès</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {user.status !== "active" ? <Button disabled={isSaving} onClick={() => void handleStatusChange("active")}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}Activer le compte</Button> : null}
              {user.status !== "suspended" ? <Button disabled={isSaving} variant="outline" onClick={() => void handleStatusChange("suspended")}>{isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}Suspendre le compte</Button> : null}
            </div>
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isSaving || user.accountType === "admin" || user.accountType === "super_admin"}>
                <Trash2 className="mr-2 h-4 w-4" />Supprimer le compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer le compte de {user.name} ?</AlertDialogTitle>
                <AlertDialogDescription>Le compte sera désactivé, ses sessions seront fermées et il disparaîtra de la plateforme. Cette action est irréversible depuis cette interface.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={isSaving}>Conserver le compte</AlertDialogCancel>
                <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isSaving} onClick={(event) => { event.preventDefault(); void handleDelete() }}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}Supprimer définitivement
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function UserManagementClient({ initialUsers }: { initialUsers: User[] }) {
  const [users, setUsers] = useState(initialUsers)
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({ accountType: "all", status: "all" })

  useEffect(() => setUsers(initialUsers), [initialUsers])

  const counts = useMemo(() => ({
    total: users.length,
    active: users.filter((user) => user.status === "active").length,
    pending: users.filter((user) => user.status === "pending").length,
    attention: users.filter((user) => user.status === "suspended" || user.status === "declined").length,
  }), [users])

  const filteredUsers = useMemo(() => {
    const needle = searchTerm.trim().toLocaleLowerCase("fr")
    return users.filter((user) => {
      const searchMatch = !needle || [user.name, user.email].some((value) => value.toLocaleLowerCase("fr").includes(needle))
      const roleMatch = filters.accountType === "all" || user.accountType === filters.accountType
      const statusMatch = filters.status === "all" || user.status === filters.status
      return searchMatch && roleMatch && statusMatch
    })
  }, [filters, searchTerm, users])

  const handleUserUpdate = (updatedUser: User) => setUsers((current) => current.map((user) => user.id === updatedUser.id ? updatedUser : user))
  const handleUserDelete = (userId: string) => setUsers((current) => current.filter((user) => user.id !== userId))

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Comptes chargés", value: counts.total, color: "bg-lagoon/10 text-lagoon" },
          { label: "Actifs", value: counts.active, color: "bg-primary/10 text-primary" },
          { label: "En attente", value: counts.pending, color: "bg-soleil/20 text-cocoa" },
          { label: "À surveiller", value: counts.attention, color: "bg-terra/10 text-cocoa" },
        ].map((item) => (
          <Card key={item.label}><CardContent className="flex items-center justify-between p-5"><div><p className="font-display text-2xl font-semibold">{item.value}</p><p className="mt-1 text-sm text-muted-foreground">{item.label}</p></div><span className={`rounded-xl p-2.5 ${item.color}`}><Users className="h-4 w-4" /></span></CardContent></Card>
        ))}
      </div>

      <Card>
        <CardContent className="space-y-5 p-4 sm:p-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Rechercher un compte" placeholder="Nom ou adresse e-mail…" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-9" />
            </div>
            <Select value={filters.accountType} onValueChange={(value) => setFilters((current) => ({ ...current, accountType: value }))}>
              <SelectTrigger><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous les profils</SelectItem><SelectItem value="graduate">Jeunes diplômés</SelectItem><SelectItem value="company">Entreprises</SelectItem><SelectItem value="school">Écoles et universités</SelectItem></SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters((current) => ({ ...current, status: value }))}>
              <SelectTrigger><Filter className="mr-2 h-4 w-4" /><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="active">Actifs</SelectItem><SelectItem value="pending">En attente</SelectItem><SelectItem value="declined">Refusés</SelectItem><SelectItem value="suspended">Suspendus</SelectItem></SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground" aria-live="polite">{filteredUsers.length} résultat{filteredUsers.length > 1 ? "s" : ""}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Compte</TableHead><TableHead>Profil</TableHead><TableHead>Statut</TableHead><TableHead>Inscription</TableHead><TableHead className="text-right">Action</TableHead></TableRow></TableHeader>
              <TableBody>
                {filteredUsers.map((user) => {
                  const Icon = roleIcon(user.accountType)
                  return (
                    <TableRow key={user.id}>
                      <TableCell><p className="font-medium">{user.name}</p><p className="text-sm text-muted-foreground">{user.email}</p></TableCell>
                      <TableCell><Badge variant="outline"><Icon className="mr-1 h-3 w-3" />{roleLabels[user.accountType]}</Badge></TableCell>
                      <TableCell><Badge variant={statusVariant(user.status)}>{statusLabels[user.status]}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{formatDate(user.date)}</TableCell>
                      <TableCell className="text-right"><ManageUserDialog user={user} onUserUpdate={handleUserUpdate} onUserDelete={handleUserDelete} /></TableCell>
                    </TableRow>
                  )
                })}
                {!filteredUsers.length ? <TableRow><TableCell colSpan={5} className="h-32 text-center text-muted-foreground">Aucun compte ne correspond à ces critères.</TableCell></TableRow> : null}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y md:hidden">
            {filteredUsers.map((user) => {
              const Icon = roleIcon(user.accountType)
              return (
                <article key={user.id} className="space-y-4 p-4">
                  <div><p className="font-semibold">{user.name}</p><p className="mt-1 break-all text-sm text-muted-foreground">{user.email}</p></div>
                  <div className="flex flex-wrap gap-2"><Badge variant="outline"><Icon className="mr-1 h-3 w-3" />{roleLabels[user.accountType]}</Badge><Badge variant={statusVariant(user.status)}>{statusLabels[user.status]}</Badge></div>
                  <div className="flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Inscrit le {formatDate(user.date)}</p><ManageUserDialog user={user} onUserUpdate={handleUserUpdate} onUserDelete={handleUserDelete} /></div>
                </article>
              )
            })}
            {!filteredUsers.length ? <p className="p-10 text-center text-sm text-muted-foreground">Aucun compte ne correspond à ces critères.</p> : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
