"use client"

import { useCallback, useEffect, useState } from "react"
import { AlertCircle, Loader2, RefreshCw, ShieldCheck } from "lucide-react"

import { ContentModerationClient } from "./content-moderation-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { apiFetch } from "@/lib/api-client"

export type ModerationItem = {
  id: string
  name: string
  email: string
  type: "company" | "school"
  submittedAt: string
  details: Record<string, unknown>
}

type ModerationResponse = { data: { items: ModerationItem[]; truncated?: boolean } }

export default function ContentModerationPage() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [failed, setFailed] = useState(false)
  const [truncated, setTruncated] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setFailed(false)
    try {
      const response = await apiFetch<ModerationResponse>("/api/content/moderation")
      setItems(response.data.items)
      setTruncated(Boolean(response.data.truncated))
    } catch (error) {
      console.error("Unable to load moderation queue", error)
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <p className="section-kicker">Confiance · Communauté Yahnu</p>
            <div className="mt-2 flex items-start gap-3">
              <span className="rounded-2xl bg-primary/10 p-3 text-primary"><ShieldCheck className="h-6 w-6" /></span>
              <div>
                <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Validation des profils</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Vérifiez les entreprises et les établissements ivoiriens avant de les rendre visibles aux jeunes diplômés.
                </p>
              </div>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={() => void load()} disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser la file
          </Button>
        </div>
      </section>

      {truncated ? (
        <div role="status" className="rounded-xl border border-terra/30 bg-terra/10 px-4 py-3 text-sm text-cocoa">
          La file contient plus de 500 profils. Traitez les demandes les plus anciennes pour afficher la suite.
        </div>
      ) : null}

      {loading && items.length === 0 ? (
        <Card aria-live="polite">
          <CardContent className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
            <p>Chargement des profils à examiner…</p>
          </CardContent>
        </Card>
      ) : failed ? (
        <Card>
          <CardContent className="flex min-h-64 flex-col items-center justify-center p-8 text-center" role="alert">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="mt-3 font-semibold">File de validation indisponible</p>
            <p className="mt-1 max-w-md text-sm text-muted-foreground">Les profils n’ont pas pu être récupérés. Aucune décision n’a été enregistrée.</p>
            <Button variant="outline" className="mt-5" onClick={() => void load()}>Réessayer</Button>
          </CardContent>
        </Card>
      ) : (
        <ContentModerationClient key={items.map((item) => item.id).join(":")} initialItems={items} />
      )}
    </div>
  )
}
