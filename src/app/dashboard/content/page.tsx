import Link from "next/link";
import { ArrowUpRight, FileText, Megaphone, Newspaper, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const contentWorkspaces = [
  {
    href: "/dashboard/content/blog",
    title: "Journal Yahnu",
    description: "Rédigez, relisez et publiez les conseils carrière destinés aux jeunes diplômés de Côte d’Ivoire.",
    icon: Newspaper,
    tag: "Éditorial",
  },
  {
    href: "/dashboard/content/static-pages",
    title: "Pages du site",
    description: "Mettez à jour les pages À propos, Confidentialité et Conditions depuis leur source de production.",
    icon: FileText,
    tag: "Site public",
  },
  {
    href: "/dashboard/support/announcements",
    title: "Annonces",
    description: "Préparez les informations importantes visibles par les membres de la communauté Yahnu.",
    icon: Megaphone,
    tag: "Communauté",
  },
] as const;

export default function ContentManagementPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-8 pb-10">
      <section className="ci-pattern relative overflow-hidden rounded-[1.75rem] bg-cocoa p-6 text-white shadow-lift sm:p-9">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-terra text-cocoa"><PenTool className="h-5 w-5" aria-hidden="true" /></span>
        <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#ffd4b0]">Studio de contenu · Côte d’Ivoire</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-semibold leading-tight sm:text-5xl">Donnez une voix claire et humaine à Yahnu.</h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-white/70 sm:text-lg">Choisissez l’espace qui correspond au contenu à mettre à jour. Chaque publication agit directement sur sa source de production.</p>
      </section>

      <div className="grid gap-5 md:grid-cols-3">
        {contentWorkspaces.map((workspace, index) => {
          const Icon = workspace.icon;
          return (
            <Card key={workspace.href} className="flex min-h-72 flex-col overflow-hidden">
              <CardHeader className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <span className={index === 1 ? "grid h-11 w-11 place-items-center rounded-xl bg-lagoon/10 text-lagoon" : index === 2 ? "grid h-11 w-11 place-items-center rounded-xl bg-terra/15 text-terra" : "grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary"}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-semibold text-muted-foreground">{workspace.tag}</span>
                </div>
                <div className="space-y-2">
                  <CardTitle className="text-2xl">{workspace.title}</CardTitle>
                  <CardDescription className="leading-6">{workspace.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent className="mt-auto">
                <Button asChild className="w-full" variant="outline">
                  <Link href={workspace.href}>Ouvrir l’espace<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
