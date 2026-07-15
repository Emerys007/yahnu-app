
"use client"

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Plus, BookOpen, Edit, Trash2, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast"
import { apiFetch } from "@/lib/api-client"

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis."),
  category: z.string().min(1, "La catégorie est requise."),
  content: z.string().min(50, "Le contenu doit comporter au moins 50 caractères."),
});

type Article = z.infer<typeof articleSchema>;
type ArticleRecord = Article & { id: string; status: 'draft' | 'published' };
type ArticleSummary = { id: string; title: string; category: string; contentPreview: string; status: 'draft' | 'published' };
type ArticlesResponse = { data: { articles: ArticleSummary[]; hasMore: boolean; nextOffset: number | null } };
type ArticleResponse = { data: { article: ArticleRecord } };

const PAGE_SIZE = 30;
const previewContent = (content: string) => content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 480);
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
    const [hasMore, setHasMore] = useState(false);
    const [nextOffset, setNextOffset] = useState(0);
    const [openingArticleId, setOpeningArticleId] = useState<string | null>(null);
    const [selectedArticle, setSelectedArticle] = useState<ArticleRecord | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const form = useForm<Article>({
        resolver: zodResolver(articleSchema),
    });

    useEffect(() => {
        fetchArticles()
            .then((response) => {
                setArticles(response.data.articles);
                setHasMore(response.data.hasMore);
                setNextOffset(response.data.nextOffset ?? 0);
            })
            .catch((error) => toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'La base de connaissances est temporairement indisponible.',
                variant: 'destructive',
            }))
            .finally(() => setIsLoading(false));
    }, [toast]);

    const loadMoreArticles = async () => {
        if (!hasMore || isLoadingMore) return;
        setIsLoadingMore(true);
        try {
            const response = await fetchArticles(nextOffset);
            const loaded = response.data.articles;
            setArticles((current) => [...current, ...loaded.filter((article) => !current.some((existing) => existing.id === article.id))]);
            setHasMore(response.data.hasMore);
            setNextOffset(response.data.nextOffset ?? 0);
        } catch (error) {
            toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'Impossible de charger davantage d’articles.',
                variant: 'destructive',
            });
        } finally {
            setIsLoadingMore(false);
        }
    };

    const onSubmit = async (data: Article) => {
        setIsSaving(true);
        try {
            const endpoint = selectedArticle?.id
                ? `/api/knowledge-base/${encodeURIComponent(selectedArticle.id)}`
                : '/api/knowledge-base';
            const response = await apiFetch<ArticleResponse>(endpoint, {
                method: selectedArticle?.id ? 'PATCH' : 'POST',
                body: JSON.stringify({ ...data, status: 'published' }),
            });
            const saved = summaryFromArticle(response.data.article);
            setArticles((current) => selectedArticle?.id
                ? current.map((article) => article.id === selectedArticle.id ? saved : article)
                : [saved, ...current]);
            toast({ title: selectedArticle ? 'Article mis à jour' : 'Article publié' });
            resetForm();
        } catch (error) {
            toast({
                title: 'Enregistrement impossible',
                description: error instanceof Error ? error.message : 'Veuillez réessayer.',
                variant: 'destructive',
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
        } catch (error) {
            toast({
                title: 'Chargement impossible',
                description: error instanceof Error ? error.message : 'Impossible de charger cet article.',
                variant: 'destructive',
            });
        } finally {
            setOpeningArticleId(null);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await apiFetch(`/api/knowledge-base/${encodeURIComponent(id)}`, { method: 'DELETE' });
            setArticles((current) => current.filter((article) => article.id !== id));
        } catch (error) {
            toast({
                title: 'Suppression impossible',
                description: error instanceof Error ? error.message : 'Veuillez réessayer.',
                variant: 'destructive',
            });
        }
    };

    const resetForm = () => {
        setSelectedArticle(null);
        form.reset({ title: '', category: '', content: '' });
        setIsFormVisible(false);
    };

    return (
        <div className="space-y-8">
             <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Base de Connaissances</h1>
                        <p className="text-muted-foreground mt-1">Créez et gérez les articles d'aide pour la plateforme.</p>
                    </div>
                </div>
                {!isFormVisible && (
                    <Button onClick={() => { setSelectedArticle(null); form.reset({ title: '', category: '', content: '' }); setIsFormVisible(true); }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel Article
                    </Button>
                )}
            </div>

            <AnimatePresence>
            {isFormVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                >
                    <Card>
                        <CardHeader>
                            <CardTitle>{selectedArticle ? "Modifier l'Article" : "Créer un Nouvel Article"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <FormField control={form.control} name="title" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Titre de l'article</FormLabel>
                                                <FormControl><Input {...field} placeholder="Comment faire..." /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )} />
                                        <FormField control={form.control} name="category" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Catégorie</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl><SelectTrigger><SelectValue placeholder="Sélectionner une catégorie" /></SelectTrigger></FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Général">Général</SelectItem>
                                                        <SelectItem value="Diplômés">Diplômés</SelectItem>
                                                        <SelectItem value="Entreprises">Entreprises</SelectItem>
                                                        <SelectItem value="Écoles">Écoles</SelectItem>
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
                                    <div className="flex justify-end gap-2">
                                        <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
                                        <Button type="submit" disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                            {selectedArticle ? "Mettre à jour" : "Publier"}
                                        </Button>
                                    </div>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </motion.div>
            )}
            </AnimatePresence>
            
            <Card>
                <CardHeader>
                    <CardTitle>Articles Publiés</CardTitle>
                    <CardDescription>Liste de tous les articles de la base de connaissances.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {isLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : null}
                        {!isLoading && articles.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun article publié.</p> : null}
                        {articles.map(article => (
                            <div key={article.id} className="border rounded-lg p-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{article.title}</h3>
                                    <p className="text-sm text-muted-foreground">{article.category}</p>
                                    <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{article.contentPreview}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => void handleEdit(article)} disabled={openingArticleId !== null}>
                                        {openingArticleId === article.id ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Edit className="h-4 w-4 mr-1" />}
                                        Modifier
                                    </Button>
                                    <Button size="sm" variant="destructive" onClick={() => article.id && void handleDelete(article.id)}><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                                </div>
                            </div>
                        ))}
                        {hasMore ? (
                            <div className="flex justify-center pt-2">
                                <Button variant="outline" onClick={() => void loadMoreArticles()} disabled={isLoadingMore}>
                                    {isLoadingMore ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                    Afficher plus d&apos;articles
                                </Button>
                            </div>
                        ) : null}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
