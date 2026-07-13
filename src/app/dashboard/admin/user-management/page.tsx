"use client"

import { useCallback, useEffect, useState } from "react"
import { Loader2, UserCog } from "lucide-react"

import { UserManagementClient, type User } from "./user-management-client"
import { UserManagementHeader } from "./user-management-header"
import { apiFetch } from "@/lib/api-client"

type UsersResponse = { data: { users: User[]; truncated: boolean } }

export default function ManageUsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadUsers = useCallback(async () => {
    try {
      const response = await apiFetch<UsersResponse>("/api/admin/users")
      setUsers(response.data.users)
      setError(response.data.truncated ? "Showing the 1,000 most recent users. Refine the dataset before exporting." : null)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load users.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadUsers()
    const interval = window.setInterval(() => void loadUsers(), 45_000)
    return () => window.clearInterval(interval)
  }, [loadUsers])

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <UserCog className="h-6 w-6 text-primary" />
          </div>
          <UserManagementHeader />
        </div>
      </div>

      {error && (
        <div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading users…
        </div>
      ) : (
        <UserManagementClient initialUsers={users} />
      )}
    </div>
  )
}
