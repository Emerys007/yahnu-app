
"use client";

import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { ShieldCheck, Wand2, Handshake, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

const WhyChooseYahnu = () => {
  const benefits = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />,
      title: "Accès direct à un vivier de talents pré-qualifiés",
    },
    {
      icon: <Wand2 className="h-10 w-10 text-primary mb-4" />,
      title: "Outils basés sur l'IA pour un recrutement et une création de profil efficaces",
    },
    {
      icon: <Handshake className="h-10 w-10 text-primary mb-4" />,
      title: "Liens renforcés entre le monde universitaire et l'industrie",
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary mb-4" />,
      title: "Opportunités de carrière améliorées pour les diplômés",
    },
  ];
  
  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
  };

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto">
        <motion.div 
            className="text-center mb-12"
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Pourquoi choisir Yahnu ?</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Nous offrons une solution complète pour combler le fossé entre l'éducation et l'emploi en Côte d'Ivoire.
          </p>
        </motion.div>
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
        >
          {benefits.map((benefit, index) => (
            <motion.div
              key={index}
              className="text-center p-6 bg-secondary/50 rounded-lg"
              variants={cardVariants}
              whileHover={{ scale: 1.05, y: -5, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              {benefit.icon}
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const textVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeInOut" } },
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <WhyChooseYahnu />

        <section className="py-20 relative overflow-hidden">
          <AnimatedGradientBackground />
          <motion.div 
            className="container mx-auto text-center relative z-10"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
          >
              <motion.h2 
                className="text-3xl font-bold tracking-tight sm:text-4xl"
                variants={textVariants}
              >
                Prêt à rejoindre l'élite ?
              </motion.h2>
              <motion.p 
                className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto"
                variants={{
                    ...textVariants,
                    visible: { ...textVariants.visible, transition: { ...textVariants.visible.transition, delay: 0.2 } }
                }}
              >
                  Créez votre compte aujourd'hui et débloquez un monde d'opportunités. Que vous soyez diplômé, entreprise ou école, Yahnu est votre porte d'entrée vers le succès.
              </motion.p>
              <motion.div 
                className="mt-8 flex justify-center"
                variants={{
                    ...textVariants,
                    visible: { ...textVariants.visible, transition: { ...textVariants.visible.transition, delay: 0.4 } }
                }}
              >
                  <Button size="lg" asChild>
                      <Link href="/signup">Commencez maintenant</Link>
                  </Button>
              </motion.div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
