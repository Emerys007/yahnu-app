
"use client"

import { useState, useMemo } from "react";
import { useAuth, type Role } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LifeBuoy, Mail, Send, University, Search } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface FaqItem {
  question: string;
  answer: string;
}

const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "Le sujet doit comporter au moins 5 caractères." }),
  message: z.string().min(20, { message: "Le message doit comporter au moins 20 caractères." }),
});

const FAQSection = ({ faqs, searchTerm }: { faqs: FaqItem[], searchTerm: string }) => {
    const filteredFaqs = useMemo(() => {
        if (!searchTerm) return faqs;
        return faqs.filter(faq => 
            faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [faqs, searchTerm]);

    if (filteredFaqs.length === 0) {
        return (
            <div className="text-center py-8 text-muted-foreground">
                <p className="font-semibold">Aucun article ne correspond à votre recherche.</p>
                <p className="text-sm">Essayez d'autres mots-clés ou contactez le support directement.</p>
            </div>
        )
    }

    return (
        <Accordion type="single" collapsible className="w-full">
        {filteredFaqs.map((faq, index) => (
            <AccordionItem value={`item-${index}`} key={index}>
            <AccordionTrigger>{faq.question}</AccordionTrigger>
            <AccordionContent>{faq.answer}</AccordionContent>
            </AccordionItem>
        ))}
        </Accordion>
    );
}

const ContactSupportForm = () => {
    const { toast } = useToast();
    const { user } = useAuth();
    const form = useForm<z.infer<typeof contactFormSchema>>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: { subject: "", message: "" },
    });

    const onSubmit = async (values: z.infer<typeof contactFormSchema>) => {
        if (!user) {
            toast({ title: "Erreur", description: "Vous devez être connecté pour soumettre un ticket.", variant: "destructive" });
            return;
        }

        try {
            await addDoc(collection(db, "tickets"), {
                userId: user.uid,
                userName: user.name,
                userEmail: user.email,
                subject: values.subject,
                message: values.message,
                status: "new",
                submittedAt: serverTimestamp(),
            });
            toast({
                title: "Ticket soumis",
                description: "Notre équipe d'assistance vous répondra bientôt.",
            });
            form.reset();
        } catch (error) {
            console.error("Error submitting ticket:", error);
            toast({ title: "Erreur", description: "Échec de la soumission de votre ticket de support.", variant: "destructive" });
        }
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Contacter le support</CardTitle>
                <CardDescription>Vous ne trouvez pas de réponse ? Envoyez-nous un message.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Sujet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Problème de visibilité du profil" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Veuillez décrire votre problème en détail..." rows={6} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting ? "Envoi en cours..." : <><Send className="mr-2 h-4 w-4" />Envoyer le ticket</>}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function SupportPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");

  const handleContactSchool = () => {
    if (user?.schoolId) {
        // Construct a unique but predictable conversation ID for the school
        const schoolConvoId = `school-admin-${user.schoolId}`;
        router.push(`/dashboard/messages?new=${schoolConvoId}&name=${encodeURIComponent(user.schoolName || 'Admin École')}`);
    }
  }

  const generalFaqs: FaqItem[] = [
    { question: "Comment puis-je réinitialiser mon mot de passe ?", answer: "Vous pouvez réinitialiser votre mot de passe depuis la page de connexion en cliquant sur 'Mot de passe oublié ?'." },
    { question: "Comment puis-je mettre à jour mes informations de profil ?", answer: "Accédez à la page 'Profil' depuis votre tableau de bord pour mettre à jour vos informations personnelles, votre expérience et vos compétences." },
    { question: "Comment puis-je contacter le support ?", answer: "Veuillez utiliser le formulaire sur cette page pour toute question. Notre équipe vous répondra dans les plus brefs délais." },
    { question: "Comment puis-je changer la langue ou le thème ?", answer: "Vous pouvez changer la langue et le thème dans le menu des paramètres, accessible en cliquant sur l'icône de votre profil en haut à droite." },
  ];

  const graduateFaqs: FaqItem[] = [
    { question: "Pourquoi mon compte est-il 'en attente' ?", answer: "Les comptes des diplômés doivent être approuvés par l'administration de leur école pour garantir l'authenticité. Veuillez patienter ou contacter votre école si le délai est trop long." },
    { question: "Comment puis-je rendre mon profil plus attractif ?", answer: "Assurez-vous que votre profil est complet à 100%. Passez nos évaluations de compétences pour obtenir des badges vérifiés, mettez en avant vos projets et vos expériences de stage." },
    { question: "Comment fonctionne la mise en relation avec les emplois ?", answer: "Notre IA analyse les compétences de votre profil et les exigences des offres d'emploi pour vous suggérer les opportunités les plus pertinentes." },
    { question: "Le parser de CV n'a pas extrait toutes mes informations correctement.", answer: "Notre parser IA est un outil pour accélérer le remplissage. Veuillez toujours vérifier et corriger manuellement les informations extraites pour garantir leur exactitude." },
  ];
  
  const companyFaqs: FaqItem[] = [
    { question: "Comment puis-je publier une nouvelle offre d'emploi ?", answer: "Allez dans la section 'Offres d'emploi' de votre tableau de bord et cliquez sur 'Nouvelle offre d'emploi'. Remplissez les détails et publiez." },
    { question: "Comment puis-je trouver les meilleurs candidats ?", answer: "Utilisez les filtres du 'Vivier de talents' pour rechercher des diplômés par compétences, école ou expérience. Les badges de compétences vérifiées indiquent des candidats évalués." },
    { question: "Comment puis-je établir un partenariat avec une école ?", answer: "Dans la section 'Partenariats', vous pouvez rechercher des écoles et envoyer des demandes de partenariat pour collaborer plus étroitement." },
    { question: "Puis-je créer des évaluations personnalisées pour mes candidats ?", answer: "Oui, les entreprises peuvent créer leurs propres évaluations de compétences pour tester les candidats sur des exigences spécifiques au poste." },
  ];

  const schoolFaqs: FaqItem[] = [
    { question: "Comment puis-je approuver les comptes de mes diplômés ?", answer: "Dans la section 'Gestion des diplômés', vous verrez une liste des comptes en attente. Vous pouvez les vérifier et les activer individuellement ou en masse." },
    { question: "Comment fonctionnent les partenariats avec les entreprises ?", answer: "Les entreprises peuvent vous envoyer des demandes de partenariat. Une fois acceptées, elles peuvent plus facilement cibler vos étudiants pour des événements et des offres d'emploi." },
    { question: "Comment puis-je suivre le succès de placement de mes diplômés ?", answer: "Le tableau de bord analytique de l'école fournit des statistiques sur le taux de placement, les entreprises qui recrutent le plus et les secteurs d'activité populaires." },
    { question: "Puis-je créer des événements pour mes étudiants ?", answer: "Oui, la section 'Gestion des événements' vous permet de créer des salons de l'emploi, des ateliers et d'autres événements et d'inviter vos étudiants." },
  ];
  
  const roleFaqs: Record<string, FaqItem[]> = {
      graduate: graduateFaqs,
      company: companyFaqs,
      school: schoolFaqs,
      admin: [],
      super_admin: [],
      content_manager: [],
      support_staff: [],
  };

  const specificFaqs = roleFaqs[role] || [];
  const allFaqs = [...specificFaqs, ...generalFaqs];

  return (
    <motion.div 
        className="space-y-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
    >
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <LifeBuoy className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Support & FAQ</h1>
                <p className="text-muted-foreground mt-1">Trouvez des réponses aux questions courantes ou contactez notre équipe.</p>
            </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Base de connaissances</CardTitle>
                        <CardDescription>Recherchez des réponses dans nos articles d'aide.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="relative mb-6">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Rechercher des articles..." 
                                className="pl-10"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <FAQSection faqs={allFaqs} searchTerm={searchTerm} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1 sticky top-24 space-y-4">
                 <ContactSupportForm />
                {role === 'graduate' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Support École</CardTitle>
                            <CardDescription>Besoin de contacter votre école au sujet de votre compte ?</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full justify-start" onClick={handleContactSchool} disabled={!user?.schoolId}>
                                <University className="mr-2 h-4 w-4" />
                                Contacter votre école
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </motion.div>
  );
}
