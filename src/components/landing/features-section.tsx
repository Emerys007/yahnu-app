
"use client"

import * as React from "react"
import Image from "next/image"
import { motion, useInView, AnimatePresence } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Building, School } from "lucide-react"
import { useLocalization } from "@/context/localization-context"
import { cn } from "@/lib/utils"
import { AnimatedGradientBackground } from "../ui/animated-gradient-background"

const getFeaturesData = (t: (key: string) => string) => ({
  graduates: {
    title: t('landing.features.for_graduates.title'),
    icon: <GraduationCap className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/uni-partnership.jpg",
    imageHint: "african graduate students",
    items: [
      {
        title: t('landing.features.for_graduates.ai_profile_builder'),
        description: t('landing.features.for_graduates.ai_profile_builder_desc'),
      },
      {
        title: t('landing.features.for_graduates.job_matching'),
        description: t('landing.features.for_graduates.job_matching_desc'),
      },
      {
        title: t('landing.features.for_graduates.skill_development'),
        description: t('landing.features.for_graduates.skill_development_desc'),
      },
    ],
  },
  companies: {
    title: t('landing.features.for_companies.title'),
    icon: <Building className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/IndustryPartnership.jpeg",
    imageHint: "recruitment dashboard",
    items: [
      {
        title: t('landing.features.for_companies.talent_sourcing'),
        description: t('landing.features.for_companies.talent_sourcing_desc'),
      },
      {
        title: t('landing.features.for_companies.streamlined_recruitment'),
        description: t('landing.features.for_companies.streamlined_recruitment_desc'),
      },
      {
        title: t('landing.features.for_companies.data_insights'),
        description: t('landing.features.for_companies.data_insights_desc'),
      },
    ],
  },
  schools: {
    title: t('landing.features.for_schools.title'),
    icon: <School className="h-8 w-8 mb-4 text-primary" />,
    image: "/images/University.png",
    imageHint: "academic analytics",
    items: [
      {
        title: t('landing.features.for_schools.industry_ties'),
        description: t('landing.features.for_schools.industry_ties_desc'),
      },
      {
        title: t('landing.features.for_schools.boost_graduate_employability'),
        description: t('landing.features.for_schools.graduate_employability_desc'),
      },
      {
        title: t('landing.features.for_schools.showcase_institution'),
        description: t('landing.features.for_schools.showcase_institution_desc'),
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

const AnimatedTabs = () => {
  const { t } = useLocalization();
  const [activeTab, setActiveTab] = React.useState("graduates");
  const featuresData = getFeaturesData(t);

  const tabs = [
    { id: 'graduates', label: t('landing.features.for_graduates.title'), icon: GraduationCap },
    { id: 'companies', label: t('landing.features.for_companies.title'), icon: Building },
    { id: 'schools', label: t('landing.features.for_schools.title'), icon: School },
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
    const { t } = useLocalization();
    const ref = React.useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });

  return (
    <section ref={ref} className="py-24 relative overflow-hidden" id="features">
      <AnimatedGradientBackground />
      <div className="container mx-auto relative z-10">
        <motion.div 
            initial="hidden"
            animate={isInView ? "visible" : "hidden"}
            variants={{ hidden: { opacity: 0, y: -20 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold tracking-tight">{t('landing.features.title')}</h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-3xl mx-auto">
            {t('landing.features.description')}
          </p>
        </motion.div>
        
        <AnimatedTabs />

      </div>
    </section>
  );
}
