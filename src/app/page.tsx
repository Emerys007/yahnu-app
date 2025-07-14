
"use client";

import { FeaturesSection } from "@/components/landing/features-section";
import { HeroSection } from "@/components/landing/hero-section";
import { MainNav } from "@/components/landing/main-nav";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Footer } from "@/components/landing/footer";
import { useLocalization } from "@/context/localization-context";
import { ShieldCheck, Wand2, Handshake, TrendingUp } from "lucide-react";

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

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('Why Choose Yahnu?')}</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('We provide a comprehensive solution to bridge the gap between education and employment in Côte d\'Ivoire.')}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div key={index} className="text-center p-6 bg-secondary/50 rounded-lg">
              {benefit.icon}
              <h3 className="text-lg font-semibold">{benefit.title}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default function HomePage() {
  const { t } = useLocalization();
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <HeroSection />
        <FeaturesSection />
        <WhyChooseYahnu />

        <section className="py-20 bg-muted/40">
          <div className="container mx-auto text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t('Ready to Get Started?')}</h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                  {t('Join Yahnu today and take the next step in your professional journey. Whether you\'re looking for a job, hiring new talent, or seeking partnerships, we have the tools for you.')}
              </p>
              <div className="mt-8 flex justify-center">
                  <Button size="lg" asChild>
                      <Link href="/register">{t('Sign Up Now')}</Link>
                  </Button>
              </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
