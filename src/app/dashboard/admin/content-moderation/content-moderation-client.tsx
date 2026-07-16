"use client"

import { useMemo, useState } from "react"
import { Building2, Check, Eye, Loader2, School, ShieldCheck, X } from "lucide-react"

import type { ModerationItem } from "./page"
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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

const detailLabels: Record<string, string> = {
  name: "Nom du responsable",
  companyName: "Entreprise",
  schoolName: "Établissement",
  contactName: "Personne à contacter",
  industry: "Secteur d’activité",
  phone: "Téléphone",
  status: "Statut du compte",
  address: "Adresse",
  city: "Ville",
  website: "Site internet",
  description: "Présentation",
  registrationNumber: "Numéro d’immatriculation",
  studentCount: "Nombre d’étudiants",
  programs: "Filières proposées",
}

function formatSubmittedAt(value: string) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Date non disponible"
  return new Intl.DateTimeFormat("fr-CI", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Africa/Abidjan",
  }).format(date)
}

function humanizeKey(key: string) {
  if (detailLabels[key]) return detailLabels[key]
  return key
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^./, (letter) => letter.toLocaleUpperCase("fr"))
}

function formatDetail(value: unknown): string {
  if (value === null || value === undefined || value === "") return "Non renseigné"
  if (typeof value === "boolean") return value ? "Oui" : "Non"
  if (Array.isArray(value)) return value.length ? value.map(formatDetail).join(", ") : "Non renseigné"
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
    return entries.length
      ? entries.map(([key, item]) => `${humanizeKey(key)} : ${formatDetail(item)}`).join(" · ")
      : "Non renseigné"
  }
  return String(value)
}

function EmptyQueue({ type }: { type: "company" | "school" }) {
  const Icon = type === "company" ? Building2 : School
  return (
    <div className="flex min-h-56 flex-col items-center justify-center p-8 text-center">
      <span className="rounded-2xl bg-primary/10 p-4"><Icon className="h-7 w-7 text-primary" /></span>
      <p className="mt-4 font-semibold">Tout est à jour</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        Aucun {type === "company" ? "profil d’entreprise" : "établissement"} n’attend de validation.
      </p>
    </div>
  )
}

