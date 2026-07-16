"use client";

import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { BookOpenText, Edit3, FileText, Loader2, Plus, Trash2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api-client";

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(5, "Le titre doit contenir au moins 5 caractères."),
  category: z.string().trim().min(1, "Choisissez une catégorie."),
  content: z.string().min(50, "Le contenu doit contenir au moins 50 caractères."),
  status: z.enum(["draft", "published"]),
});

type Article = z.infer<typeof articleSchema>;
type ArticleRecord = Article & { id: string };
type ArticleSummary = {
  id: string;
  title: string;
  category: string;
  contentPreview: string;
  status: "draft" | "published";
};
type ArticlesResponse = { data: { articles: ArticleSummary[]; hasMore: boolean; nextOffset: number | null } };
type ArticleResponse = { data: { article: ArticleRecord } };

const PAGE_SIZE = 30;
const EMPTY_ARTICLE: Article = { title: "", category: "", content: "", status: "draft" };

const previewContent = (content: string) => content
  .replace(/<[^>]*>/g, " ")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, 480);

const summaryFromArticle = (article: ArticleRecord): ArticleSummary => ({
  id: article.id,
  title: article.title,
  category: article.category,
  contentPreview: previewContent(article.content),
  status: article.status,
});

const fetchArticles = (offset = 0) => apiFetch<ArticlesResponse>(`/api/knowledge-base?scope=all&limit=${PAGE_SIZE}&offset=${offset}`);

