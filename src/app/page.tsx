
"use client";

import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { useLocalization } from "@/context/localization-context";
import { ShieldCheck, Wand2, Handshake, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { AnimatedGradientBackground } from "@/components/ui/animated-gradient-background";

const WhyChooseYahnu = () => {
  const { t } = useLocalization();

  const benefits = [
    {
      icon: <ShieldCheck className="h-10 w-10 text-primary mb-4" />,
      title: t('Direct access to a pre-vetted talent pool'),
    },
    {
      icon: <Wand2 className="h-10 w-10 text-primary mb-4" />,
      title: t('AI-driven tools for efficient recruitment and profile building'),
    },
    {
      icon: <Handshake className="h-10 w-10 text-primary mb-4" />,
      title: t('Strengthened ties between academia and industry'),
    },
    {
      icon: <TrendingUp className="h-10 w-10 text-primary mb-4" />,
      title: t('Enhanced career opportunities for graduates'),
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
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('Why Choose Yahnu?')}</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('We provide a comprehensive solution to bridge the gap between education and employment in {country}.')}
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
  const { t } = useLocalization();

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
                {t('Ready to Join the Elite?')}
              </motion.h2>
              <motion.p 
                className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto"
                variants={{
                    ...textVariants,
                    visible: { ...textVariants.visible, transition: { ...textVariants.visible.transition, delay: 0.2 } }
                }}
              >
                  {t("Create your account today and unlock a world of opportunities. Whether you're a graduate, a company, or a school, Yahnu is your gateway to success.")}
              </motion.p>
              <motion.div 
                className="mt-8 flex justify-center"
                variants={{
                    ...textVariants,
                    visible: { ...textVariants.visible, transition: { ...textVariants.visible.transition, delay: 0.4 } }
                }}
              >
                  <Button size="lg" asChild>
                      <Link href="/register">{t('Get Started Now')}</Link>
                  </Button>
              </motion.div>
          </motion.div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
