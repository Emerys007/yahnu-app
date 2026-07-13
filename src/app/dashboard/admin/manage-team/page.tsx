"use client"

import { Users } from "lucide-react"
import { ManageTeamClient } from "./manage-team-client"

export default function ManageTeamPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="rounded-lg bg-primary/10 p-3">
          <Users className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manage Team</h1>
          <p className="mt-1 text-muted-foreground">Invite and manage users with administrative privileges.</p>
        </div>
      </div>
      <ManageTeamClient />
    </div>
  )
}
