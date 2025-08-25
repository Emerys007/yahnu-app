
"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Building2, GraduationCap, TrendingUp, Star, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

const features = [
  {
    icon: Users,
    title: "Pour les Diplômés",
    description: "Trouvez votre emploi de rêve et lancez votre carrière avec nos outils de recherche avancés.",
    image: "/images/features/graduates-ci.jpg",
    href: "/signup",
    cta: "Commencer maintenant",
    color: "from-blue-500 to-cyan-500"
  },
  {
    icon: Building2,
    title: "Pour les Entreprises", 
    description: "Recrutez les meilleurs talents et développez votre équipe avec notre réseau étendu.",
    image: "/images/features/companies-ci.jpg",
    href: "/companies",
    cta: "Recruter des talents",
    color: "from-green-500 to-emerald-500"
  },
  {
    icon: GraduationCap,
    title: "Pour les Écoles",
    description: "Connectez vos étudiants avec des opportunités et des entreprises partenaires.",
    image: "/images/features/universities-ci.jpg", 
    href: "/schools",
    cta: "Créer des partenariats",
    color: "from-purple-500 to-violet-500"
  }
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut"
    }
  }
};

export function FeaturesSection() {
  return (
    <section className="py-20 lg:py-32 bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={containerVariants}
          className="space-y-16"
        >
          {/* Header */}
          <motion.div variants={itemVariants} className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Star className="w-4 h-4" />
                Nos Solutions
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground">
              Une plateforme pour tous
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Que vous soyez un diplômé à la recherche d'opportunités, une entreprise en quête de talents, 
              ou une école souhaitant connecter ses étudiants au monde professionnel.
            </p>
          </motion.div>

          {/* Features Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group overflow-hidden border-0 bg-card/50 backdrop-blur-sm hover:shadow-2xl transition-all duration-300">
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={feature.image}
                    alt={feature.title}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-110"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-300" />
                  <div className={`absolute inset-0 bg-gradient-to-br opacity-20 ${feature.color}`} />
                  
                  {/* Icon */}
                  <div className="absolute top-4 left-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${feature.color} shadow-lg`}>
                      <feature.icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>

                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                  <Button 
                    asChild 
                    variant="ghost" 
                    className="group/btn p-0 h-auto font-medium text-primary hover:text-primary/80"
                  >
                    <Link href={feature.href} className="flex items-center gap-2">
                      {feature.cta}
                      <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </motion.div>

          {/* Call to Action */}
          <motion.div variants={itemVariants} className="text-center space-y-6 pt-8">
            <h3 className="text-2xl sm:text-3xl font-bold text-foreground">
              Prêt à transformer votre avenir professionnel ?
            </h3>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Rejoignez des milliers de professionnels qui font confiance à Yahnu pour leurs opportunités de carrière.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="text-lg px-8 py-4">
                <Link href="/signup" className="flex items-center gap-2">
                  Commencer gratuitement
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-4">
                <Link href="/about">
                  En savoir plus
                </Link>
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
