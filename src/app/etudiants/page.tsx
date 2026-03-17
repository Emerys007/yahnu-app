import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  GraduationCap,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Target,
  Compass,
  UserCheck,
} from "lucide-react";

export default function EtudiantsPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <GraduationCap className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Étudiants & Jeunes Diplômés
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Prenez votre trajectoire en main — YAHNU vous accompagne vers l&apos;emploi
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
              Vous avez un diplôme, mais pas de réseau. Vous envoyez des CV, mais personne ne répond.
              Vous ne savez pas ce que les entreprises attendent vraiment. Le marché semble fermé,
              et vous avez l&apos;impression que votre formation ne vous a pas préparé à cette réalité.
              Vous n&apos;êtes pas seul — et ce n&apos;est pas une fatalité.
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
              YAHNU vous met en relation directe avec des entreprises qui cherchent des profils comme
              le vôtre. Nous vous accompagnons individuellement : préparation aux entretiens,
              construction de votre profil professionnel, et suivi après votre recrutement
              pour garantir votre intégration réussie.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Compass className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Accompagnement personnalisé</h3>
                  <p className="text-white/80 text-sm">Un parcours adapté à votre profil</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <Target className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Mise en relation directe</h3>
                  <p className="text-white/80 text-sm">Accès aux entreprises partenaires</p>
                </CardContent>
              </Card>
              <Card className="bg-[#1B5E20] text-white border-none">
                <CardContent className="p-6 pt-6 text-center">
                  <UserCheck className="h-8 w-8 text-[#F9A825] mx-auto mb-3" />
                  <h3 className="font-bold mb-2">Suivi individuel</h3>
                  <p className="text-white/80 text-sm">Avant, pendant et après le recrutement</p>
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
                "Un profil professionnel construit avec l'aide d'experts",
                "Des offres d'emploi ciblées correspondant à votre formation",
                "Une préparation concrète aux entretiens d'embauche",
                "Un accès direct aux entreprises partenaires de YAHNU",
                "Un suivi personnalisé pendant vos 12 premiers mois en poste",
                "Des outils pratiques pour développer vos compétences marché",
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
                    "Compléter votre profil professionnel de manière honnête et complète",
                    "Participer activement aux sessions de préparation",
                    "Honorer les entretiens et engagements pris avec les entreprises",
                    "Contribuer au suivi post-recrutement pour améliorer le dispositif",
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
              Soyez acteur de votre avenir
            </h2>
            <p className="text-white/90 text-base sm:text-lg max-w-2xl mx-auto mb-8">
              Inscrivez-vous au pilote YAHNU 2026 et accédez à un accompagnement concret vers l&apos;emploi.
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
