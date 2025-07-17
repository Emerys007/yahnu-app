
"use client"

import { MainNav } from "@/components/landing/main-nav";
import { Footer } from "@/components/landing/footer";
import Image from "next/image";
import { useLocalization } from "@/context/localization-context";
import { Card, CardContent } from "@/components/ui/card";
import { Users, Lightbulb, Target } from "lucide-react";

const teamMembers = [
    { name: "Colombe Koffi", role: "Founder & CEO", imageUrl: "/images/Colombe Koffi.jpeg" },
    { name: "Joël K", role: "Head of Product & Lead Engineer", imageUrl: "/images/Joel K.jpeg" },
    { name: "Bethel Touman", role: "Data Engineer", imageUrl: "https://placehold.co/400x400.png" },
]

export default function AboutPage() {
    const { t } = useLocalization();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <MainNav />
      <main className="flex-1">
        <section className="relative py-20 md:py-32 bg-primary/5">
           <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">{t('About Yahnu')}</h1>
            <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
                {t('We are on a mission to bridge the gap between education and employment, creating a thriving ecosystem for talent to connect with opportunity in {country} and beyond.')}
            </p>
           </div>
        </section>

        <section className="py-20">
            <div className="container mx-auto grid md:grid-cols-2 gap-12 items-center">
                <div className="relative w-full h-80 rounded-lg overflow-hidden">
                    <Image src="https://placehold.co/800x600.png" alt="Yahnu Team" fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" data-ai-hint="diverse team working" priority />
                </div>
                <div>
                    <h2 className="text-3xl font-bold tracking-tight mb-4">{t('Our Story')}</h2>
                    <p className="text-muted-foreground mb-4">
                        {t("Founded by a team of educators and entrepreneurs, Yahnu was born from a shared vision: to unlock the immense potential of graduates by directly connecting them with the industries that need their skills. We saw a disconnect between the classroom and the workplace and set out to build the bridge.")}
                    </p>
                     <p className="text-muted-foreground">
                        {t("Today, Yahnu is a dynamic platform that empowers students to launch their careers, helps companies find the right talent efficiently, and enables schools to forge meaningful industry partnerships. We believe in building futures, one connection at a time.")}
                    </p>
                </div>
            </div>
        </section>

        <section className="py-20 bg-muted/40">
            <div className="container mx-auto">
                 <div className="grid md:grid-cols-3 gap-8 text-center">
                    <Card className="p-6">
                        <Target className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('Our Mission')}</h3>
                        <p className="text-muted-foreground">{t('To empower graduates, companies, and schools by creating a seamless and efficient ecosystem for talent development and career growth.')}</p>
                    </Card>
                     <Card className="p-6">
                        <Lightbulb className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('Our Vision')}</h3>
                        <p className="text-muted-foreground">{t('To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success.')}</p>
                    </Card>
                     <Card className="p-6">
                        <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                        <h3 className="text-2xl font-bold mb-2">{t('Our Values')}</h3>
                        <p className="text-muted-foreground">{t('Integrity, Innovation, Collaboration, and an unwavering commitment to the success of our users.')}</p>
                    </Card>
                 </div>
            </div>
        </section>

        <section className="py-20">
             <div className="container mx-auto">
                 <div className="text-center mb-12">
                    <h2 className="text-3xl font-bold tracking-tight">{t('Meet the Team')}</h2>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">{t('The passionate individuals dedicated to building Yahnu.')}</p>
                 </div>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    {teamMembers.map(member => (
                        <div key={member.name} className="text-center">
                            <div className="relative h-40 w-40 mx-auto rounded-full overflow-hidden mb-4">
                                 <Image src={member.imageUrl} alt={member.name} fill sizes="160px" className="object-cover" />
                            </div>
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
