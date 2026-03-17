
"use client";

import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  Building,
  School,
  Landmark,
  AlertTriangle,
  Users,
  Briefcase,
  Target,
  HandshakeIcon,
  BarChart3,
  TrendingUp,
  ArrowRight,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Section 1 — Hero */}
        <section className="relative bg-[#1B5E20] text-white py-20 md:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight leading-tight mb-6">
              BE THE CHANGE
              <span className="block text-[#F9A825] mt-2 text-xl sm:text-2xl md:text-3xl font-semibold">
                Transformer la formation en insertion mesurée
              </span>
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-3xl mx-auto mb-10 leading-relaxed">
              YAHNU est un dispositif de responsabilité partagée entre les écoles, les entreprises,
              les jeunes et les institutions pour transformer la formation en emploi réel.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <Button size="lg" asChild className="bg-[#F9A825] text-[#1B5E20] hover:bg-[#F9A825]/90 font-semibold">
                <Link href="/ecoles">
                  <School className="mr-2 h-5 w-5" />
                  Écoles
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-white text-[#1B5E20] hover:bg-white/90 font-semibold">
                <Link href="/entreprises">
                  <Building className="mr-2 h-5 w-5" />
                  Entreprises
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-[#F9A825] text-[#1B5E20] hover:bg-[#F9A825]/90 font-semibold">
                <Link href="/etudiants">
                  <GraduationCap className="mr-2 h-5 w-5" />
                  Étudiants
                </Link>
              </Button>
              <Button size="lg" asChild className="bg-white text-[#1B5E20] hover:bg-white/90 font-semibold">
                <Link href="/institutions">
                  <Landmark className="mr-2 h-5 w-5" />
                  Institutions
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Section 2 — Le Problème */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-[#1B5E20]">
              Le défi que nous relevons ensemble
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <AlertTriangle className="h-8 w-8 text-[#F9A825] shrink-0" />
                    <h3 className="text-xl font-bold text-[#1B5E20]">Formation ≠ Emploi</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Les diplômés sortent sans être prêts pour le marché.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-8 w-8 text-[#F9A825] shrink-0" />
                    <h3 className="text-xl font-bold text-[#1B5E20]">Chômage des diplômés</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Des milliers de jeunes qualifiés restent sans insertion.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Briefcase className="h-8 w-8 text-[#F9A825] shrink-0" />
                    <h3 className="text-xl font-bold text-[#1B5E20]">Recrutement risqué</h3>
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed">
                    Les PME peinent à trouver des talents fiables et formés.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 3 — La Réponse YAHNU */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 text-[#1B5E20]">
              YAHNU : Un dispositif, une promesse, une méthode
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mt-12">
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6">
                  <Target className="h-10 w-10 text-[#F9A825] mb-4" />
                  <h3 className="text-xl font-bold mb-3">Career Center as a Service</h3>
                  <p className="text-white/85 text-base leading-relaxed">
                    Nous opérons le career center de votre école.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6">
                  <HandshakeIcon className="h-10 w-10 text-[#F9A825] mb-4" />
                  <h3 className="text-xl font-bold mb-3">Matching + Suivi</h3>
                  <p className="text-white/85 text-base leading-relaxed">
                    Mise en relation précise entre jeunes et entreprises, avec suivi post-recrutement.
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6">
                  <BarChart3 className="h-10 w-10 text-[#F9A825] mb-4" />
                  <h3 className="text-xl font-bold mb-3">Responsabilité partagée</h3>
                  <p className="text-white/85 text-base leading-relaxed">
                    Chaque acteur s&apos;engage avec des indicateurs mesurables.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 4 — BE THE CHANGE expliqué */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-4 text-[#1B5E20]">
              BE THE CHANGE
            </h2>
            <p className="text-center text-lg text-muted-foreground mb-12">
              4 responsabilités, 1 transformation
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-l-4 border-l-[#1B5E20]">
                <CardContent className="p-6 pt-6">
                  <School className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-2">Les Écoles</h3>
                  <p className="text-muted-foreground text-base">
                    Former pour l&apos;emploi, pas seulement pour le diplôme.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#1B5E20]">
                <CardContent className="p-6 pt-6">
                  <Building className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-2">Les Entreprises</h3>
                  <p className="text-muted-foreground text-base">
                    Recruter des jeunes, les former, les retenir.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#1B5E20]">
                <CardContent className="p-6 pt-6">
                  <GraduationCap className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-2">Les Jeunes</h3>
                  <p className="text-muted-foreground text-base">
                    Prendre leur trajectoire en main, être acteurs du changement.
                  </p>
                </CardContent>
              </Card>
              <Card className="border-l-4 border-l-[#1B5E20]">
                <CardContent className="p-6 pt-6">
                  <Landmark className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-2">Les Institutions</h3>
                  <p className="text-muted-foreground text-base">
                    Soutenir, mesurer, et rendre compte de l&apos;impact social.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Section 5 — Impact Attendu */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12 text-[#1B5E20]">
              Des objectifs mesurables pour 2026
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <Users className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">500+</p>
                  <p className="text-white/90 text-base font-medium">
                    Étudiants accompagnés
                  </p>
                  <p className="text-white/60 text-sm mt-1">(phase pilote)</p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <Building className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">50+</p>
                  <p className="text-white/90 text-base font-medium">
                    Entreprises partenaires engagées
                  </p>
                </CardContent>
              </Card>
              <Card className="text-center bg-[#1B5E20] text-white border-none">
                <CardContent className="p-8">
                  <School className="h-10 w-10 text-[#F9A825] mx-auto mb-4" />
                  <p className="text-4xl md:text-5xl font-bold text-[#F9A825] mb-2">30+</p>
                  <p className="text-white/90 text-base font-medium">
                    Écoles intégrées au dispositif
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
            <p className="text-center text-sm text-muted-foreground mt-8 italic">
              *Projections phase pilote 2026 – résultats à venir
            </p>
          </div>
        </section>

        {/* Section 6 — Appel à engagement */}
        <section className="py-16 md:py-24 bg-[#1B5E20] text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6">
              Rejoignez le pilote YAHNU 2026
            </h2>
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto mb-10 leading-relaxed">
              Que vous soyez une école, une entreprise, un jeune diplômé ou une institution,
              votre engagement compte. Soyons le changement ensemble.
            </p>
            <Button size="lg" asChild className="bg-[#F9A825] text-[#1B5E20] hover:bg-[#F9A825]/90 font-semibold text-lg px-8">
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
