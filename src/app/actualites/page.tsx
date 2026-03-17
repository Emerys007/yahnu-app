import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Card, CardContent } from "@/components/ui/card";
import { Newspaper } from "lucide-react";

export default function ActualitesPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Newspaper className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Actualités & Ressources
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Suivez les dernières nouvelles du dispositif YAHNU
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl text-center">
            <Card className="border-l-4 border-l-[#F9A825]">
              <CardContent className="p-8">
                <h2 className="text-xl font-bold text-[#1B5E20] mb-4">
                  Bientôt disponible
                </h2>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Cette section sera alimentée au fur et à mesure du lancement de la phase pilote 2026.
                  Revenez bientôt pour découvrir nos publications, études de cas, et ressources
                  pour les acteurs de l&apos;insertion professionnelle en Côte d&apos;Ivoire.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
