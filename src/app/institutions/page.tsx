import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Landmark,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  BarChart3,
  FileText,
} from "lucide-react";

export default function InstitutionsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Landmark className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Institutions & Partenaires Publics
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Des données d&apos;impact vérifiables pour piloter les politiques d&apos;insertion
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
              Les institutions publiques et les bailleurs de fonds investissent dans la formation
              et l&apos;emploi des jeunes, mais manquent de données fiables pour mesurer l&apos;impact réel
              de ces investissements. Les rapports sont souvent déclaratifs, les indicateurs
              approximatifs, et la traçabilité des résultats insuffisante pour piloter efficacement
              les politiques publiques d&apos;insertion.
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
              YAHNU fournit un cadre de mesure d&apos;impact rigoureux et transparent. Nos rapports
              trimestriels sont basés sur des données vérifiables : taux d&apos;insertion réel,
              durée de maintien en emploi, satisfaction des employeurs, et retour des diplômés.
              Un partenariat avec YAHNU, c&apos;est un engagement pour la transparence.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <BarChart3 className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Données vérifiables</h3>
                  <p className="text-white/80 text-sm">Indicateurs d&apos;impact mesurés</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <FileText className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Rapports transparents</h3>
                  <p className="text-white/80 text-sm">Publications trimestrielles publiques</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Target className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Partenariat stratégique</h3>
                  <p className="text-white/80 text-sm">Conformité aux politiques publiques</p>
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
                "Des données d'insertion vérifiables et non déclaratives",
                "Des rapports trimestriels conformes aux standards internationaux",
                "Un outil de pilotage des politiques publiques d'insertion",
                "Une visibilité sur l'efficacité des formations financées",
                "Un rapport annuel transparent et public",
                "Un partenaire engagé dans la redevabilité sociale",
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
                    "Soutenir le dispositif YAHNU financièrement ou structurellement",
                    "Utiliser les données produites pour orienter les politiques",
                    "Exiger la transparence et la rigueur dans les rapports d'impact",
                    "Participer aux comités de pilotage stratégiques",
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
              Devenez partenaire stratégique de YAHNU
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Ensemble, mesurons et transformons l&apos;insertion professionnelle en Côte d&apos;Ivoire.
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
