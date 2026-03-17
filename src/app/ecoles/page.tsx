import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  School,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  TrendingUp,
  BarChart3,
} from "lucide-react";

export default function EcolesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <School className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Écoles & Universités
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Transformez votre career center en moteur d&apos;insertion professionnelle
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
              Les écoles et universités ivoiriennes forment chaque année des milliers de diplômés,
              mais le taux d&apos;insertion reste faible. Les career centers sont souvent sous-équipés,
              sans méthodologie de suivi, et sans lien structuré avec les entreprises. Le résultat :
              la réputation de l&apos;école souffre, et les diplômés sont livrés à eux-mêmes.
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
              YAHNU opère votre career center comme un service externalisé. Nous mettons en place
              la plateforme technologique, la méthodologie de matching, le suivi post-diplôme,
              et la production de rapports d&apos;insertion. Votre école se concentre sur la formation,
              nous nous occupons de l&apos;insertion.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Target className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Career Center as a Service</h3>
                  <p className="text-white/80 text-sm">Opération externalisée complète</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <BarChart3 className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Résultats mesurables</h3>
                  <p className="text-white/80 text-sm">Rapports trimestriels d&apos;insertion</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <TrendingUp className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Réputation renforcée</h3>
                  <p className="text-white/80 text-sm">Amélioration du taux d&apos;insertion</p>
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
                "Un career center opérationnel sans investissement lourd",
                "Des données d'insertion vérifiables pour vos accréditations",
                "Un réseau d'entreprises partenaires prêtes à recruter vos diplômés",
                "Un suivi individuel de chaque diplômé pendant 12 mois",
                "Des rapports trimestriels à présenter à vos conseils d'administration",
                "Une amélioration mesurable de votre taux d'insertion",
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
                    "Désigner un référent insertion au sein de l'école",
                    "Partager les données de sortie de promotion",
                    "Faciliter l'accès de YAHNU aux étudiants finissants",
                    "Participer aux comités de pilotage trimestriels",
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
              Intégrez le pilote YAHNU 2026
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Rejoignez les premières écoles partenaires et transformez l&apos;avenir de vos diplômés.
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
