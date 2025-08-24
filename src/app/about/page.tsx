
"use client";

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Image from "next/image";
import { Card } from "@/components/ui/card";
import { Users, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";
import React, { useMemo } from 'react';
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

    const numNodes = 20;
    const nodes = useMemo(() => Array.from({ length: numNodes }).map(() => ({
        x: Math.random() * 100,
        y: Math.random() * 100,
    })), []);

    const findClosestNodes = (node: {x: number, y: number}, allNodes: {x: number, y: number}[], count: number) => {
        return allNodes
            .map(other => ({
                ...other,
                distance: Math.sqrt(Math.pow(other.x - node.x, 2) + Math.pow(other.y - node.y, 2))
            }))
            .sort((a, b) => a.distance - b.distance)
            .slice(1, count + 1);
    };

    return (
        <div className="relative w-full h-80 rounded-lg overflow-hidden shadow-lg bg-green-500/10 flex items-center justify-center p-8">
            <div className="absolute inset-0 z-0">
                <svg width="100%" height="100%" className="absolute inset-0">
                    {nodes.map((node, i) => {
                        const closest = findClosestNodes(node, nodes, 2); // Connect to 2 closest nodes
                        return closest.map((neighbor, j) => (
                            <motion.line
                                key={`${i}-${j}`}
                                x1={`${node.x}%`}
                                y1={`${node.y}%`}
                                x2={`${neighbor.x}%`}
                                y2={`${neighbor.y}%`}
                                stroke="currentColor"
                                className="text-green-500/30"
                                initial={{ pathLength: 0, opacity: 0 }}
                                animate={{ pathLength: 1, opacity: 1 }}
                                transition={{
                                    duration: 3,
                                    repeat: Infinity,
                                    repeatType: 'reverse',
                                    delay: Math.random() * 5,
                                    ease: 'easeInOut'
                                }}
                            />
                        ));
                    })}
                </svg>
                {nodes.map((node, i) => (
                    <motion.div
                        key={i}
                        className="absolute rounded-full bg-green-500/80"
                        style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: '6px',
                            height: '6px',
                            translateX: '-50%',
                            translateY: '-50%',
                        }}
                        animate={{
                            scale: [1, 1.5, 1],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            delay: Math.random() * 3,
                            ease: 'easeInOut'
                        }}
                    />
                ))}
            </div>
            <motion.h2
                className="relative z-10 text-5xl md:text-6xl font-bold text-center text-green-900 dark:text-green-100 select-none"
                variants={containerVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.8 }}
            >
                {(text || "").split('').map((char, index) => (
                    <motion.span
                        key={`${char}-${index}`}
                        variants={letterVariants}
                        className="inline-block"
                    >
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
    const teamMembers: TeamMember[] = [
        {
            name: "Colombe Koffi",
            role: "Fondatrice & CEO",
            imageUrl: "/images/Colombe Koffi.jpeg"
        },
        {
            name: "Joël K",
            role: "Chef de Produit",
            imageUrl: "/images/Joel K.jpeg"
        },
        {
            name: "Bethel Touman",
            role: "Ingénieur de Données",
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
            <AnimatedHeading text={"À propos de Yahnu"} />
            <motion.p 
                className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8, duration: 0.5 }}
            >
                {"Nous sommes en mission pour combler le fossé entre l'éducation et l'emploi, créant un écosystème prospère pour que les talents se connectent aux opportunités."}
            </motion.p>
           </div>
        </section>

        <section className="py-20 bg-background">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <AnimatedStoryGraphic text={"Notre Histoire"} />
                <div className="text-center md:text-left">
                    <motion.div
                        initial={{ opacity: 0 }}
                        whileInView={{ opacity: 1 }}
                        viewport={{ once: true, amount: 0.5 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="prose max-w-none text-muted-foreground">{"Fondée par une équipe d'éducateurs et d'entrepreneurs, Yahnu est née d'une vision commune : libérer l'immense potentiel des diplômés en les connectant directement aux industries qui ont besoin de leurs compétences."}</p>
                        <p className="prose max-w-none text-muted-foreground mt-4">{"Aujourd'hui, Yahnu est une plateforme dynamique qui permet aux étudiants de lancer leur carrière, aide les entreprises à trouver efficacement les bons talents et permet aux écoles de forger des partenariaments industriels significatifs. Nous croyons en la construction d'avenirs, une connexion à la fois."}</p>
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
                            <h3 className="text-2xl font-bold mb-2">{"Notre Mission"}</h3>
                            <p className="text-muted-foreground">{"Autonomiser les diplômés, les entreprises et les écoles en créant un écosystème transparent et efficace pour le développement des talents et la croissance de carrière."}</p>
                        </Card>
                    </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <SparklingLightbulb />
                            <h3 className="text-2xl font-bold mb-2">{"Notre Vision"}</h3>
                            <p className="text-muted-foreground">{"Être la plateforme leader pour la connexion professionnelle et les opportunités en Afrique, stimulant la croissance économique et la réussite individuelle."}</p>
                        </Card>
                     </motion.div>
                     <motion.div variants={cardItemVariants} whileHover={{ y: -5, boxShadow: "0 10px 20px rgba(0,0,0,0.08)" }} transition={{ type: 'spring', stiffness: 300 }}>
                        <Card className="p-6 h-full">
                            <motion.div variants={iconVariants} initial="hidden" animate="visible" whileHover="hover">
                                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                            </motion.div>
                            <h3 className="text-2xl font-bold mb-2">{"Nos Valeurs"}</h3>
                            <p className="text-muted-foreground">{"Intégrité, Innovation, Collaboration et un engagement inébranlable envers le succès de nos utilisateurs."}</p>
                        </Card>
                    </motion.div>
                 </div>
            </motion.div>
        </section>

        <section className="py-20">
             <div className="container mx-auto">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">{"Rencontrez l'équipe"}</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{"Les esprits passionnés qui construisent le pont entre l'éducation et l'emploi."}</p>
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
                            <p className="text-primary">{member.role}</p>
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
