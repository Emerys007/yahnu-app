import { ShieldCheck, Users } from "lucide-react"

import { ManageTeamClient } from "./manage-team-client"

export default function ManageTeamPage() {
  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <p className="section-kicker">Équipe Yahnu · Abidjan</p>
        <div className="mt-2 flex items-start gap-3">
          <span className="rounded-2xl bg-primary/10 p-3 text-primary"><Users className="h-6 w-6" /></span>
          <div>
            <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Équipe d’administration</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Invitez les personnes qui accompagnent la communauté ivoirienne et attribuez uniquement les accès nécessaires.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-primary" /> Chaque changement d’accès est protégé et journalisé.
            </p>
          </div>
        </div>
      </section>
      <ManageTeamClient />
    </div>
  )
}
