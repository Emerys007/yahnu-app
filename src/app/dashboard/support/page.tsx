"use client";

import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenText, GraduationCap, LifeBuoy, Loader2, Search, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { SafeRichText } from "@/components/ui/safe-rich-text";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

interface FaqItem {
  id?: string;
  question: string;
  answer?: string;
  preview?: string;
  richText?: boolean;
  knowledgeBaseArticle?: boolean;
}

type KnowledgeBaseResponse = {
  data: {
    articles: Array<{ id: string; title: string; category: string; contentPreview: string; status: "draft" | "published" }>;
    hasMore: boolean;
    nextOffset: number | null;
  };
};

type KnowledgeBaseArticleResponse = {
  data: { article: { id: string; title: string; category: string; content: string; status: "draft" | "published" } };
};

const ARTICLE_PAGE_SIZE = 24;
const fetchPublishedArticles = (offset = 0) => apiFetch<KnowledgeBaseResponse>(
  `/api/knowledge-base?scope=published&limit=${ARTICLE_PAGE_SIZE}&offset=${offset}`,
);

const contactFormSchema = z.object({
  subject: z.string().trim().min(5, "Précisez le sujet en au moins 5 caractères."),
  message: z.string().trim().min(20, "Décrivez votre besoin en au moins 20 caractères."),
});

