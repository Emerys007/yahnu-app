import Link from "next/link";
import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  School,
  Building,
  GraduationCap,
  Landmark,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function BeTheChangePage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative bg-[#1B5E20] text-white py-20 md:py-28">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight mb-4">
              BE THE CHANGE
            </h1>
            <p className="text-xl sm:text-2xl md:text-3xl text-[#F9A825] font-semibold">
              Soyons le changement
            </p>
          </div>
        </section>

        {/* Le sens profond */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1B5E20] mb-8">
              Pourquoi YAHNU existe
            </h2>
            <div className="space-y-6 text-base md:text-lg text-muted-foreground leading-relaxed">
              <p>
                En Côte d&apos;Ivoire et en Afrique francophone, des milliers de jeunes diplômés sortent
                chaque année du système éducatif sans perspective concrète d&apos;insertion professionnelle.
                Les écoles forment sans lien direct avec le marché. Les entreprises recrutent sans
                visibilité sur les compétences réelles. Les institutions pilotent sans données fiables.
              </p>
              <p>
                YAHNU est né de ce constat : <strong className="text-[#1B5E20]">le système ne peut changer que si chaque acteur
                accepte sa part de responsabilité.</strong> Pas une promesse. Un engagement mesurable.
              </p>
              <p>
                &quot;BE THE CHANGE&quot; n&apos;est pas un slogan. C&apos;est un appel à l&apos;action collective.
                Chaque école, chaque entreprise, chaque jeune, chaque institution détient une clé
                de la transformation. YAHNU fournit le cadre, la méthode et la mesure.
              </p>
            </div>
          </div>
        </section>

        {/* Avant / Après YAHNU */}
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-[#1B5E20] mb-12">
              Avant / Après YAHNU
            </h2>
            <div className="max-w-4xl mx-auto overflow-x-auto">
              <table className="w-full border-collapse text-base">
                <thead>
                  <tr>
                    <th className="text-left p-4 bg-gray-200 font-bold text-[#1B5E20] rounded-tl-lg">Dimension</th>
                    <th className="text-left p-4 bg-gray-200 font-bold text-red-700">Avant YAHNU</th>
                    <th className="text-left p-4 bg-gray-200 font-bold text-[#1B5E20] rounded-tr-lg">Avec YAHNU</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  <tr>
                    <td className="p-4 font-medium">Formation</td>
                    <td className="p-4 text-muted-foreground">Déconnectée du marché</td>
                    <td className="p-4 text-[#1B5E20] font-medium">Alignée sur les besoins réels des entreprises</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Insertion</td>
                    <td className="p-4 text-muted-foreground">Non mesurée, non suivie</td>
                    <td className="p-4 text-[#1B5E20] font-medium">Suivie avec indicateurs trimestriels</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Recrutement</td>
                    <td className="p-4 text-muted-foreground">Risqué, sans pré-qualification</td>
                    <td className="p-4 text-[#1B5E20] font-medium">Matching précis + suivi post-recrutement</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Jeunes</td>
                    <td className="p-4 text-muted-foreground">Passifs, en attente</td>
                    <td className="p-4 text-[#1B5E20] font-medium">Acteurs de leur trajectoire professionnelle</td>
                  </tr>
                  <tr>
                    <td className="p-4 font-medium">Données d&apos;impact</td>
                    <td className="p-4 text-muted-foreground">Inexistantes ou déclaratives</td>
                    <td className="p-4 text-[#1B5E20] font-medium">Vérifiables, publiées trimestriellement</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Responsabilité partagée */}
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-[#1B5E20] mb-12">
              Responsabilité partagée
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <School className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-3">Les Écoles</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Ouvrir un career center opéré par YAHNU</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Partager les données d&apos;insertion</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Adapter les programmes aux besoins du marché</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <Building className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-3">Les Entreprises</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Recruter via le dispositif YAHNU</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />S&apos;engager dans le suivi post-recrutement</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Offrir des stages et premières expériences</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <GraduationCap className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-3">Les Jeunes</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Compléter leur profil professionnel</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Se former activement aux compétences du marché</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Honorer les engagements pris avec les entreprises</li>
                  </ul>
                </CardContent>
              </Card>
              <Card className="border-t-4 border-t-[#F9A825]">
                <CardContent className="p-6 pt-6">
                  <Landmark className="h-8 w-8 text-[#1B5E20] mb-3" />
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-3">Les Institutions</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Soutenir financièrement et structurellement</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Utiliser les données pour piloter les politiques</li>
                    <li className="flex gap-2"><CheckCircle2 className="h-4 w-4 text-[#1B5E20] shrink-0 mt-0.5" />Exiger la transparence des résultats</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Engagements publics de YAHNU */}
        <section className="py-16 md:py-24 bg-[#1B5E20] text-white">
          <div className="container mx-auto px-4 max-w-4xl">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center mb-12">
              Les engagements publics de YAHNU
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                "Publier des rapports d'impact trimestriels vérifiables",
                "Ne jamais falsifier les données d'insertion",
                "Agir en tiers de confiance entre tous les acteurs",
                "Mettre la technologie au service de l'humain, pas l'inverse",
                "Rendre des comptes publiquement sur chaque phase pilote",
                "Adapter le dispositif en continu selon les résultats mesurés",
              ].map((engagement, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-[#F9A825] shrink-0 mt-0.5" />
                  <p className="text-white/90 text-base leading-relaxed">{engagement}</p>
                </div>
              ))}
            </div>
            <div className="text-center mt-12">
              <Button size="lg" asChild className="bg-[#F9A825] text-[#1B5E20] hover:bg-[#F9A825]/90 font-semibold">
                <Link href="/contact">
                  Rejoindre le mouvement
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