export function ContentModerationClient({ initialItems }: { initialItems: ModerationItem[] }) {
  const [items, setItems] = useState(initialItems)
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null)
  const [decision, setDecision] = useState<{ item: ModerationItem; status: "active" | "declined" } | null>(null)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { toast } = useToast()

  const companies = useMemo(() => items.filter((item) => item.type === "company"), [items])
  const schools = useMemo(() => items.filter((item) => item.type === "school"), [items])

  const handleAction = async () => {
    if (!decision || processingId) return
    const { item, status } = decision
    setProcessingId(item.id)
    try {
      await apiFetch(`/api/content/moderation/${encodeURIComponent(item.id)}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      })
      setItems((current) => current.filter((candidate) => candidate.id !== item.id))
      setSelectedItem((current) => current?.id === item.id ? null : current)
      setDecision(null)
      toast({
        title: status === "active" ? "Profil approuvé" : "Profil refusé",
        description: status === "active"
          ? `${item.name} peut maintenant accéder à Yahnu.`
          : `${item.name} ne sera pas publié sur la plateforme.`,
      })
    } catch (error) {
      console.error("Unable to review moderation item", error)
      setDecision(null)
      toast({
        title: "Décision non enregistrée",
        description: "Le profil est resté dans la file. Actualisez les informations puis réessayez.",
        variant: "destructive",
      })
    } finally {
      setProcessingId(null)
    }
  }

  const actionButtons = (item: ModerationItem, compact = false) => (
    <div className={compact ? "grid grid-cols-3 gap-2" : "flex justify-end gap-2"}>
      <Button variant="outline" size="sm" onClick={() => setSelectedItem(item)} className={compact ? "px-2" : ""}>
        <Eye className="mr-1.5 h-4 w-4" />Détails
      </Button>
      <Button variant="outline" size="sm" className="border-primary/30 text-primary hover:bg-primary/10 hover:text-primary" onClick={() => setDecision({ item, status: "active" })} disabled={processingId !== null}>
        <Check className="mr-1.5 h-4 w-4" />Valider
      </Button>
      <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDecision({ item, status: "declined" })} disabled={processingId !== null}>
        <X className="mr-1.5 h-4 w-4" />Refuser
      </Button>
    </div>
  )

  const renderQueue = (queue: ModerationItem[], type: "company" | "school") => {
    if (!queue.length) return <EmptyQueue type={type} />
    return (
      <>
        <div className="hidden md:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Profil</TableHead>
                <TableHead>Soumis le</TableHead>
                <TableHead className="text-right">Décision</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {queue.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <p className="font-medium">{item.name}</p>
                    <p className="mt-0.5 text-sm text-muted-foreground">{item.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatSubmittedAt(item.submittedAt)}</TableCell>
                  <TableCell>{actionButtons(item)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="divide-y md:hidden">
          {queue.map((item) => (
            <article key={item.id} className="space-y-4 p-4">
              <div>
                <p className="font-semibold">{item.name}</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">{item.email}</p>
                <p className="mt-2 text-xs text-muted-foreground">Soumis le {formatSubmittedAt(item.submittedAt)}</p>
              </div>
              {actionButtons(item, true)}
            </article>
          ))}
        </div>
      </>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" />Profils en attente</CardTitle>
              <CardDescription className="mt-1">Examinez les informations fournies avant toute validation.</CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">{items.length} à traiter</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Tabs defaultValue="companies">
            <div className="border-b p-3 sm:p-4">
              <TabsList className="grid h-auto w-full grid-cols-2 sm:w-fit">
                <TabsTrigger value="companies" className="gap-2 px-3 sm:px-5"><Building2 className="h-4 w-4" />Entreprises <Badge variant="secondary">{companies.length}</Badge></TabsTrigger>
                <TabsTrigger value="schools" className="gap-2 px-3 sm:px-5"><School className="h-4 w-4" />Établissements <Badge variant="secondary">{schools.length}</Badge></TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="companies" className="m-0">{renderQueue(companies, "company")}</TabsContent>
            <TabsContent value="schools" className="m-0">{renderQueue(schools, "school")}</TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={Boolean(selectedItem)} onOpenChange={(open) => { if (!open) setSelectedItem(null) }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedItem?.name}</DialogTitle>
            <DialogDescription>Informations déclarées lors de la création du compte.</DialogDescription>
          </DialogHeader>
          {selectedItem ? (
            <dl className="divide-y rounded-xl border">
              {Object.entries(selectedItem.details).map(([key, value]) => (
                <div key={key} className="grid gap-1 px-4 py-3 sm:grid-cols-[180px_1fr] sm:gap-4">
                  <dt className="text-sm font-medium">{humanizeKey(key)}</dt>
                  <dd className="break-words text-sm leading-6 text-muted-foreground">{formatDetail(value)}</dd>
                </div>
              ))}
            </dl>
          ) : null}
          {selectedItem ? (
            <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
              <Button variant="ghost" onClick={() => setSelectedItem(null)}>Fermer</Button>
              <Button variant="outline" className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDecision({ item: selectedItem, status: "declined" })}>Refuser le profil</Button>
              <Button onClick={() => setDecision({ item: selectedItem, status: "active" })}>Valider le profil</Button>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(decision)} onOpenChange={(open) => { if (!open && !processingId) setDecision(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{decision?.status === "active" ? "Valider ce profil ?" : "Refuser ce profil ?"}</AlertDialogTitle>
            <AlertDialogDescription>
              {decision?.status === "active"
                ? `${decision.item.name} pourra se connecter et son profil deviendra actif sur Yahnu.`
                : `${decision?.item.name ?? "Ce profil"} ne sera pas publié. La décision sera enregistrée dans le journal d’audit.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={Boolean(processingId)}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(event) => { event.preventDefault(); void handleAction() }}
              disabled={Boolean(processingId)}
              className={decision?.status === "declined" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
            >
              {processingId ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
              {decision?.status === "active" ? "Confirmer la validation" : "Confirmer le refus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
