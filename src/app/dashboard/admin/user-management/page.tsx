"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2, RefreshCw, UserCog } from "lucide-react"

import { UserManagementClient, type User } from "./user-management-client"
import { UserManagementHeader } from "./user-management-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"

type UsersResponse = { data: { users: User[]; truncated: boolean } }

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadFailed, setLoadFailed] = useState(false)
  const [truncated, setTruncated] = useState(false)

  const loadUsers = useCallback(async (quiet = false) => {
    if (!quiet) setRefreshing(true)
    try {
      const response = await apiFetch<UsersResponse>("/api/admin/users")
      setUsers(response.data.users)
      setTruncated(response.data.truncated)
      setLoadFailed(false)
    } catch (error) {
      console.error("Unable to load platform users", error)
      setLoadFailed(true)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers(true)
    const interval = window.setInterval(() => void loadUsers(true), 45_000)
    return () => window.clearInterval(interval)
  }, [loadUsers])

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div className="flex items-start gap-3">
            <span className="mt-7 rounded-2xl bg-primary/10 p-3 text-primary"><UserCog className="h-6 w-6" /></span>
            <UserManagementHeader />
          </div>
          <Button variant="outline" onClick={() => void loadUsers()} disabled={refreshing || loading}>
            {refreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
        </div>
      </section>

      {truncated ? (
        <div role="status" className="rounded-xl border border-terra/30 bg-terra/10 px-4 py-3 text-sm text-cocoa">
          Les 1 000 inscriptions les plus récentes sont affichées. Utilisez la recherche et les filtres pour affiner cette liste.
        </div>
      ) : null}

      {loadFailed && users.length > 0 ? (
        <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm">
          <p className="font-semibold text-destructive">Actualisation impossible</p>
          <p className="mt-1 text-muted-foreground">La dernière liste disponible reste affichée et peut ne pas être à jour.</p>
        </div>
      ) : null}

      {loading ? (
        <Card aria-live="polite"><CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground"><Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" /><p>Chargement des comptes…</p></CardContent></Card>
      ) : loadFailed && users.length === 0 ? (
        <Card><CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center" role="alert"><AlertCircle className="h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">Comptes indisponibles</p><p className="mt-1 max-w-md text-sm text-muted-foreground">La liste n’a pas pu être récupérée. Aucun compte n’a été modifié.</p><Button variant="outline" className="mt-5" onClick={() => void loadUsers()}>Réessayer</Button></CardContent></Card>
      ) : (
        <UserManagementClient initialUsers={users} />
      )}
    </div>
  )
}
