
"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";
import { Card } from "@/components/ui/card";
import { Users, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import React from 'react';
import { cn } from "@/lib/utils";
import { BullseyeAnimation } from "@/components/ui/bullseye-animation";
import { SparklingLightbulb } from "@/components/ui/sparkling-lightbulb";
import { SafeRichText } from "@/components/ui/safe-rich-text";
import { apiFetch } from "@/lib/api-client";

interface TeamMember {
    name: string;
    role: string;
    imageUrl: string;
}

const seededValue = (index: number, salt: number) => ((index * 9_301 + salt * 49_297) % 233_280) / 233_280;

const AnimatedStoryGraphic = ({ text }: { text: string }) => {
    const containerVariants = {
        hidden: {},
        visible: {
            transition: {
                staggerChildren: 0.08,
                delayChildren: 0.5,
            },
        },
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: 'spring', damping: 12, stiffness: 200 },
        },
    };

    return (
        <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg bg-gray-900 flex items-center justify-center p-8">
            <div className="absolute inset-0 z-0">
                {Array.from({ length: 50 }).map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-primary/30"
                        initial={{
                            x: seededValue(i, 1) * 100 + '%',
                            y: seededValue(i, 2) * 100 + '%',
                            scale: 0,
                            opacity: 0,
                        }}
                        animate={{
                            scale: [0, seededValue(i, 3) * 1.2, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: seededValue(i, 4) * 3 + 2,
                            repeat: Infinity,
                            delay: seededValue(i, 5) * 4,
                            ease: 'easeInOut'
                        }}
                        style={{
                            width: `${seededValue(i, 6) * 3 + 1}px`,
                            height: `${seededValue(i, 7) * 3 + 1}px`,
                        }}
                    />
                ))}
            </div>
            <motion.h2
                className="relative z-10 text-5xl md:text-6xl font-bold text-center text-white select-none"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.8 }}
            >
                {(text || "").split('').map((char, index) => (
                    <motion.span
                        key={`${char}-${index}`}
                        variants={letterVariants}
                        className="inline-block relative"
                    >
                         <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{
                                duration: 1,
                                repeat: Infinity,
                                repeatType: 'mirror',
                                delay: index * 0.1 + 1,
                            }}
                            className="absolute -inset-1 bg-primary/50 rounded-full blur-sm"
                         />
                        {char === ' ' ? ' ' : char}
                    </motion.span>
                ))}
            </motion.h2>
        </div>
    );
};

const AnimatedHeading = ({ text }: { text: string }) => {
    const containerVariants = {
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
    };

    const letterVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring', damping: 12, stiffness: 100 } },
    };
    
    return (
        <motion.h1 
            className="text-4xl md:text-6xl font-bold tracking-tight"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
        >
            {(text || "").split("").map((char, index) => (
                 <motion.span 
                    key={`${char}-${index}`}
                    variants={letterVariants}
                    className="inline-block"
                 >
                    {char === " " ? " " : char}
                </motion.span>
            ))}
        </motion.h1>
    )
}

const cardContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
};

const cardItemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } },
};

