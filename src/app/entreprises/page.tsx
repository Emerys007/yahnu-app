import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Building,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  ShieldCheck,
  Users,
} from "lucide-react";

export default function EntreprisesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Building className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Entreprises & PME
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Recrutez des talents pré-qualifiés avec un accompagnement post-recrutement
            </p>
          </div>
        </section>

        {/* Le défi */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8 flex items-center gap-3">
              <AlertTriangle className="h-8 w-8 text-[#F9A825]" />
              Le défi
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Les PME ivoiriennes font face à un paradoxe : des milliers de diplômés sur le marché,
              mais une difficulté persistante à trouver des profils fiables et immédiatement opérationnels.
              Le coût d&apos;un mauvais recrutement est élevé, et les petites structures n&apos;ont pas de
              département RH dédié pour gérer le processus.
            </p>
          </div>
        </section>

        {/* La solution YAHNU */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8 flex items-center gap-3">
              <Target className="h-8 w-8 text-[#F9A825]" />
              La solution YAHNU
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8">
              YAHNU vous donne accès à un vivier de talents pré-qualifiés par nos écoles partenaires.
              Chaque profil est vérifié, évalué, et accompagné. Après le recrutement, nous assurons
              un suivi pour garantir l&apos;intégration réussie du jeune dans votre équipe.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Users className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Talents pré-qualifiés</h3>
                  <p className="text-white/80 text-sm">Profils vérifiés et évalués</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <ShieldCheck className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Risque RH réduit</h3>
                  <p className="text-white/80 text-sm">Accompagnement post-recrutement</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Target className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Adapté aux PME</h3>
                  <p className="text-white/80 text-sm">Solution accessible et pragmatique</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* La valeur concrète */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8">
              La valeur concrète
            </h2>
            <ul className="space-y-4">
              {[
                "Accès à des candidats formés et validés par nos écoles partenaires",
                "Réduction du risque RH grâce au suivi post-recrutement",
                "Gain de temps : profils pré-sélectionnés selon vos critères",
                "Accompagnement personnalisé pour les PME sans département RH",
                "Contribution à l'insertion des jeunes ivoiriens — un engagement RSE concret",
                "Rapports de suivi sur l'intégration des recrues",
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-[#1B5E20] shrink-0 mt-0.5" />
                  <span className="text-base text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* L'engagement attendu */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8">
              L&apos;engagement attendu
            </h2>
            <Card className="border-l-4 border-l-[#F9A825]">
              <CardContent className="p-6 pt-6">
                <ul className="space-y-3">
                  {[
                    "Recruter au moins un jeune via le dispositif YAHNU",
                    "Participer au suivi post-recrutement (3, 6, 12 mois)",
                    "Fournir un retour constructif sur les profils reçus",
                    "Offrir un environnement d'intégration pour les jeunes recrues",
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-[#F9A825] shrink-0 mt-0.5" />
                      <span className="text-base text-muted-foreground">{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 md:py-20 bg-[#1B5E20] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-6">
              Recrutez autrement avec YAHNU
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Rejoignez les entreprises pionnières qui investissent dans les talents de demain.
            </p>
            <Button size="lg" asChild className="bg-[#F9A825] text-[#1B5E20] hover:bg-[#F9A825]/90 font-semibold">
              <Link href="/contact">
                Rejoindre le pilote
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
