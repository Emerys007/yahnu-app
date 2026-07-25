"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Copy, Crown, Loader2, RefreshCw, ShieldCheck, ShieldOff, UserPlus, Users } from "lucide-react"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth, type Role, type UserStatus } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { ApiClientError, apiFetch } from "@/lib/api-client"

type AdminUser = {
  id: string
  name: string
  email: string
  accountType: Role
  status: UserStatus
  createdAt?: string
}

type StaffResponse = { data: { staff: AdminUser[] } }
type InviteResponse = {
  data: {
    invite: { id: string; email: string; role: Role; expiresAt: string }
    emailDelivery: "sent" | "development_link"
    debugUrl?: string
  }
}

const roleLabels: Record<Role, string> = {
  admin: "Administrateur",
  super_admin: "Super administrateur",
  content_manager: "Responsable éditorial",
  content_moderator: "Modérateur de contenu",
  support_staff: "Équipe support",
  graduate: "Jeune diplômé",
  company: "Entreprise",
  school: "École ou université",
}

const statusLabels: Record<UserStatus, string> = {
  active: "Actif",
  pending: "En attente",
  suspended: "Suspendu",
  declined: "Refusé",
}

function staffError(error: unknown, fallback: string) {
  if (!(error instanceof ApiClientError)) return fallback
  const messages: Record<string, string> = {
    last_super_admin: "Le dernier super administrateur actif ne peut pas être suspendu.",
    cannot_deactivate_self: "Vous ne pouvez pas suspendre votre propre compte.",
    super_admin_required: "Seul un super administrateur peut gérer ce compte.",
    email_in_use: "Un compte actif utilise déjà cette adresse e-mail.",
    staff_not_found: "Ce membre ne fait plus partie de l’équipe d’administration.",
  }
  return messages[error.code] ?? fallback
}

