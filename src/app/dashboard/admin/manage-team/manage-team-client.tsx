"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Copy, Crown, Loader2, ShieldCheck, ShieldOff, UserPlus } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth, type Role, type UserStatus } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

type AdminUser = {
  id: string
  name: string
  email: string
  accountType: Role
  status: UserStatus
}

type StaffResponse = { data: { staff: AdminUser[] } }
type InviteResponse = {
  data: {
    invite: { id: string; email: string; role: Role; expiresAt: string }
    emailDelivery: "sent" | "development_link"
    debugUrl?: string
  }
}

export function ManageTeamClient({ initialAdmins = [] }: { initialAdmins?: AdminUser[] }) {
  const { t } = useLocalization()
  const { toast } = useToast()
  const { user } = useAuth()
  const [admins, setAdmins] = useState<AdminUser[]>(initialAdmins)
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(initialAdmins.length === 0)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [inviteLink, setInviteLink] = useState("")
  const [isInviting, setIsInviting] = useState(false)
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null)
  const [inviteDetails, setInviteDetails] = useState({ email: "", role: "admin" as Role })
  const canManageTeam = user?.role === "admin" || user?.role === "super_admin"

  const loadAdmins = useCallback(async () => {
    try {
      const response = await apiFetch<StaffResponse>("/api/admin/staff")
      setAdmins(response.data.staff)
      setLoadError(null)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load administrators.")
    } finally {
      setIsLoadingAdmins(false)
    }
  }, [])

  useEffect(() => {
    void loadAdmins()
    const interval = window.setInterval(() => void loadAdmins(), 45_000)
    return () => window.clearInterval(interval)
  }, [loadAdmins])

  const handleToggleAdmin = async (id: string) => {
    const target = admins.find((admin) => admin.id === id)
    const cannotManageTarget = target?.accountType === "super_admin" && user?.role !== "super_admin"
    if (!canManageTeam || !target || id === user?.uid || cannotManageTarget) {
      toast({ title: t("Action Forbidden"), description: t("This administrator cannot be updated."), variant: "destructive" })
      return
    }

    const nextStatus = target.status === "active" ? "suspended" : "active"
    setDeactivatingId(id)
    try {
      await apiFetch(`/api/admin/staff/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      })
      setAdmins((current) => current.map((admin) => admin.id === id ? { ...admin, status: nextStatus } : admin))
      toast({
        title: nextStatus === "active" ? t("Administrator activated") : t("Administrator deactivated"),
        description: nextStatus === "active"
          ? `${target.name} ${t("can now access Yahnu.")}`
          : `${target.name} ${t("can no longer access Yahnu.")}`,
      })
    } catch (error) {
      toast({ title: t("Error"), description: error instanceof Error ? error.message : t("Could not update this administrator."), variant: "destructive" })
    } finally {
      setDeactivatingId(null)
    }
  }

  const handleInviteAdmin = async () => {
    const email = inviteDetails.email.trim().toLowerCase()
    if (!canManageTeam || !user) {
      toast({ title: t("Action Forbidden"), description: t("Only platform administrators can send invitations."), variant: "destructive" })
      return
    }
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: t("Email required"), description: t("Please enter an email to send an invite."), variant: "destructive" })
      return
    }

    setIsInviting(true)
    try {
      const response = await apiFetch<InviteResponse>("/api/admin/invites", {
        method: "POST",
        body: JSON.stringify({ email, role: inviteDetails.role }),
      })
      setInviteLink(response.data.debugUrl ?? "")
      setIsInviteDialogOpen(true)
      setInviteDetails({ email: "", role: "admin" })
      toast({
        title: t("Invitation sent"),
        description: response.data.emailDelivery === "sent"
          ? `${t("A secure invitation was emailed to")} ${email}.`
          : t("Email is not configured locally; use the development invitation link."),
      })
    } catch (error) {
      toast({ title: t("Error"), description: error instanceof Error ? error.message : t("Could not send the invitation."), variant: "destructive" })
    } finally {
      setIsInviting(false)
    }
  }

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(inviteLink)
    toast({ title: t("Link Copied"), description: t("The invite link has been copied to your clipboard.") })
  }

  const getRoleDisplayName = (role: Role) => {
    const roleMap: Record<Role, string> = {
      admin: "Admin",
      super_admin: "Super Admin",
      content_manager: "Content Manager",
      content_moderator: "Content Moderator",
      support_staff: "Support Staff",
      graduate: "Graduate",
      company: "Company",
      school: "School",
    }
    return t(roleMap[role] || role)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("Platform Administrators")}</CardTitle>
          <CardDescription>{t("Manage users with administrative privileges.")}</CardDescription>
        </CardHeader>
        <CardContent>
          {loadError && (
            <div role="alert" className="mb-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {loadError}
            </div>
          )}

          {canManageTeam ? (
            <div className="mb-6 rounded-lg border p-4">
              <h4 className="mb-2 font-semibold">{t("Invite New Administrator")}</h4>
              <div className="flex flex-col items-end gap-2 sm:flex-row">
                <div className="grid w-full flex-grow gap-2">
                  <Label htmlFor="invite-email">{t("New admin's email")}</Label>
                  <Input
                    id="invite-email"
                    placeholder={t("New admin's email")}
                    type="email"
                    value={inviteDetails.email}
                    onChange={(event) => setInviteDetails((current) => ({ ...current, email: event.target.value }))}
                    disabled={isInviting}
                  />
                </div>
                <div className="grid w-full shrink-0 gap-2 sm:w-auto">
                  <Label htmlFor="invite-role">{t("Select role")}</Label>
                  <Select
                    value={inviteDetails.role}
                    onValueChange={(role) => setInviteDetails((current) => ({ ...current, role: role as Role }))}
                    disabled={isInviting}
                  >
                    <SelectTrigger id="invite-role" className="w-full sm:w-[190px]">
                      <SelectValue placeholder={t("Select role")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">{t("Admin")}</SelectItem>
                      {user?.role === "super_admin" && <SelectItem value="super_admin">{t("Super Admin")}</SelectItem>}
                      <SelectItem value="content_manager">{t("Content Manager")}</SelectItem>
                      <SelectItem value="content_moderator">{t("Content Moderator")}</SelectItem>
                      <SelectItem value="support_staff">{t("Support Staff")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleInviteAdmin} className="w-full px-4 sm:w-auto" disabled={isInviting}>
                  {isInviting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                  {isInviting ? t("Sending...") : t("Send Invite")}
                </Button>
              </div>
            </div>
          ) : (
            <p className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
              {t("You can review administrators, but only platform administrators can change access.")}
            </p>
          )}

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("Name")}</TableHead>
                <TableHead>{t("Email")}</TableHead>
                <TableHead>{t("Account Type")}</TableHead>
                <TableHead>{t("Status")}</TableHead>
                <TableHead className="text-right">{t("Actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingAdmins ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />{t("Loading administrators...")}</TableCell></TableRow>
              ) : admins.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-24 text-center text-muted-foreground">{t("No administrators found.")}</TableCell></TableRow>
              ) : admins.map((admin) => {
                const protectedSuperAdmin = admin.accountType === "super_admin" && user?.role !== "super_admin"
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell>
                      <Badge variant={admin.accountType === "super_admin" ? "default" : "secondary"}>
                        {admin.accountType === "super_admin" && <Crown className="mr-1 h-3 w-3" />}
                        {getRoleDisplayName(admin.accountType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={admin.status === "active" ? "secondary" : "outline"} className="capitalize">
                        {t(`dashboard.user_management.${admin.status}`)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={admin.status === "active" ? t("Deactivate administrator") : t("Activate administrator")}
                        onClick={() => handleToggleAdmin(admin.id)}
                        disabled={!canManageTeam || admin.id === user?.uid || protectedSuperAdmin || deactivatingId !== null}
                      >
                        {deactivatingId === admin.id
                          ? <Loader2 className="h-4 w-4 animate-spin" />
                          : admin.status === "active"
                            ? <ShieldOff className="h-4 w-4 text-destructive" />
                            : <ShieldCheck className="h-4 w-4 text-emerald-600" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("Administrator Invitation")}</DialogTitle>
            <DialogDescription>
              {inviteLink
                ? t("Email is disabled in this local environment. Use this one-time development link to test registration.")
                : t("The secure, one-time invitation was emailed to the new team member and expires in seven days.")}
            </DialogDescription>
          </DialogHeader>
          {inviteLink && (
            <div className="mt-4 flex items-center space-x-2">
              <div className="grid flex-1 gap-2">
                <Label htmlFor="link" className="sr-only">{t("Link")}</Label>
                <Input id="link" value={inviteLink} readOnly />
              </div>
              <Button type="button" size="sm" className="px-3" onClick={copyToClipboard}>
                <span className="sr-only">{t("Copy")}</span>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          )}
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsInviteDialogOpen(false)}>{t("Close")}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
