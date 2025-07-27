
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

interface TeamMember {
    name: string;
    role: string;
    imageUrl: string;
}

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
                            x: Math.random() * 100 + '%',
                            y: Math.random() * 100 + '%',
                            scale: 0,
                            opacity: 0,
                        }}
                        animate={{
                            scale: [0, Math.random() * 1.2, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: Math.random() * 3 + 2,
                            repeat: Infinity,
                            delay: Math.random() * 4,
                            ease: 'easeInOut'
                        }}
                        style={{
                            width: `${Math.random() * 3 + 1}px`,
                            height: `${Math.random() * 3 + 1}px`,
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
    const { t } = useLocalization();

    const teamMembers: TeamMember[] = [
        {
            name: "Colombe Koffi",
            role: "Founder & CEO",
            imageUrl: "/images/Colombe Koffi.jpeg"
        },
        {
            name: "Joël K",
            role: "Head of Product & Lead Engineer",
            imageUrl: "/images/Joel K.jpeg"
        },
        {
            name: "Bethel Touman",
            role: "Data Engineer",
            imageUrl: "/images/Bethel_Touman.jpeg"
        }
    ];

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
            <AnimatedHeading text={t('About Yahnu')} />
            <motion.p 
                className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                {t('We are on a mission to bridge the gap between education and employment, creating a thriving ecosystem for talent to connect with opportunity in {country} and beyond.')}
            </motion.p>
           </div>
        </section>

        <section className="py-20 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <AnimatedStoryGraphic text={t('Our Story')} />
                <div className="text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="prose max-w-none text-muted-foreground">{t('Founded by a team of educators and entrepreneurs, Yahnu was born from a shared vision: to unlock the immense potential of graduates by directly connecting them with the industries that need their skills. We saw a disconnect between the classroom and the workplace and set out to build the bridge.')}</p>
                        <p className="prose max-w-none text-muted-foreground mt-4">{t('Today, Yahnu is a dynamic platform that empowers students to launch their careers, helps companies find the right talent efficiently, and enables schools to forge meaningful industry partnerships. We believe in building futures, one connection at a time.')}</p>
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
                            <h3 className="text-2xl font-bold mb-2">{t('Our Mission')}</h3>
                            <p className="text-muted-foreground">{t('To empower graduates, companies, and schools by creating a seamless and efficient ecosystem for talent development and career growth.')}</p>
                        </Card>
                    </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <SparklingLightbulb />
                            <h3 className="text-2xl font-bold mb-2">{t('Our Vision')}</h3>
                            <p className="text-muted-foreground">{t('To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success.')}</p>
                        </Card>
                     </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <motion.div variants={iconVariants} initial="hidden" animate="visible" whileHover="hover">
                                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-2">{t('Our Values')}</h3>
                            <p className="text-muted-foreground">{t('Integrity, Innovation, Collaboration, and an unwavering commitment to the success of our users.')}</p>
                        </Card>
                    </motion.div>
                 </div>
            </motion.div>
        </section>

        <section className="py-20">
             <div className="container mx-auto">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">{t('Meet the Team')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('The passionate individuals dedicated to building Yahnu.')}</p>
                 </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {teamMembers.map((member) => (
                        <div key={member.name} className="text-center">
                            <motion.div 
                                className="relative h-40 w-40 mx-auto rounded-full overflow-hidden mb-4 shadow-lg"
                                whileHover={{ scale: 1.05, boxShadow: "0px 10px 20px rgba(0,0,0,0.1)"}}
                                transition={{ type: "spring", stiffness: 300 }}
                            >
                                 <Image src={member.imageUrl || 'https://placehold.co/160x160.png'} alt={member.name} fill sizes="160px" className="object-cover" />
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
