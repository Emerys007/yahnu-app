import Link from "next/link";
import { ArrowLeft, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function NotFound() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-ivory px-5 py-12 dark:bg-background">
      <div className="lagoon-grid absolute inset-0 opacity-30" />
      <section className="surface-glass relative w-full max-w-xl rounded-[2rem] p-7 text-center shadow-lift sm:p-10" aria-labelledby="not-found-title">
        <Logo className="mx-auto h-14 w-14 text-foreground" />
        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-lagoon/15 text-lagoon">
          <Compass className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="section-kicker mx-auto mt-6 w-fit">Route introuvable · 404</p>
        <h1 id="not-found-title" className="display-title mt-4 text-3xl sm:text-4xl">On a pris la mauvaise sortie.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted-foreground">Cette adresse ne mène à aucune page Yahnu. Revenez à l’accueil ou explorez les opportunités ouvertes.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button asChild><Link href="/jobs">Explorer les offres</Link></Button>
          <Button variant="outline" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Retour à l’accueil</Link></Button>
        </div>
      </section>
    </main>
  );
}
