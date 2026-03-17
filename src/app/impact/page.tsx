import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent } from "@/components/ui/card";
import {
  Users,
  Building,
  School,
  TrendingUp,
  BarChart3,
  Calendar,
  Info,
} from "lucide-react";

export default function ImpactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <BarChart3 className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              L&apos;Impact YAHNU
            </h1>
            <p className="text-lg sm:text-xl text-[#F9A825] font-semibold">
              Piloté par la mesure
            </p>
          </div>
        </section>

        {/* Intro */}
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              YAHNU ne fait pas de promesses — YAHNU mesure. Voici nos objectifs 2026 et notre méthode.
            </p>
          </div>
        </section>

        {/* KPI Section */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <Users className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">500+</p>
                  <p className="text-white/90 text-base font-medium">
                    Étudiants accompagnés
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <Building className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">50+</p>
                  <p className="text-white/90 text-base font-medium">
                    Entreprises partenaires
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <School className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">30+</p>
                  <p className="text-white/90 text-base font-medium">
                    Écoles intégrées
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <TrendingUp className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">70%</p>
                  <p className="text-white/90 text-base font-medium">
                    Taux d&apos;insertion cible
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Méthodologie de mesure */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8 flex items-center gap-3">
              <BarChart3 className="h-8 w-8 text-[#F9A825]" />
              Méthodologie de mesure
            </h2>
            <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              <p>
                Notre méthodologie repose sur le suivi individuel de chaque étudiant accompagné.
                Nous mesurons le taux d&apos;insertion à 3, 6 et 12 mois après la fin de
                l&apos;accompagnement. Chaque donnée est vérifiée auprès de l&apos;entreprise
                recruteuse et du jeune concerné.
              </p>
              <p>
                Les indicateurs clés incluent : le taux d&apos;insertion effective, la durée moyenne
                de maintien en emploi, la satisfaction employeur, la satisfaction du jeune recruté,
                et le nombre de formations complémentaires suivies.
              </p>
            </div>
          </div>
        </section>

        {/* Fréquence des rapports */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1B5E20] mb-8 flex items-center gap-3">
              <Calendar className="h-8 w-8 text-[#F9A825]" />
              Fréquence des rapports
            </h2>
            <Card className="border-l-4 border-l-[#1B5E20]">
              <CardContent className="p-6 pt-6">
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
                  <strong className="text-[#1B5E20]">Rapports trimestriels publics</strong> —
                  Chaque trimestre, YAHNU publie un rapport d&apos;avancement incluant les indicateurs
                  d&apos;insertion, les retours des parties prenantes, et les ajustements méthodologiques.
                  Ces rapports sont accessibles à tous les partenaires et au public.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Notice */}
        <section className="py-12 md:py-16 bg-[#1B5E20] text-white">
          <div className="container mx-auto px-4 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Info className="h-6 w-6 text-[#F9A825]" />
              <p className="text-base sm:text-lg font-medium">
                Phase pilote 2026
              </p>
            </div>
            <p className="text-white/80 text-base max-w-2xl mx-auto">
              Les données seront mises à jour régulièrement au fur et à mesure de l&apos;avancement
              de la phase pilote.
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
