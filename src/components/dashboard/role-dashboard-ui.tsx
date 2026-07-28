"use client"

import type { LucideIcon } from "lucide-react"
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  MapPin,
  Sparkles,
} from "lucide-react"
import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export type DashboardAction = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  label?: string
}

export type DashboardRoadmapStep = DashboardAction & {
  step: string
}

export type DashboardLocalNote = {
  title: string
  description: string
  href: string
  icon: LucideIcon
  tag: string
}

type RoleDashboardProps = {
  roleLabel: string
  title: string
  description: string
  locationLine: string
  primaryAction: DashboardAction
  secondaryAction: DashboardAction
  roadmap: DashboardRoadmapStep[]
  quickActions: DashboardAction[]
  localNotes: DashboardLocalNote[]
  closingTitle: string
  closingDescription: string
}

function IvoryCoastMark() {
  return (
    <div
      aria-label="Couleurs de la Côte d’Ivoire"
      className="flex h-2 w-24 overflow-hidden rounded-full ring-1 ring-white/20"
      role="img"
    >
      <span className="flex-1 bg-[#f5a623]" />
      <span className="flex-1 bg-white" />
      <span className="flex-1 bg-[#0f8a4b]" />
    </div>
  )
}

export function RoleDashboard({
  roleLabel,
  title,
  description,
  locationLine,
  primaryAction,
  secondaryAction,
  roadmap,
  quickActions,
  localNotes,
  closingTitle,
  closingDescription,
}: RoleDashboardProps) {
  const reduceMotion = useReducedMotion()
  const PrimaryIcon = primaryAction.icon
  const SecondaryIcon = secondaryAction.icon

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 pb-10 sm:space-y-8">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        aria-labelledby="role-dashboard-title"
        className="relative isolate overflow-hidden rounded-[1.75rem] bg-[hsl(var(--sidebar-background))] px-5 py-6 text-white shadow-lift sm:px-8 sm:py-9 lg:px-10"
        initial={reduceMotion ? false : { opacity: 0, y: 12 }}
        transition={{ duration: reduceMotion ? 0 : 0.36, ease: [0.16, 1, 0.3, 1] }}
      >
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-28 h-80 w-80 rounded-full border-[54px] border-terra/15"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-36 right-20 h-72 w-72 rounded-full border-[46px] border-primary/20"
        />

        <div className="relative grid items-end gap-8 lg:grid-cols-[minmax(0,1.55fr)_minmax(260px,0.65fr)]">
          <div>
            <div className="mb-6 flex flex-wrap items-center gap-3">
              <IvoryCoastMark />
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/70">
                {roleLabel}
              </span>
            </div>
            <h1
              className="max-w-3xl text-balance font-headline text-3xl font-bold leading-[1.06] tracking-[-0.035em] sm:text-4xl lg:text-5xl"
              id="role-dashboard-title"
            >
              {title}
            </h1>
            <p className="mt-4 max-w-2xl text-pretty text-base leading-7 text-white/75 sm:text-lg">
              {description}
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <Button
                asChild
                className="h-12 justify-center bg-terra px-5 text-terra-foreground shadow-none hover:bg-terra/90 focus-visible:ring-terra sm:w-auto"
                size="lg"
              >
                <Link href={primaryAction.href}>
                  <PrimaryIcon aria-hidden="true" />
                  {primaryAction.title}
                  <ArrowRight aria-hidden="true" />
                </Link>
              </Button>
              <Button
                asChild
                className="h-12 justify-center border-white/35 bg-white/5 px-5 text-white hover:bg-white/[0.12] hover:text-white focus-visible:ring-white sm:w-auto"
                size="lg"
                variant="outline"
              >
                <Link href={secondaryAction.href}>
                  <SecondaryIcon aria-hidden="true" />
                  {secondaryAction.title}
                </Link>
              </Button>
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-5 backdrop-blur-sm sm:p-6">
            <div className="flex items-start gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-terra text-terra-foreground">
                <MapPin aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-terra">
                  Votre terrain de jeu
                </p>
                <p className="mt-2 text-base font-semibold leading-6 text-white">
                  {locationLine}
                </p>
              </div>
            </div>
            <div className="mt-5 border-t border-white/15 pt-5">
              <p className="text-sm leading-6 text-white/70">
                Avancez à votre rythme : aucune performance ni statistique n’est
                supposée ici. Vos données réelles apparaîtront dans les espaces dédiés.
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(310px,0.7fr)]">
        <Card className="overflow-hidden border-border/80 shadow-sm">
          <CardHeader className="gap-2 border-b border-border/70 bg-secondary/35 p-5 sm:p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Compass aria-hidden="true" className="size-4" />
              Parcours conseillé
            </div>
            <CardTitle className="font-headline text-2xl tracking-tight sm:text-3xl">
              Votre feuille de route
            </CardTitle>
            <CardDescription className="max-w-2xl text-sm leading-6 sm:text-base">
              Trois étapes concrètes. Commencez par celle qui correspond le mieux à
              votre situation du moment.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 sm:p-4">
            <ol className="space-y-2">
              {roadmap.map((item, index) => {
                const Icon = item.icon

                return (
                  <motion.li
                    animate={{ opacity: 1, y: 0 }}
                    initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                    key={item.title}
                    transition={{
                      delay: reduceMotion ? 0 : 0.04 * index,
                      duration: reduceMotion ? 0 : 0.28,
                    }}
                  >
                    <Link
                      className="group flex min-h-24 items-start gap-4 rounded-2xl border border-transparent p-3 transition-colors duration-200 hover:border-primary/25 hover:bg-secondary/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:items-center sm:p-4"
                      href={item.href}
                    >
                      <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-[hsl(var(--sidebar-background))] text-white dark:bg-terra dark:text-terra-foreground">
                        <Icon aria-hidden="true" className="size-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-xs font-bold uppercase tracking-[0.14em] text-primary">
                          {item.step}
                        </span>
                        <span className="mt-1 block text-base font-semibold text-foreground">
                          {item.title}
                        </span>
                        <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                          {item.description}
                        </span>
                      </span>
                      <ArrowRight
                        aria-hidden="true"
                        className="mt-3 size-5 shrink-0 text-muted-foreground transition-transform duration-200 group-hover:translate-x-1 group-hover:text-primary sm:mt-0"
                      />
                    </Link>
                  </motion.li>
                )
              })}
            </ol>
          </CardContent>
        </Card>

        <Card className="border-border/80 shadow-sm">
          <CardHeader className="p-5 sm:p-6">
            <div className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Sparkles aria-hidden="true" className="size-5" />
            </div>
            <CardTitle className="pt-2 font-headline text-2xl tracking-tight">
              Repères Côte d’Ivoire
            </CardTitle>
            <CardDescription className="text-sm leading-6">
              Des idées locales pour orienter votre prochaine recherche.
            </CardDescription>
            <Badge
              className="mt-1 w-fit border-orange-300/70 bg-orange-50 text-orange-950 hover:bg-orange-50 dark:border-orange-300/20 dark:bg-orange-400/10 dark:text-orange-100"
              variant="outline"
            >
              Suggestions — pas des offres en direct
            </Badge>
          </CardHeader>
          <CardContent className="space-y-3 px-5 pb-5 sm:px-6 sm:pb-6">
            {localNotes.map((note) => {
              const Icon = note.icon

              return (
                <Link
                  className="group block rounded-2xl border border-border/80 p-4 transition-colors duration-200 hover:border-primary/45 hover:bg-primary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  href={note.href}
                  key={note.title}
                >
                  <span className="flex items-start gap-3">
                    <Icon
                      aria-hidden="true"
                      className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <span className="min-w-0">
                      <span className="text-xs font-bold uppercase tracking-[0.13em] text-muted-foreground">
                        {note.tag}
                      </span>
                      <span className="mt-1 block font-semibold text-foreground group-hover:text-primary">
                        {note.title}
                      </span>
                      <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                        {note.description}
                      </span>
                    </span>
                  </span>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      </div>

      <section aria-labelledby="quick-actions-title">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-primary">Accès direct</p>
            <h2
              className="font-headline text-2xl font-bold tracking-tight sm:text-3xl"
              id="quick-actions-title"
            >
              Tout ce qu’il vous faut, à portée de main
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">Pensé pour le mobile comme pour le bureau.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon

            return (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                key={action.title}
                transition={{
                  delay: reduceMotion ? 0 : 0.035 * index,
                  duration: reduceMotion ? 0 : 0.26,
                }}
              >
                <Link
                  className="group flex min-h-36 h-full flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transform-none"
                  href={action.href}
                >
                  <span className="flex items-start justify-between gap-4">
                    <span className="flex size-11 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon aria-hidden="true" className="size-5" />
                    </span>
                    {action.label ? (
                      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">
                        {action.label}
                      </span>
                    ) : null}
                  </span>
                  <span className="mt-5">
                    <span className="flex items-center gap-2 font-semibold text-foreground">
                      {action.title}
                      <ArrowRight
                        aria-hidden="true"
                        className="size-4 transition-transform duration-200 group-hover:translate-x-1"
                      />
                    </span>
                    <span className="mt-1.5 block text-sm leading-5 text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                </Link>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-5 rounded-[1.5rem] border border-primary/20 bg-secondary/60 p-5 dark:bg-secondary/45 sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex items-start gap-4">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <CheckCircle2 aria-hidden="true" className="size-5" />
          </span>
          <div>
            <h2 className="font-headline text-xl font-bold text-foreground">{closingTitle}</h2>
            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {closingDescription}
            </p>
          </div>
        </div>
        <Button
          asChild
          className="h-12 w-full shrink-0 bg-[hsl(var(--sidebar-background))] text-white shadow-none hover:bg-[hsl(var(--sidebar-accent))] dark:bg-terra dark:text-terra-foreground dark:hover:bg-terra/90 sm:w-auto"
        >
          <Link href={primaryAction.href}>
            {primaryAction.title}
            <ArrowRight aria-hidden="true" />
          </Link>
        </Button>
      </section>
    </div>
  )
}
