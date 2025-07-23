
"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useInView } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GraduationCap, Briefcase, Building } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { cn } from "@/lib/utils"

const getFeaturesData = (t: (key: string) => string) => ({
    graduates: {
      title: t('features.graduates.title'),
      icon: <GraduationCap className="h-8 w-8 mb-4 text-primary" />,
      image: "/images/features/graduates-ci.jpg",
      imageHint: "A group of diverse, smiling graduates",
      items: [
        {
          title: t('features.graduates.item1.title'),
          description: t('features.graduates.item1.description'),
        },
        {
          title: t('features.graduates.item2.title'),
          description: t('features.graduates.item2.description'),
        },
        {
          title: t('features.graduates.item3.title'),
          description: t('features.graduates.item3.description'),
        },
      ],
    },
    companies: {
      title: t('features.companies.title'),
      icon: <Briefcase className="h-8 w-8 mb-4 text-primary" />,
      image: "/images/features/companies-ci.jpg",
      imageHint: "A professional team collaborating in a modern office",
      items: [
        {
          title: t('features.companies.item1.title'),
          description: t('features.companies.item1.description'),
        },
        {
          title: t('features.companies.item2.title'),
          description: t('features.companies.item2.description'),
        },
        {
          title: t('features.companies.item3.title'),
          description: t('features.companies.item3.description'),
        },
      ],
    },
    schools: {
      title: t('features.schools.title'),
      icon: <Building className="h-8 w-8 mb-4 text-primary" />,
      image: "/images/features/universities-ci.jpg",
      imageHint: "A modern university campus with students walking",
      items: [
        {
          title: t('features.schools.item1.title'),
          description: t('features.schools.item1.description'),
        },
        {
          title: t('features.schools.item2.title'),
          description: t('features.schools.item2.description'),
        },
        {
          title: t('features.schools.item3.title'),
          description: t('features.schools.item3.description'),
        },
      ],
    },
  });

function FeatureCard({ feature }: { feature: { title: string; description: string } }) {
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
        <Card className="h-full bg-background/80 backdrop-blur-sm border-border/50 shadow-lg hover:shadow-xl transition-shadow duration-300">
          <CardHeader>
            <CardTitle>{feature.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">{feature.description}</p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

export function FeaturesSection() {
    const { t } = useLocalization();
    const [activeTab, setActiveTab] = React.useState("graduates");
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

    const featuresData = getFeaturesData(t);
  
    const imageVariants = {
      hidden: { opacity: 0, scale: 0.95 },
      visible: { opacity: 1, scale: 1 },
    };
    
    const tabs = [
        { id: "graduates", label: t("common.graduates"), icon: GraduationCap },
        { id: "companies", label: t("common.companies"), icon: Briefcase },
        { id: "schools", label: t("common.schools"), icon: Building },
      ];

  return (
    <section ref={ref} className="py-24 bg-secondary/50" id="features">
      <div className="container mx-auto">
        <motion.div 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight">{t('features.headline')}</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('features.subtitle')}
          </p>
        </motion.div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="flex justify-center mb-12">
                <TabsList className="relative grid w-full max-w-md grid-cols-3 bg-muted/50 rounded-full h-12 p-1">
                    {tabs.map((tab) => (
                        <TabsTrigger
                            key={tab.id}
                            value={tab.id}
                            className={cn(
                                "relative z-10 flex items-center justify-center gap-2 text-md rounded-full px-4 py-2 transition-colors",
                                activeTab === tab.id ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                           <tab.icon className="h-5 w-5" /> {tab.label}
                        </TabsTrigger>
                     ))}
                     <motion.div
                        layoutId="active-pill"
                        transition={{ type: "spring", stiffness: 300, damping: 30 }}
                        className={cn(
                            "absolute inset-y-1 h-10 w-1/3 rounded-full bg-primary shadow-lg",
                            {
                                "left-1": activeTab === "graduates",
                                "left-1/3": activeTab === "companies",
                                "left-2/3": activeTab === "schools",
                            }
                        )}
                    />
                </TabsList>
            </div>

          {Object.entries(featuresData).map(([key, data]) => (
            <TabsContent key={key} value={key}>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <motion.div 
                    key={activeTab} 
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
                    />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </motion.div>
                <div className="space-y-6">
                    {data.items.map((feature, index) => (
                        <FeatureCard key={index} feature={feature} />
                    ))}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </section>
  );
}
