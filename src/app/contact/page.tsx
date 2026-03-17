"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Mail,
  Phone,
  MapPin,
  Send,
} from "lucide-react";

export default function ContactPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative bg-[#1B5E20] text-white py-16 md:py-24">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] opacity-90" />
          <div className="container mx-auto px-4 relative z-10 text-center">
            <Send className="h-12 w-12 text-[#F9A825] mx-auto mb-4" />
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight mb-4">
              Rejoindre le pilote YAHNU
            </h1>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl mx-auto">
              Contactez-nous pour intégrer le dispositif YAHNU 2026
            </p>
          </div>
        </section>

        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
              {/* Contact Info */}
              <div>
                <h2 className="text-2xl font-bold text-[#1B5E20] mb-8">
                  Nos coordonnées
                </h2>
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <Mail className="h-6 w-6 text-[#F9A825] shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-[#1B5E20]">Email</p>
                      <p className="text-muted-foreground">contact@yahnu.org</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <Phone className="h-6 w-6 text-[#F9A825] shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-[#1B5E20]">Téléphone</p>
                      <p className="text-muted-foreground">+225 0102030405</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-4">
                    <MapPin className="h-6 w-6 text-[#F9A825] shrink-0 mt-1" />
                    <div>
                      <p className="font-medium text-[#1B5E20]">Localisation</p>
                      <p className="text-muted-foreground">Abidjan, Côte d&apos;Ivoire</p>
                    </div>
                  </div>
                </div>

                <div className="mt-10">
                  <h3 className="text-lg font-bold text-[#1B5E20] mb-4">
                    Qui peut rejoindre le pilote ?
                  </h3>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-[#F9A825] font-bold">•</span>
                      <span>Écoles et universités souhaitant externaliser leur career center</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F9A825] font-bold">•</span>
                      <span>PME et entreprises prêtes à recruter des jeunes talents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F9A825] font-bold">•</span>
                      <span>Jeunes diplômés en recherche d&apos;emploi</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#F9A825] font-bold">•</span>
                      <span>Institutions publiques et bailleurs intéressés par l&apos;impact</span>
                    </li>
                  </ul>
                </div>
              </div>

              {/* Contact Form */}
              <Card className="border-t-4 border-t-[#1B5E20]">
                <CardContent className="p-6 pt-6">
                  <h2 className="text-2xl font-bold text-[#1B5E20] mb-6">
                    Formulaire de contact
                  </h2>
                  <form className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="prenom">Prénom</Label>
                        <Input id="prenom" placeholder="Votre prénom" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="nom">Nom</Label>
                        <Input id="nom" placeholder="Votre nom" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" placeholder="votre@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="organisation">Organisation</Label>
                      <Input id="organisation" placeholder="Nom de votre école, entreprise ou institution" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="profil">Vous êtes</Label>
                      <select
                        id="profil"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        <option value="">Sélectionnez votre profil</option>
                        <option value="ecole">Une école / université</option>
                        <option value="entreprise">Une entreprise / PME</option>
                        <option value="etudiant">Un étudiant / jeune diplômé</option>
                        <option value="institution">Une institution / bailleur</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Décrivez votre intérêt pour le dispositif YAHNU..."
                        rows={4}
                      />
                    </div>
                    <Button type="submit" className="w-full bg-[#1B5E20] hover:bg-[#1B5E20]/90 font-semibold">
                      <Send className="mr-2 h-4 w-4" />
                      Envoyer
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
