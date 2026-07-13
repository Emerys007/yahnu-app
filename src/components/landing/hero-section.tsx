"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, CheckCircle2, GraduationCap, Search, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useLocalization } from "@/context/localization-context";

const heroCopy = {
  en: {
    eyebrow: "Africa’s opportunity network",
    title: "The next great career story starts with a stronger connection.",
    body: "Yahnu brings graduates, institutions, and employers into one trusted space—so potential becomes momentum.",
    explore: "Explore opportunities",
    join: "Join Yahnu",
    proof: "Built for intentional career moves",
    stats: [["3", "sides of the talent network"], ["1", "shared source of opportunity"], ["∞", "futures worth building"]],
    graduate: "Graduate",
    company: "Employer",
    school: "Institution",
  },
  fr: {
    eyebrow: "Le réseau de l’opportunité en Afrique",
    title: "La prochaine grande histoire professionnelle commence par une connexion plus forte.",
    body: "Yahnu réunit diplômés, établissements et employeurs dans un espace de confiance, pour transformer le potentiel en élan.",
    explore: "Explorer les opportunités",
    join: "Rejoindre Yahnu",
    proof: "Conçu pour des choix de carrière intentionnels",
    stats: [["3", "acteurs du réseau de talents"], ["1", "source partagée d’opportunités"], ["∞", "avenirs à construire"]],
    graduate: "Diplômé",
    company: "Employeur",
    school: "Établissement",
  },
} as const;

export function HeroSection() {
  const { language } = useLocalization();
  const locale = language === "fr" ? "fr" : "en";
  const content = heroCopy[locale];
  const audiences = [
    { label: content.graduate, icon: GraduationCap, href: "/signup?role=graduate" },
    { label: content.company, icon: Building2, href: "/signup?role=company" },
    { label: content.school, icon: CheckCircle2, href: "/signup?role=school_administrator" },
  ];

  return (
    <section className="relative isolate overflow-hidden bg-slate-950 text-white">
      <Image src="/images/dream-job.jpg" alt="A confident graduate looking ahead" fill priority sizes="100vw" className="-z-20 object-cover object-center opacity-40" />
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(104deg,rgba(7,16,32,0.98)_5%,rgba(7,16,32,0.92)_47%,rgba(7,16,32,0.62)_100%)]" />
      <div className="absolute -right-32 top-20 -z-10 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
      <div className="container mx-auto grid min-h-[min(48rem,calc(100vh-5rem))] items-center gap-12 py-20 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-primary-foreground backdrop-blur"><Sparkles className="h-3.5 w-3.5 text-primary" />{content.eyebrow}</p>
          <h1 className="mt-7 max-w-4xl text-4xl font-bold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">{content.title}</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">{content.body}</p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <Button className="h-12 rounded-xl px-6 text-base shadow-lg shadow-primary/20" asChild><Link href="/jobs"><Search className="mr-2 h-4 w-4" />{content.explore}<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button variant="outline" className="h-12 rounded-xl border-white/20 bg-white/5 px-6 text-base text-white hover:bg-white/15 hover:text-white" asChild><Link href="/signup">{content.join}</Link></Button>
          </div>
          <div className="mt-10 border-t border-white/15 pt-6">
            <p className="text-sm font-medium text-slate-300">{content.proof}</p>
            <div className="mt-4 grid max-w-xl grid-cols-3 gap-4">
              {content.stats.map(([number, label]) => <div key={label}><p className="text-2xl font-semibold tracking-tight text-primary">{number}</p><p className="mt-1 text-xs leading-4 text-slate-300">{label}</p></div>)}
            </div>
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.75 }} className="hidden lg:block">
          <div className="ml-auto max-w-md rounded-[2rem] border border-white/15 bg-slate-900/70 p-3 shadow-2xl shadow-black/30 backdrop-blur-xl">
            <div className="rounded-[1.55rem] border border-white/10 bg-white/[0.07] p-6">
              <div className="flex items-center justify-between"><span className="text-sm font-medium text-slate-300">Yahnu</span><span className="rounded-full bg-primary/15 px-2.5 py-1 text-xs font-medium text-primary">Live network</span></div>
              <p className="mt-10 text-2xl font-semibold leading-tight">{locale === "fr" ? "Choisissez votre point de départ." : "Choose your starting point."}</p>
              <div className="mt-6 space-y-3">
                {audiences.map(({ label, icon: Icon, href }, index) => <Link key={label} href={href} className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.05] p-4 transition hover:border-primary/50 hover:bg-white/[0.09]"><span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 text-primary"><Icon className="h-5 w-5" /></span><span className="flex-1 font-medium">{label}</span><ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-primary" /><span className="sr-only">{label}</span></Link>)}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
