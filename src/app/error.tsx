"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/logo";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-5 py-12 dark:bg-background">
      <section className="surface-glass w-full max-w-xl rounded-[2rem] p-7 text-center shadow-lift sm:p-10" aria-labelledby="error-title">
        <Logo className="mx-auto h-14 w-14 text-foreground" />
        <span className="mx-auto mt-8 grid h-14 w-14 place-items-center rounded-2xl bg-terra/15 text-terra">
          <AlertTriangle className="h-7 w-7" aria-hidden="true" />
        </span>
        <p className="section-kicker mx-auto mt-6 w-fit">Un petit détour</p>
        <h1 id="error-title" className="display-title mt-4 text-3xl sm:text-4xl">Cette page n’a pas pu se charger.</h1>
        <p className="mx-auto mt-4 max-w-md leading-7 text-muted-foreground">Votre travail est toujours là. Réessayez maintenant ou revenez à l’accueil de Yahnu.</p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          <Button onClick={reset}><RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />Réessayer</Button>
          <Button variant="outline" asChild><Link href="/"><ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />Retour à l’accueil</Link></Button>
        </div>
      </section>
    </main>
  );
}