export default function AboutPage() {
    const { t, countryName } = useLocalization();
    const [managedContent, setManagedContent] = React.useState<Record<string, unknown> | null>(null);

    React.useEffect(() => {
        const controller = new AbortController();
        apiFetch<{ data: { page: { data: Record<string, unknown> } | null } }>('/api/pages/about-us', { signal: controller.signal })
            .then((response) => setManagedContent(response.data.page?.data ?? null))
            .catch((error) => {
                if (!controller.signal.aborted) console.error('Unable to load managed About page content.', error);
            });
        return () => controller.abort();
    }, []);

    const managedText = (key: string, fallback: string) => typeof managedContent?.[key] === 'string'
        ? (managedContent[key] as string).replaceAll('{country}', countryName)
        : fallback;

    const defaultTeamMembers: TeamMember[] = [
        {
            name: "Colombe Koffi",
            role: "about.team.roles.founder_ceo",
            imageUrl: "/images/Colombe Koffi.jpeg"
        },
        {
            name: "Joël K",
            role: "about.team.roles.head_of_product",
            imageUrl: "/images/Joel K.jpeg"
        },
        {
            name: "Bethel Touman",
            role: "about.team.roles.data_engineer",
            imageUrl: "/images/Bethel_Touman.jpeg"
        }
    ];
    const teamMembers = Array.isArray(managedContent?.teamMembers)
        ? (managedContent.teamMembers as TeamMember[]).filter((member) => member && typeof member.name === 'string' && typeof member.role === 'string')
        : defaultTeamMembers;

    const iconVariants = {
        hidden: { scale: 0.5, opacity: 0, y: 20 },
        visible: { 
            scale: 1, 
            opacity: 1, 
            y: 0,
            transition: { type: "spring", stiffness: 150, damping: 10, mass: 0.5 } 
        },
        hover: { 
            scale: 1.15, 
            rotate: [0, 10, -10, 10, 0], 
            transition: { type: "spring", stiffness: 300, damping: 5, mass: 1 } 
        }
    };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative py-20 md:py-32 bg-primary/5">
           <div className="container mx-auto text-center">
            <AnimatedHeading text={managedText('aboutTitle', t('about.title'))} />
            <motion.p 
                className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                {managedText('aboutSubtitle', t('about.mission_statement'))}
            </motion.p>
           </div>
        </section>

        <section className="py-20 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <AnimatedStoryGraphic text={managedText('storyTitle', t('about.story_title'))} />
                <div className="text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        <SafeRichText html={managedText('storyContent1', t('about.story_content_1'))} className="prose max-w-none text-muted-foreground" />
                        <SafeRichText html={managedText('storyContent2', t('about.story_content_2'))} className="prose mt-4 max-w-none text-muted-foreground" />
                    </motion.div>
                </div>
            </div>
        </section>

        <section className="py-20 bg-muted/30">
            <motion.div 
                className="container mx-auto"
                variants={cardContainerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.3 }}
            >
                 <div className="grid md:grid-cols-3 gap-8 text-center">
                    <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <BullseyeAnimation />
                            <h3 className="text-2xl font-bold mb-2">{managedText('missionTitle', t('about.our_mission_title'))}</h3>
                            <SafeRichText html={managedText('missionContent', t('about.our_mission_content'))} className="text-muted-foreground" />
                        </Card>
                    </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <SparklingLightbulb />
                            <h3 className="text-2xl font-bold mb-2">{managedText('visionTitle', t('about.our_vision_title'))}</h3>
                            <SafeRichText html={managedText('visionContent', t('about.our_vision_content'))} className="text-muted-foreground" />
                        </Card>
                     </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <motion.div variants={iconVariants} initial="hidden" animate="visible" whileHover="hover">
                                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-2">{managedText('valuesTitle', t('about.our_values_title'))}</h3>
                            <SafeRichText html={managedText('valuesContent', t('about.our_values_content'))} className="text-muted-foreground" />
                        </Card>
                    </motion.div>
                 </div>
            </motion.div>
        </section>

        <section className="py-20">
             <div className="container mx-auto">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">{t('about.team.title')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('about.team.subtitle')}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {teamMembers.map((member) => (
                        <div key={member.name} className="text-center">
                            <motion.div 
                                className="relative h-40 w-40 mx-auto rounded-full overflow-hidden mb-4 shadow-lg"
                                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)"}}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                 <Image src={member.imageUrl?.startsWith('/') ? member.imageUrl : 'https://placehold.co/160x160.png'} alt={member.name} fill sizes="160px" className="object-cover" />
                            </motion.div>
                            <h4 className="font-semibold text-lg">{member.name}</h4>
                            <p className="text-primary">{t(member.role)}</p>
                        </div>
                    ))}
                 </div>
             </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
