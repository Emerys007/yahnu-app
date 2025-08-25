"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Building2, GraduationCap, Briefcase } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const heroCards = [
  {
    title: "Trouvez votre emploi de rêve",
    description: "Accédez à des milliers d'opportunités d'emploi dans toute l'Afrique francophone",
    image: "/images/hero/dream-job.jpg",
    cta: "Voir les emplois",
    href: "/jobs",
    icon: Briefcase,
    color: "from-blue-500 to-purple-600"
  },
  {
    title: "Constituez votre équipe",
    description: "Trouvez les meilleurs talents pour faire grandir votre entreprise",
    image: "/images/hero/build-a-team.jpeg", 
    cta: "Recruter maintenant",
    href: "/companies",
    icon: Users,
    color: "from-green-500 to-teal-600"
  },
  {
    title: "Partenariats industriels",
    description: "Connectez votre école avec des entreprises pour de meilleures opportunités",
    image: "/images/hero/industry-partnership.webp",
    cta: "En savoir plus",
    href: "/schools",
    icon: Building2,
    color: "from-orange-500 to-red-600"
  },
  {
    title: "Partenariats universitaires",
    description: "Établissez des liens durables entre l'éducation et l'industrie",
    image: "/images/hero/uni-partnership.jpg",
    cta: "Découvrir",
    href: "/about",
    icon: GraduationCap,
    color: "from-purple-500 to-pink-600"
  }
];

export function HeroSection() {
  const [currentCard, setCurrentCard] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentCard((prev) => (prev + 1) % heroCards.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const currentHero = heroCards[currentCard];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src={currentHero.image}
          alt={currentHero.title}
          fill
          className="object-cover transition-opacity duration-1000"
          sizes="100vw"
          priority
          quality={85}
        />
        <div className="absolute inset-0 bg-black/60" />
        <div className={cn("absolute inset-0 bg-gradient-to-br opacity-20", currentHero.color)} />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          key={currentCard}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="space-y-8"
        >
          <div className="flex justify-center mb-6">
            <div className={cn("p-4 rounded-2xl bg-gradient-to-br", currentHero.color)}>
              <currentHero.icon className="w-12 h-12 text-white" />
            </div>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-white leading-tight">
            {currentHero.title}
          </h1>

          <p className="text-xl sm:text-2xl text-gray-200 max-w-3xl mx-auto leading-relaxed">
            {currentHero.description}
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="text-lg px-8 py-4 rounded-xl">
              <Link href={currentHero.href} className="flex items-center gap-2">
                {currentHero.cta}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4 rounded-xl bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/about">
                En savoir plus
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Card Indicators */}
        <div className="flex justify-center gap-3 mt-12">
          {heroCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCard(index)}
              className={cn(
                "w-3 h-3 rounded-full transition-all duration-300",
                index === currentCard ? "bg-white scale-125" : "bg-white/50 hover:bg-white/75"
              )}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Stats Bar */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">1000+</div>
              <div className="text-sm text-gray-300">Offres d'emploi</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">500+</div>
              <div className="text-sm text-gray-300">Entreprises</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">50+</div>
              <div className="text-sm text-gray-300">Écoles partenaires</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-white">10,000+</div>
              <div className="text-sm text-gray-300">Diplômés connectés</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}