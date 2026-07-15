import Link from "next/link"
import { ArrowUpRight, FileText, Megaphone, Newspaper } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const contentWorkspaces = [
  {
    href: "/dashboard/content/blog",
    title: "Blog posts",
    description: "Create, edit, publish, and unpublish articles from the production-backed blog workspace.",
    icon: Newspaper,
  },
  {
    href: "/dashboard/content/static-pages",
    title: "Static pages",
    description: "Update the public About, Privacy Policy, and Terms pages through the page-content service.",
    icon: FileText,
  },
  {
    href: "/dashboard/support/announcements",
    title: "Announcements",
    description: "Create and manage announcements using the shared production announcement workflow.",
    icon: Megaphone,
  },
]

export default function ContentManagementPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-8 py-2">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium text-primary">Content operations</p>
        <h1 className="text-3xl font-bold tracking-tight">Manage live content</h1>
        <p className="text-muted-foreground leading-7">
          Choose a production-backed workspace. Drafts, edits, and publication actions are performed only in the service that owns that content.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {contentWorkspaces.map((workspace) => {
          const Icon = workspace.icon

          return (
            <Card key={workspace.href} className="flex flex-col">
              <CardHeader className="space-y-4">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="space-y-2">
                  <CardTitle>{workspace.title}</CardTitle>
                  <CardDescription className="leading-6">{workspace.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full" variant="outline">
                  <Link href={workspace.href}>
                    Open workspace
                    <ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
