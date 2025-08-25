"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Building, School } from "lucide-react"
import { cn } from "@/lib/utils"
import { AnimatedGradientBackground } from "../ui/animated-gradient-background"
import { Button } from "@/components/ui/button"

const getFeaturesData = () => ({
  graduates: {
    title: "Pour les Diplômés",
    icon: <GraduationCap className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/hero/uni-partnership.jpg",
    imageHint: "african graduate students",
    items: [
      {
        title: "Créateur de Profil IA",
        description: "Générez un profil professionnel et un CV qui se démarquent en quelques minutes.",
        action: "Commencer",
      },
      {
        title: "Correspondance d'Emploi Intelligente",
        description: "Recevez des recommandations d'emploi personnalisées en fonction de vos compétences et de vos aspirations.",
        action: "Trouver un Emploi",
      },
      {
        title: "Développement des Compétences",
        description: "Accédez à des évaluations pour valider vos compétences et gagner des badges pour votre profil.",
        action: "Explorer les Compétences",
      },
    ],
  },
  companies: {
    title: "Pour les Entreprises",
    icon: <Building className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/IndustryPartnership.jpeg",
    imageHint: "recruitment dashboard",
    items: [
      {
        title: "Sourcing de Talents Efficace",
        description: "Accédez à un vivier de diplômés qualifiés issus des meilleures universités.",
        action: "Trouver des Talents",
      },
      {
        title: "Recrutement Simplifié",
        description: "Utilisez des outils IA pour filtrer les candidats et gérer votre pipeline de recrutement.",
        action: "Recruter Facilement",
      },
      {
        title: "Aperçus Basés sur les Données",
        description: "Suivez vos métriques de recrutement et comprenez les tendances du marché des talents.",
        action: "Obtenir des Aperçus",
      },
    ],
  },
  schools: {
    title: "Pour les Écoles",
    icon: <School className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/University.png",
    imageHint: "academic analytics",
    items: [
      {
        title: "Liens avec l'Industrie",
        description: "Établissez des partenariats avec des entreprises de premier plan pour des stages et des opportunités d'emploi.",
        action: "Se Connecter",
      },
      {
        title: "Améliorez l'Employabilité des Diplômés",
        description: "Suivez le succès de vos anciens élèves et obtenez des informations pour améliorer vos programmes.",
        action: "Améliorer les Programmes",
      },
      {
        title: "Mettez en Valeur Votre Institution",
        description: "Présentez vos programmes et vos réussites à un public plus large.",
        action: "Mettre en Avant",
      },
    ],
  },
});

function FeatureCard({ feature }: { feature: { title: string; description: string; action: string } }) {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.5 });

    const variants = {
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 },
    };

    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        variants={variants}
        transition={{ duration: 0.5 }}
      >
        <Card className="h-full border-none shadow-premium hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 bg-card/80 backdrop-blur-sm">
          <CardContent className="p-8">
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="h-56 w-full relative overflow-hidden rounded-xl mb-6 group">
                <Image
                  src={feature.image}
                  alt={feature.title}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent group-hover:from-black/30 transition-all duration-300"></div>
              </div>
              <h3 className="text-2xl font-display font-bold mb-3 text-foreground">{feature.title}</h3>
              <p className="text-muted-foreground text-base leading-relaxed max-w-sm">
                {feature.description}
              </p>
              <Button className="mt-6 font-semibold" variant="outline" size="lg">
                {feature.action}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

const AnimatedTabs = () => {
  const [activeTab, setActiveTab] = React.useState("graduates");
  const featuresData = getFeaturesData();

  const tabs = [
    { id: 'graduates', label: "Pour les Diplômés", icon: GraduationCap },
    { id: 'companies', label: "Pour les Entreprises", icon: Building },
    { id: 'schools', label: "Pour les Écoles", icon: School },
  ];

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: { opacity: 1, scale: 1 },
  };

  return (
    <div className="w-full">
      <div className="flex justify-center mb-12">
        {/* Desktop Tabs */}
        <div className="hidden sm:flex relative w-full max-w-lg items-center justify-center rounded-lg border bg-background/50 p-1">
            {tabs.map((tab) => (
                <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                    "relative z-10 flex-1 rounded-md px-4 py-2.5 text-md font-medium transition-colors duration-300",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-muted",
                    activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                )}
                >
                <div className="flex items-center justify-center gap-2">
                    <tab.icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                </div>
                </button>
            ))}
            <motion.div
                layoutId="active-features-tab-highlight"
                className="absolute inset-0 z-0 h-full p-1"
                style={{
                    width: `${100 / tabs.length}%`,
                    left: `${tabs.findIndex(t => t.id === activeTab) * (100 / tabs.length)}%`,
                }}
                transition={{ type: "spring", bounce: 0.25, duration: 0.5 }}
            >
                <div className="h-full w-full rounded-md bg-primary shadow-md" />
            </motion.div>
        </div>
        {/* Mobile Tabs */}
        <div className="sm:hidden flex flex-col w-full gap-2">
            {tabs.map((tab) => (
                 <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                        "relative w-full rounded-lg px-4 py-3 text-md font-medium transition-colors duration-300 border",
                        activeTab === tab.id ? "bg-primary text-primary-foreground border-transparent" : "bg-background/50 text-muted-foreground hover:bg-muted/80"
                    )}
                    >
                    <div className="flex items-center justify-center gap-2">
                        <tab.icon className="h-5 w-5" />
                        <span>{tab.label}</span>
                    </div>
                </button>
            ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
        >
          {Object.entries(featuresData).map(([key, data]) =>
            key === activeTab ? (
              <div key={key}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <motion.div
                    key={`${activeTab}-image`}
                    initial="hidden"
                    animate="visible"
                    variants={imageVariants}
                    transition={{ duration: 0.5, ease: "easeInOut" }}
                    className="relative w-full h-80 lg:h-96 rounded-2xl overflow-hidden shadow-2xl"
                  >
                    <Image
                      src={data.image}
                      alt={`${data.title} features`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      className="object-cover"
                      data-ai-hint={data.imageHint}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </motion.div>
                  <div className="space-y-6">
                    {data.items.map((feature, index) => (
                      <FeatureCard key={index} feature={feature} />
                    ))}
                  </div>
                </div>
              </div>
            ) : null
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};


export function FeaturesSection() {
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section className="py-20 lg:py-32 bg-gradient-to-b from-background via-muted/20 to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      <div className="container px-4 md:px-6 relative">
        <motion.div
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
        >
          <h2 className="text-4xl font-display font-bold tracking-tight sm:text-5xl md:text-6xl mb-6 bg-gradient-to-r from-primary via-primary/80 to-primary bg-clip-text text-transparent">
            {localize('Votre passerelle vers l\'emploi en Afrique')}
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            Que vous soyez un jeune diplômé, une entreprise en croissance ou une institution académique de premier plan, Yahnu est conçu pour vous.
          </p>
        </motion.div>

        <AnimatedTabs />

      </div>
    </section>
  );
}