function FAQSection({
  faqs,
  searchTerm,
  onKnowledgeBaseOpen,
}: {
  faqs: FaqItem[];
  searchTerm: string;
  onKnowledgeBaseOpen: (id: string) => void;
}) {
  const filteredFaqs = useMemo(() => {
    const query = searchTerm.trim().toLocaleLowerCase("fr-CI");
    if (!query) return faqs;
    return faqs.filter((faq) => {
      const searchable = `${faq.question} ${faq.answer ?? ""} ${faq.preview ?? ""}`
        .replace(/<[^>]*>/g, " ")
        .toLocaleLowerCase("fr-CI");
      return searchable.includes(query);
    });
  }, [faqs, searchTerm]);

  if (filteredFaqs.length === 0) {
    return (
      <div className="flex min-h-40 flex-col items-center justify-center rounded-2xl border border-dashed px-5 text-center">
        <Search className="h-6 w-6 text-muted-foreground" />
        <p className="mt-3 font-display text-lg font-semibold">Aucune réponse pour cette recherche</p>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">Essayez des mots plus simples, par exemple « candidature », « profil » ou « mot de passe ».</p>
      </div>
    );
  }

  return (
    <Accordion
      type="single"
      collapsible
      className="w-full"
      onValueChange={(value) => {
        const faq = filteredFaqs.find((entry, index) => `item-${entry.id || index}` === value);
        if (faq?.knowledgeBaseArticle && faq.id && !faq.answer) void onKnowledgeBaseOpen(faq.id);
      }}
    >
      {filteredFaqs.map((faq, index) => (
        <AccordionItem value={`item-${faq.id || index}`} key={faq.id || index}>
          <AccordionTrigger className="text-left">{faq.question}</AccordionTrigger>
          <AccordionContent>
            {faq.richText && faq.answer
              ? <SafeRichText html={faq.answer} className="prose-sm" />
              : faq.answer ?? faq.preview ?? (
                <span className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Ouverture de l’article…
                </span>
              )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}

function ContactSupportForm() {
  const { toast } = useToast();
  const { user } = useAuth();
  const form = useForm<z.infer<typeof contactFormSchema>>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: { subject: "", message: "" },
  });

  const onSubmit = async (values: z.infer<typeof contactFormSchema>) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Reconnectez-vous avant d’envoyer une demande.", variant: "destructive" });
      return;
    }
    try {
      await apiFetch("/api/tickets", {
        method: "POST",
        body: JSON.stringify({ subject: values.subject, message: values.message }),
      });
      toast({
        title: "Votre demande est partie",
        description: "L’équipe Yahnu vous répondra directement dans votre messagerie.",
      });
      form.reset();
    } catch {
      toast({
        title: "Envoi impossible",
        description: "Votre message n’a pas pu être transmis. Vérifiez votre connexion puis réessayez.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle>Parler à une vraie personne</CardTitle>
        <CardDescription>Expliquez-nous la situation. Une réponse claire vous sera envoyée dans Yahnu.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField control={form.control} name="subject" render={({ field }) => (
              <FormItem>
                <FormLabel>Sujet</FormLabel>
                <FormControl><Input placeholder="Ex. Mon établissement n’apparaît pas" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="message" render={({ field }) => (
              <FormItem>
                <FormLabel>Votre message</FormLabel>
                <FormControl><Textarea placeholder="Décrivez ce qui s’est passé, la page concernée et ce que vous attendiez…" rows={6} maxLength={10_000} {...field} /></FormControl>
                <div className="flex items-center justify-between gap-3">
                  <FormMessage />
                  <span className="ml-auto text-xs text-muted-foreground">{field.value.length.toLocaleString("fr-CI")} / 10 000</span>
                </div>
              </FormItem>
            )} />
            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? <><Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" />Envoi en cours…</>
                : <><Send className="mr-2 h-4 w-4" />Envoyer ma demande</>}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

const GENERAL_FAQS: FaqItem[] = [
  {
    question: "Comment réinitialiser mon mot de passe ?",
    answer: "Depuis la page de connexion, choisissez « Mot de passe oublié ». Yahnu enverra les instructions à l’adresse e-mail liée à votre compte.",
  },
  {
    question: "Comment mettre à jour mon profil ?",
    answer: "Ouvrez « Mon profil » depuis votre tableau de bord. Vous pourrez modifier vos coordonnées, votre parcours, vos compétences et vos préférences.",
  },
  {
    question: "Mes informations sont-elles visibles par tout le monde ?",
    answer: "Votre espace personnel reste protégé. Les informations professionnelles visibles dépendent de votre rôle et des paramètres de votre profil.",
  },
  {
    question: "Comment contacter l’équipe Yahnu ?",
    answer: "Utilisez le formulaire de cette page. Votre demande sera enregistrée et l’équipe vous répondra dans la messagerie Yahnu.",
  },
];

const GRADUATE_FAQS: FaqItem[] = [
  {
    question: "Pourquoi mon compte diplômé est-il encore en attente ?",
    answer: "Votre établissement doit confirmer votre parcours. Si l’attente se prolonge, contactez sa cellule insertion ou utilisez le bouton prévu sur cette page.",
  },
  {
    question: "Comment rendre mon profil attractif pour les recruteurs ivoiriens ?",
    answer: "Ajoutez un titre précis, vos compétences, vos projets, vos stages et la zone où vous pouvez travailler : Abidjan, Bouaké, Yamoussoukro, San-Pédro ou ailleurs en Côte d’Ivoire.",
  },
  {
    question: "Comment suivre une candidature ?",
    answer: "La rubrique « Mes candidatures » présente chaque étape : envoyée, consultée, entretien, proposition ou clôture.",
  },
  {
    question: "Mon CV importé contient une erreur. Que faire ?",
    answer: "Relisez toujours les informations importées puis corrigez-les dans votre profil avant d’envoyer une candidature.",
  },
];

const COMPANY_FAQS: FaqItem[] = [
  {
    question: "Comment publier une offre en Côte d’Ivoire ?",
    answer: "Dans « Mes offres », choisissez « Nouvelle offre », précisez la commune ou la ville, le type de contrat, la rémunération en FCFA si elle est communiquée, puis publiez.",
  },
  {
    question: "Comment identifier les profils les plus pertinents ?",
    answer: "Utilisez le vivier de talents pour filtrer les diplômés par compétence, établissement, expérience et disponibilité, puis consultez leur profil avant de les contacter.",
  },
  {
    question: "Comment travailler avec un établissement ?",
    answer: "La rubrique « Partenariats » permet d’envoyer une demande à une université ou une grande école et de suivre sa réponse.",
  },
];

const SCHOOL_FAQS: FaqItem[] = [
  {
    question: "Comment valider le compte d’un diplômé ?",
    answer: "Dans « Gestion des diplômés », vérifiez les informations du parcours puis approuvez ou refusez la demande en indiquant le motif utile.",
  },
  {
    question: "Comment suivre l’insertion de nos diplômés ?",
    answer: "Le tableau de bord de l’établissement synthétise les candidatures et placements enregistrés dans Yahnu, sans inventer de données absentes.",
  },
  {
    question: "Pouvons-nous créer un événement carrière ?",
    answer: "Oui. Utilisez la rubrique « Événements » pour publier un atelier CV, une rencontre entreprise ou un forum emploi avec le lieu, la date et les modalités d’inscription.",
  },
];

export default function SupportPage() {
  const { user, role } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [publishedArticles, setPublishedArticles] = useState<KnowledgeBaseResponse["data"]["articles"]>([]);
  const [articleContentById, setArticleContentById] = useState<Record<string, string>>({});
  const [hasMoreArticles, setHasMoreArticles] = useState(false);
  const [nextArticleOffset, setNextArticleOffset] = useState(0);
  const [isLoadingArticles, setIsLoadingArticles] = useState(true);
  const [isLoadingMoreArticles, setIsLoadingMoreArticles] = useState(false);
  const [articlesUnavailable, setArticlesUnavailable] = useState(false);
  const [loadingArticleIds, setLoadingArticleIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    fetchPublishedArticles()
      .then((response) => {
        if (cancelled) return;
        setPublishedArticles(response.data.articles);
        setHasMoreArticles(response.data.hasMore);
        setNextArticleOffset(response.data.nextOffset ?? 0);
        setArticlesUnavailable(false);
      })
      .catch(() => { if (!cancelled) setArticlesUnavailable(true); })
      .finally(() => { if (!cancelled) setIsLoadingArticles(false); });
    return () => { cancelled = true; };
  }, []);

  const loadMorePublishedArticles = async () => {
    if (!hasMoreArticles || isLoadingMoreArticles) return;
    setIsLoadingMoreArticles(true);
    try {
      const response = await fetchPublishedArticles(nextArticleOffset);
      const loaded = response.data.articles;
      setPublishedArticles((current) => [
        ...current,
        ...loaded.filter((article) => !current.some((existing) => existing.id === article.id)),
      ]);
      setHasMoreArticles(response.data.hasMore);
      setNextArticleOffset(response.data.nextOffset ?? 0);
    } catch {
      toast({
        title: "Chargement interrompu",
        description: "Les autres articles n’ont pas pu être chargés. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMoreArticles(false);
    }
  };

  const loadArticleContent = async (id: string) => {
    if (articleContentById[id] !== undefined || loadingArticleIds[id]) return;
    setLoadingArticleIds((current) => ({ ...current, [id]: true }));
    try {
      const response = await apiFetch<KnowledgeBaseArticleResponse>(`/api/knowledge-base/${encodeURIComponent(id)}?scope=published`);
      setArticleContentById((current) => ({ ...current, [id]: response.data.article.content }));
    } catch {
      toast({
        title: "Article indisponible",
        description: "Cet article n’a pas pu être ouvert. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setLoadingArticleIds((current) => ({ ...current, [id]: false }));
    }
  };

  const handleContactSchool = () => {
    if (!user?.schoolId) return;
    router.push(`/dashboard/messages?recipientId=${encodeURIComponent(user.schoolId)}&recipientName=${encodeURIComponent(user.schoolName || "Cellule insertion de mon établissement")}`);
  };

  const roleFaqs: Record<string, FaqItem[]> = {
    graduate: GRADUATE_FAQS,
    company: COMPANY_FAQS,
    school: SCHOOL_FAQS,
    admin: [],
    super_admin: [],
    content_manager: [],
    content_moderator: [],
    support_staff: [],
  };

  const publishedFaqs: FaqItem[] = publishedArticles.map((article) => ({
    id: article.id,
    question: article.title,
    answer: articleContentById[article.id],
    preview: article.contentPreview,
    richText: true,
    knowledgeBaseArticle: true,
  }));
  const allFaqs = [...publishedFaqs, ...(roleFaqs[role] ?? []), ...GENERAL_FAQS];

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface lagoon-grid overflow-hidden p-5 sm:p-7">
        <div className="flex items-start gap-4">
          <span className="rounded-2xl bg-primary/10 p-3"><LifeBuoy className="h-6 w-6 text-primary" /></span>
          <div>
            <p className="section-kicker">On avance ensemble</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Comment pouvons-nous vous aider ?</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">Des réponses simples, adaptées à votre parcours sur Yahnu et au marché de l’emploi en Côte d’Ivoire.</p>
          </div>
        </div>
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.65fr)_minmax(20rem,0.8fr)]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpenText className="h-5 w-5 text-primary" />Centre d’aide</CardTitle>
            <CardDescription>Recherchez une question ou parcourez les réponses proposées pour votre profil.</CardDescription>
          </CardHeader>
          <CardContent>
            <label className="sr-only" htmlFor="help-search">Rechercher dans le centre d’aide</label>
            <div className="relative mb-6">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input id="help-search" type="search" placeholder="Ex. suivre ma candidature" className="pl-10" value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} />
            </div>
            {articlesUnavailable ? (
              <Alert className="mb-5">
                <LifeBuoy className="h-4 w-4" />
                <AlertTitle>Une partie du centre d’aide est indisponible</AlertTitle>
                <AlertDescription>Les réponses essentielles restent accessibles ci-dessous.</AlertDescription>
              </Alert>
            ) : null}
            {isLoadingArticles ? (
              <p className="mb-4 flex items-center gap-2 text-sm text-muted-foreground" aria-live="polite">
                <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" />Chargement des articles…
              </p>
            ) : null}
            <FAQSection faqs={allFaqs} searchTerm={searchTerm} onKnowledgeBaseOpen={loadArticleContent} />
            {hasMoreArticles ? (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={() => void loadMorePublishedArticles()} disabled={isLoadingMoreArticles}>
                  {isLoadingMoreArticles ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                  Afficher plus d’articles
                </Button>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <aside className="space-y-4 lg:sticky lg:top-24">
          <ContactSupportForm />
          {role === "graduate" ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><GraduationCap className="h-5 w-5 text-terra" />Votre établissement peut aider</CardTitle>
                <CardDescription>Pour une validation de diplôme ou de compte, contactez directement la cellule insertion.</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" variant="outline" onClick={handleContactSchool} disabled={!user?.schoolId}>
                  <GraduationCap className="mr-2 h-4 w-4" />Contacter mon établissement
                </Button>
                {!user?.schoolId ? <p className="mt-2 text-xs text-muted-foreground">Ajoutez d’abord votre établissement dans votre profil.</p> : null}
              </CardContent>
            </Card>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