export default function KnowledgeBaseEditorPage() {
  const { toast } = useToast();
  const [articles, setArticles] = useState<ArticleSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [openingArticleId, setOpeningArticleId] = useState<string | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ArticleRecord | null>(null);
  const [isFormVisible, setIsFormVisible] = useState(false);

  const form = useForm<Article>({
    resolver: zodResolver(articleSchema),
    defaultValues: EMPTY_ARTICLE,
  });

  useEffect(() => {
    let cancelled = false;
    fetchArticles()
      .then((response) => {
        if (cancelled) return;
        setArticles(response.data.articles);
        setHasMore(response.data.hasMore);
        setNextOffset(response.data.nextOffset ?? 0);
      })
      .catch(() => {
        if (!cancelled) toast({
          title: "Chargement impossible",
          description: "La base de connaissances est momentanément indisponible.",
          variant: "destructive",
        });
      })
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [toast]);

  const loadMoreArticles = async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const response = await fetchArticles(nextOffset);
      const loaded = response.data.articles;
      setArticles((current) => [
        ...current,
        ...loaded.filter((article) => !current.some((existing) => existing.id === article.id)),
      ]);
      setHasMore(response.data.hasMore);
      setNextOffset(response.data.nextOffset ?? 0);
    } catch {
      toast({
        title: "Chargement interrompu",
        description: "Les autres articles n’ont pas pu être récupérés. Réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingMore(false);
    }
  };

  const resetForm = () => {
    setSelectedArticle(null);
    form.reset(EMPTY_ARTICLE);
    setIsFormVisible(false);
  };

  const startNewArticle = () => {
    setSelectedArticle(null);
    form.reset(EMPTY_ARTICLE);
    setIsFormVisible(true);
  };

  const onSubmit = async (data: Article) => {
    setIsSaving(true);
    try {
      const payload = {
        title: data.title,
        category: data.category,
        content: data.content,
        status: data.status,
      };
      const endpoint = selectedArticle?.id
        ? `/api/knowledge-base/${encodeURIComponent(selectedArticle.id)}`
        : "/api/knowledge-base";
      const response = await apiFetch<ArticleResponse>(endpoint, {
        method: selectedArticle?.id ? "PATCH" : "POST",
        body: JSON.stringify(payload),
      });
      const saved = summaryFromArticle(response.data.article);
      setArticles((current) => selectedArticle?.id
        ? current.map((article) => article.id === selectedArticle.id ? saved : article)
        : [saved, ...current]);
      toast({
        title: selectedArticle ? "Article mis à jour" : data.status === "published" ? "Article publié" : "Brouillon enregistré",
        description: data.status === "published" ? "L’article est visible dans le centre d’aide." : "Vous pourrez le reprendre avant publication.",
      });
      resetForm();
    } catch {
      toast({
        title: "Enregistrement impossible",
        description: "Votre contenu n’a pas été perdu. Vérifiez votre connexion puis réessayez.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = async (article: ArticleSummary) => {
    setOpeningArticleId(article.id);
    try {
      const response = await apiFetch<ArticleResponse>(`/api/knowledge-base/${encodeURIComponent(article.id)}?scope=all`);
      setSelectedArticle(response.data.article);
      form.reset(response.data.article);
      setIsFormVisible(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      toast({
        title: "Article indisponible",
        description: "Cet article n’a pas pu être ouvert. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setOpeningArticleId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await apiFetch(`/api/knowledge-base/${encodeURIComponent(id)}`, { method: "DELETE" });
      setArticles((current) => current.filter((article) => article.id !== id));
      toast({ title: "Article supprimé" });
    } catch {
      toast({
        title: "Suppression impossible",
        description: "L’article est toujours en place. Réessayez dans un instant.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const publishedCount = articles.filter((article) => article.status === "published").length;
  const draftCount = articles.filter((article) => article.status === "draft").length;

  return (
    <div className="space-y-6 lg:space-y-8">
      <section className="dashboard-surface ci-pattern overflow-hidden p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="section-kicker">Centre d’aide Yahnu</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Des réponses qui parlent vrai</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Rédigez des guides simples pour accompagner les diplômés, les recruteurs et les établissements de Côte d’Ivoire.
            </p>
          </div>
          {!isFormVisible ? (
            <Button onClick={startNewArticle}><Plus className="mr-2 h-4 w-4" />Nouvel article</Button>
          ) : null}
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 sm:max-w-md">
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Publiés</p><p className="mt-1 font-display text-2xl font-semibold">{publishedCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-sm text-muted-foreground">Brouillons</p><p className="mt-1 font-display text-2xl font-semibold">{draftCount}</p></CardContent></Card>
      </div>

      {isFormVisible ? (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle>{selectedArticle ? "Modifier l’article" : "Rédiger un article"}</CardTitle>
            <CardDescription>Écrivez comme si vous aidiez une personne en face de vous : phrases courtes, étapes claires, exemples ivoiriens.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid gap-5 md:grid-cols-2">
                  <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Titre de l’article</FormLabel>
                      <FormControl><Input {...field} placeholder="Ex. Bien préparer un entretien à Abidjan" /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="category" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Catégorie</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Choisir une catégorie" /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="Premiers pas">Premiers pas</SelectItem>
                          <SelectItem value="Diplômés">Diplômés</SelectItem>
                          <SelectItem value="Entreprises">Entreprises</SelectItem>
                          <SelectItem value="Établissements">Établissements</SelectItem>
                          <SelectItem value="Candidatures et emploi">Candidatures et emploi</SelectItem>
                          <SelectItem value="Compte et sécurité">Compte et sécurité</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="content" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contenu</FormLabel>
                    <FormControl><RichTextEditor {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem className="max-w-sm">
                    <FormLabel>Visibilité</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="draft">Brouillon — équipe uniquement</SelectItem>
                        <SelectItem value="published">Publié — visible dans le centre d’aide</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={resetForm}>Annuler</Button>
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <FileText className="mr-2 h-4 w-4" />}
                    {form.watch("status") === "published" ? "Publier l’article" : "Enregistrer le brouillon"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Bibliothèque d’aide</CardTitle>
          <CardDescription>Articles publiés et brouillons enregistrés sur la plateforme.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-muted-foreground" aria-live="polite">
              <Loader2 className="h-8 w-8 animate-spin text-primary motion-reduce:animate-none" />
              <p>Chargement de la bibliothèque…</p>
            </div>
          ) : articles.length === 0 ? (
            <div className="flex min-h-48 flex-col items-center justify-center gap-3 text-center">
              <span className="rounded-full bg-primary/10 p-3"><BookOpenText className="h-6 w-6 text-primary" /></span>
              <div><p className="font-display text-lg font-semibold">La bibliothèque est vide</p><p className="mt-1 text-sm text-muted-foreground">Créez le premier guide utile à la communauté Yahnu.</p></div>
              <Button variant="outline" onClick={startNewArticle}><Plus className="mr-2 h-4 w-4" />Créer un article</Button>
            </div>
          ) : (
            <div className="grid gap-3">
              {articles.map((article) => (
                <article key={article.id} className="rounded-2xl border p-4 sm:p-5">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-lg font-semibold">{article.title}</h3>
                        <Badge variant="outline" className={article.status === "published" ? "border-primary/30 bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}>
                          {article.status === "published" ? "Publié" : "Brouillon"}
                        </Badge>
                      </div>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.14em] text-terra">{article.category}</p>
                      <p className="mt-3 line-clamp-3 max-w-3xl text-sm leading-6 text-muted-foreground">{article.contentPreview || "Aucun aperçu disponible."}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button size="sm" variant="outline" onClick={() => void handleEdit(article)} disabled={openingArticleId !== null || deletingId !== null}>
                        {openingArticleId === article.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Edit3 className="mr-2 h-4 w-4" />}
                        Modifier
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="destructive" disabled={deletingId !== null} aria-label={`Supprimer ${article.title}`}>
                            {deletingId === article.id ? <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" /> : <Trash2 className="h-4 w-4" />}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle>
                            <AlertDialogDescription>« {article.title} » disparaîtra définitivement du centre d’aide. Cette action est irréversible.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Conserver l’article</AlertDialogCancel>
                            <AlertDialogAction onClick={() => void handleDelete(article.id)}>Supprimer définitivement</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
          {hasMore ? (
            <div className="mt-5 flex justify-center border-t pt-5">
              <Button variant="outline" onClick={() => void loadMoreArticles()} disabled={isLoadingMore}>
                {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin motion-reduce:animate-none" /> : null}
                Afficher plus d’articles
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
