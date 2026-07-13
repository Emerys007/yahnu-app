"use client";

import { Building2, GraduationCap, Handshake, Sparkles, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { FeaturesSection } from "@/components/landing/features-section";
import { FeaturedOpportunities } from "@/components/landing/featured-opportunities";
import { Footer } from "@/components/landing/footer";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { useLocalization } from "@/context/localization-context";

export default function HomePage() {
  const { language } = useLocalization();
  const locale = language === "fr" ? "fr" : "en";
  const content = locale === "fr"
    ? { eyebrow: "Un réseau, un progrès partagé", title: "Là où l’ambition trouve une voie claire.", body: "Yahnu rassemble les informations, les relations et les outils nécessaires pour faire de chaque prochaine étape une décision plus confiante.", cards: [["Pour les diplômés", "Transformez vos compétences et votre expérience en un profil qui ouvre des portes.", GraduationCap], ["Pour les employeurs", "Rencontrez des talents prêts à contribuer et à évoluer avec votre équipe.", Building2], ["Pour les établissements", "Restez connectés à ce que le marché recherche et accompagnez mieux vos diplômés.", Handshake]] }
    : { eyebrow: "One network, shared progress", title: "Where ambition gets a clearer path forward.", body: "Yahnu brings the insight, relationships, and tools together to make every next step a more confident decision.", cards: [["For graduates", "Turn your skills and experience into a profile that opens doors.", GraduationCap], ["For employers", "Meet talent ready to contribute and grow alongside your team.", Building2], ["For institutions", "Stay close to what the market needs and better support your graduates.", Handshake]] };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />
        <section className="overflow-hidden bg-slate-950 py-20 text-white sm:py-24">
          <div className="container mx-auto">
            <div className="max-w-2xl"><p className="inline-flex items-center gap-2 text-sm font-semibold text-primary"><Sparkles className="h-4 w-4" />{content.eyebrow}</p><h2 className="mt-3 text-3xl font-bold tracking-[-0.04em] sm:text-4xl">{content.title}</h2><p className="mt-4 text-lg leading-8 text-slate-300">{content.body}</p></div>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {content.cards.map(([title, body, Icon], index) => {
                const CardIcon = Icon as typeof GraduationCap;
                return <motion.div key={title as string} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ delay: index * 0.08 }} className="rounded-3xl border border-white/10 bg-white/[0.06] p-6"><span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"><CardIcon className="h-5 w-5" /></span><h3 className="mt-6 text-lg font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-300">{body as string}</p><TrendingUp className="mt-6 h-4 w-4 text-primary" /></motion.div>;
              })}
            </div>
          </div>
        </section>
        <FeaturesSection />
        <FeaturedOpportunities />
      </main>
      <Footer />
    </div>
  );
}
