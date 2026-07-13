"use client"

import React, { useEffect, useState } from "react"
import { Building, Check, Loader2, School, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"
import type { UserStatus } from "@/context/auth-context"

export type AdminRequest = {
  id: string
  name: string
  email: string
  accountType: "Company" | "School"
  status: UserStatus
  date: string
}

type AdminClientProps = {
  initialRequests: AdminRequest[]
  onChanged?: () => void | Promise<void>
}

export const AdminClient = ({ initialRequests, onChanged }: AdminClientProps) => {
  const { t } = useLocalization()
  const { toast } = useToast()
  const [requests, setRequests] = useState(initialRequests)
  const [pendingId, setPendingId] = useState<string | null>(null)

  useEffect(() => setRequests(initialRequests), [initialRequests])

  const handleRequest = async (id: string, action: "approve" | "reject") => {
    const registration = requests.find((request) => request.id === id)
    if (!registration || pendingId) return

    setPendingId(id)
    try {
      const newStatus = action === "approve" ? "active" : "declined"
      await apiFetch(`/api/admin/users/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      })

      setRequests((current) => current.filter((request) => request.id !== id))
      toast({
        title: action === "approve" ? t("Request Approved") : t("Request Rejected"),
        description: `${t("The registration for")} ${registration.name} ${t(action === "approve" ? "has been approved." : "has been rejected.")}`,
      })
      await onChanged?.()
    } catch (error) {
      toast({
        title: t("Error"),
        description: error instanceof Error ? error.message : t("Failed to update user status."),
        variant: "destructive",
      })
    } finally {
      setPendingId(null)
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("dashboard.admin.overview.organizationName")}</TableHead>
          <TableHead>{t("common.type")}</TableHead>
          <TableHead className="text-right">{t("dashboard.admin.overview.actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>
              <div className="font-medium">{request.name}</div>
              <div className="text-xs text-muted-foreground">{request.email}</div>
            </TableCell>
            <TableCell>
              <Badge variant="outline" className="gap-1">
                {request.accountType === "Company" ? <Building className="h-3 w-3" /> : <School className="h-3 w-3" />}
                {request.accountType}
              </Badge>
            </TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                size="sm"
                variant="outline"
                aria-label={`${t("Reject")} ${request.name}`}
                disabled={pendingId !== null}
                onClick={() => handleRequest(request.id, "reject")}
              >
                {pendingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
              </Button>
              <Button
                size="sm"
                aria-label={`${t("Approve")} ${request.name}`}
                disabled={pendingId !== null}
                onClick={() => handleRequest(request.id, "approve")}
              >
                {pendingId === request.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              </Button>
            </TableCell>
          </TableRow>
        ))}
        {requests.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
              {t("dashboard.admin.overview.noPendingRequests")}
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
