import Link from "next/link"
import { ArrowRight, Construction } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

type FeatureUnavailableAction = {
  href: string
  label: string
}

type FeatureUnavailableProps = {
  title: string
  description: string
  actions?: FeatureUnavailableAction[]
}

export function FeatureUnavailable({ title, description, actions = [] }: FeatureUnavailableProps) {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl items-center py-8">
      <Card className="w-full border-dashed">
        <CardHeader className="space-y-4">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Construction className="h-6 w-6" aria-hidden="true" />
          </span>
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">Production status</p>
            <CardTitle className="text-2xl">{title}</CardTitle>
            <CardDescription className="max-w-2xl text-base leading-7">{description}</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <p className="rounded-xl border bg-muted/40 p-4 text-sm leading-6 text-muted-foreground">
            To protect your data, this area does not show sample results and cannot save changes until its production service is connected.
          </p>
          {actions.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {actions.map((action) => (
                <Button asChild key={action.href} variant="outline">
                  <Link href={action.href}>
                    {action.label}
                    <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </section>
  )
}