export function ManageTeamClient({ initialAdmins = [] }: { initialAdmins?: AdminUser[] }) {
  const { toast } = useToast()
  const { user } = useAuth()
  const [admins, setAdmins] = useState(initialAdmins)
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(initialAdmins.length === 0)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [inviteWasEmailed, setInviteWasEmailed] = useState(false)
  const [isInviting, setIsInviting] = useState(false)
  const [pendingToggle, setPendingToggle] = useState<AdminUser | null>(null)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState({ email: "", role: "admin" as Role })
  const canManageTeam = user?.role === "admin" || user?.role === "super_admin"

  const loadAdmins = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true)
    try {
      const response = await apiFetch<StaffResponse>("/api/admin/staff")
      setAdmins(response.data.staff)
      setLoadFailed(false)
    } catch (error) {
      console.error("Unable to load administrative staff", error)
      setLoadFailed(true)
    } finally {
      setIsLoadingAdmins(false)
      setIsRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadAdmins(true)
    const interval = window.setInterval(() => void loadAdmins(true), 45_000)
    return () => window.clearInterval(interval)
  }, [loadAdmins])

  const activeCount = useMemo(() => admins.filter((admin) => admin.status === "active").length, [admins])

  const requestToggle = (target: AdminUser) => {
    const cannotManageTarget = target.accountType === "super_admin" && user?.role !== "super_admin"
    if (!canManageTeam || target.id === user?.uid || cannotManageTarget) {
      toast({
        title: "Action non autorisée",
        description: target.id === user?.uid
          ? "Votre propre accès ne peut pas être modifié depuis cette page."
          : "Votre rôle ne permet pas de modifier ce compte.",
        variant: "destructive",
      })
      return
    }
    setPendingToggle(target)
  }

  const handleToggleAdmin = async () => {
    if (!pendingToggle || deactivatingId) return
    const target = pendingToggle
    const nextStatus: UserStatus = target.status === "active" ? "suspended" : "active"
    setDeactivatingId(target.id)
    try {
      await apiFetch(`/api/admin/staff/${encodeURIComponent(target.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })
      setAdmins((current) => current.map((admin) => admin.id === target.id ? { ...admin, status: nextStatus } : admin))
      setPendingToggle(null)
      toast({
        title: nextStatus === "active" ? "Accès réactivé" : "Accès suspendu",
        description: nextStatus === "active"
          ? `${target.name} peut de nouveau accéder à Yahnu.`
          : `Les sessions de ${target.name} ont été fermées.`,
      })
    } catch (error) {
      console.error("Unable to update staff status", error)
      setPendingToggle(null)
      toast({
        title: "Accès inchangé",
        description: staffError(error, "La modification n’a pas pu être enregistrée. Réessayez dans un instant."),
        variant: "destructive",
      })
    } finally {
      setDeactivatingId(null)
    }
  }

  const handleInviteAdmin = async () => {
    const email = inviteDetails.email.trim().toLowerCase()
    if (!canManageTeam || !user) {
      toast({ title: "Action non autorisée", description: "Seuls les administrateurs peuvent inviter un membre.", variant: "destructive" })
      return
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: "Adresse e-mail à vérifier", description: "Saisissez une adresse e-mail valide.", variant: "destructive" })
      return
    }

    setIsInviting(true)
    try {
      const response = await apiFetch<InviteResponse>("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email, role: inviteDetails.role }),
      })
      setInviteLink(response.data.debugUrl ?? "")
      setInviteWasEmailed(response.data.emailDelivery === "sent")
      setIsInviteDialogOpen(true)
      setInviteDetails({ email: "", role: "admin" })
      toast({
        title: "Invitation créée",
        description: response.data.emailDelivery === "sent"
          ? `Une invitation sécurisée a été envoyée à ${email}.`
          : "Le lien de développement est prêt à être copié.",
      })
    } catch (error) {
      console.error("Unable to invite staff member", error)
      toast({
        title: "Invitation non envoyée",
        description: staffError(error, "L’invitation n’a pas pu être créée. Vérifiez l’adresse puis réessayez."),
        variant: "destructive",
      })
    } finally {
      setIsInviting(false)
    }
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink)
      toast({ title: "Lien copié", description: "Le lien d’invitation est dans votre presse-papiers." })
    } catch (error) {
      console.error("Unable to copy invite link", error)
      toast({ title: "Copie impossible", description: "Sélectionnez le lien et copiez-le manuellement.", variant: "destructive" })
    }
  }

  const isProtected = (admin: AdminUser) => admin.id === user?.uid || (admin.accountType === "super_admin" && user?.role !== "super_admin")

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="rounded-xl bg-primary/10 p-3"><Users className="h-5 w-5 text-primary" /></span>
            <div><p className="font-display text-2xl font-semibold">{isLoadingAdmins ? "—" : admins.length}</p><p className="text-sm text-muted-foreground">membres chargés</p></div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-5">
            <span className="rounded-xl bg-lagoon/10 p-3"><ShieldCheck className="h-5 w-5 text-lagoon" /></span>
            <div><p className="font-display text-2xl font-semibold">{isLoadingAdmins ? "—" : activeCount}</p><p className="text-sm text-muted-foreground">accès actifs</p></div>
          </CardContent>
        </Card>
      </div>

      {canManageTeam ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>Inviter un membre</CardTitle>
            <CardDescription>L’invitation est personnelle, sécurisée et valable sept jours.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px_auto] lg:items-end">
              <div className="grid gap-2">
                <Label htmlFor="invite-email">Adresse e-mail professionnelle</Label>
                <Input id="invite-email" placeholder="prenom.nom@yahnu.org" type="email" autoComplete="email" value={inviteDetails.email} onChange={(event) => setInviteDetails((current) => ({ ...current, email: event.target.value }))} disabled={isInviting} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="invite-role">Responsabilité</Label>
                <Select value={inviteDetails.role} onValueChange={(role) => setInviteDetails((current) => ({ ...current, role: role as Role }))} disabled={isInviting}>
                  <SelectTrigger id="invite-role"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    {user?.role === "super_admin" ? <SelectItem value="super_admin">Super administrateur</SelectItem> : null}
                    <SelectItem value="content_manager">Responsable éditorial</SelectItem>
                    <SelectItem value="content_moderator">Modérateur de contenu</SelectItem>
                    <SelectItem value="support_staff">Équipe support</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => void handleInviteAdmin()} className="w-full lg:w-auto" disabled={isInviting}>
                {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Envoyer l’invitation
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-xl border bg-muted/30 p-4 text-sm text-muted-foreground">
          Vous pouvez consulter l’équipe. Seuls les administrateurs peuvent modifier les accès ou envoyer une invitation.
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><CardTitle>Membres et accès</CardTitle><CardDescription className="mt-1">La liste est synchronisée automatiquement toutes les 45 secondes.</CardDescription></div>
            <Button variant="outline" size="sm" onClick={() => void loadAdmins()} disabled={isRefreshing || isLoadingAdmins}>
              {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="mr-2 h-4 w-4" />}Actualiser
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loadFailed ? (
            <div role="alert" className="m-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm">
              <p className="font-semibold text-destructive">Liste temporairement indisponible</p>
              <p className="mt-1 text-muted-foreground">Les données affichées peuvent ne pas être à jour.</p>
            </div>
          ) : null}
          <div className="hidden md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Membre</TableHead><TableHead>Rôle</TableHead><TableHead>Statut</TableHead><TableHead className="text-right">Accès</TableHead></TableRow></TableHeader>
              <TableBody>
                {isLoadingAdmins ? (
                  <TableRow><TableCell colSpan={4} className="h-28 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin motion-reduce:animate-none" />Chargement de l’équipe…</TableCell></TableRow>
                ) : admins.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="h-28 text-center text-muted-foreground">Aucun membre d’administration enregistré.</TableCell></TableRow>
                ) : admins.map((admin) => (
                  <TableRow key={admin.id}>
                    <TableCell><p className="font-medium">{admin.name}</p><p className="text-sm text-muted-foreground">{admin.email}</p></TableCell>
                    <TableCell><Badge variant={admin.accountType === "super_admin" ? "default" : "outline"}>{admin.accountType === "super_admin" ? <Crown className="mr-1 h-3 w-3" /> : null}{roleLabels[admin.accountType]}</Badge></TableCell>
                    <TableCell><Badge variant={admin.status === "active" ? "secondary" : admin.status === "suspended" ? "destructive" : "outline"}>{statusLabels[admin.status]}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="ghost" onClick={() => requestToggle(admin)} disabled={!canManageTeam || isProtected(admin) || deactivatingId !== null} aria-label={`${admin.status === "active" ? "Suspendre" : "Réactiver"} l’accès de ${admin.name}`}>
                        {deactivatingId === admin.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : admin.status === "active" ? <ShieldOff className="mr-2 h-4 w-4 text-destructive" /> : <ShieldCheck className="mr-2 h-4 w-4 text-primary" />}
                        {admin.status === "active" ? "Suspendre" : "Réactiver"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="divide-y md:hidden">
            {isLoadingAdmins ? <div className="flex min-h-40 items-center justify-center text-sm text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Chargement de l’équipe…</div> : null}
            {!isLoadingAdmins && !admins.length ? <p className="p-8 text-center text-sm text-muted-foreground">Aucun membre d’administration enregistré.</p> : null}
            {admins.map((admin) => (
              <article key={admin.id} className="space-y-4 p-4">
                <div><p className="font-semibold">{admin.name}</p><p className="mt-1 break-all text-sm text-muted-foreground">{admin.email}</p></div>
                <div className="flex flex-wrap gap-2"><Badge variant="outline">{roleLabels[admin.accountType]}</Badge><Badge variant={admin.status === "active" ? "secondary" : admin.status === "suspended" ? "destructive" : "outline"}>{statusLabels[admin.status]}</Badge></div>
                <Button className="w-full" variant="outline" onClick={() => requestToggle(admin)} disabled={!canManageTeam || isProtected(admin) || deactivatingId !== null}>
                  {deactivatingId === admin.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : admin.status === "active" ? <ShieldOff className="mr-2 h-4 w-4" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                  {isProtected(admin) ? "Accès protégé" : admin.status === "active" ? "Suspendre l’accès" : "Réactiver l’accès"}
                </Button>
              </article>
            ))}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={Boolean(pendingToggle)} onOpenChange={(open) => { if (!open && !deactivatingId) setPendingToggle(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{pendingToggle?.status === "active" ? "Suspendre cet accès ?" : "Réactiver cet accès ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingToggle?.status === "active"
                ? `${pendingToggle.name} sera déconnecté et ne pourra plus accéder aux outils d’administration.`
                : `${pendingToggle?.name ?? "Ce membre"} pourra de nouveau se connecter selon son rôle.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(deactivatingId)}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={(event) => { event.preventDefault(); void handleToggleAdmin() }} disabled={Boolean(deactivatingId)} className={pendingToggle?.status === "active" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}>
              {deactivatingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
              {pendingToggle?.status === "active" ? "Confirmer la suspension" : "Confirmer la réactivation"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{inviteWasEmailed ? "Invitation envoyée" : "Invitation de développement créée"}</DialogTitle>
            <DialogDescription>
              {inviteWasEmailed
                ? "Le nouveau membre a reçu un lien personnel qui expirera dans sept jours."
                : "L’envoi d’e-mail est désactivé dans cet environnement. Utilisez ce lien unique uniquement pour les tests locaux."}
            </DialogDescription>
          </DialogHeader>
          {inviteLink ? (
            <div className="flex items-center gap-2">
              <div className="grid min-w-0 flex-1 gap-2"><Label htmlFor="invite-link" className="sr-only">Lien d’invitation</Label><Input id="invite-link" value={inviteLink} readOnly /></div>
              <Button type="button" size="icon" variant="outline" onClick={() => void copyToClipboard()} aria-label="Copier le lien d’invitation"><Copy className="h-4 w-4" /></Button>
            </div>
          ) : null}
          <DialogFooter><Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>Fermer</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
