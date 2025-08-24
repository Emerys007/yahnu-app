
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Plus, BookOpen, Edit, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"

const articleSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis."),
  category: z.string().min(1, "La catégorie est requise."),
  content: z.string().min(50, "Le contenu doit comporter au moins 50 caractères."),
});

type Article = z.infer<typeof articleSchema>;

const initialArticles: Article[] = [
    { id: '1', title: 'Comment créer un profil d\'entreprise ?', category: 'Entreprises', content: 'Pour créer un profil d\'entreprise, allez dans votre tableau de bord et sélectionnez "Profil de l\'entreprise"...' },
    { id: '2', title: 'Comment postuler à un emploi ?', category: 'Diplômés', content: 'Pour postuler à un emploi, cliquez sur une offre qui vous intéresse et suivez les instructions...' },
];

export default function KnowledgeBaseEditorPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const form = useForm<Article>({
        resolver: zodResolver(articleSchema),
    });

    const onSubmit = async (data: Article) => {
        if (selectedArticle) {
            setArticles(articles.map(a => a.id === selectedArticle.id ? { ...data, id: a.id } : a));
        } else {
            setArticles([...articles, { ...data, id: Date.now().toString() }]);
        }

        try {
            await addDoc(collection(db, "notifications"), {
                recipientRole: 'content_manager',
                text: `Un article de la base de connaissances a été ${selectedArticle ? 'mis à jour' : 'créé'}: "${data.title}"`,
                link: '/dashboard/support/knowledge-base-editor',
                type: 'knowledge_base',
                createdAt: serverTimestamp(),
                createdBy: user?.uid,
            });
        } catch (e) {
            console.error("Error creating notification for knowledge base article:", e);
        }

        resetForm();
    };
    
    const handleEdit = (article: Article) => {
        setSelectedArticle(article);
        form.reset(article);
        setIsFormVisible(true);
    };

    const handleDelete = (id: string) => {
        setArticles(articles.filter(a => a.id !== id));
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
                                        <Button type="submit">{selectedArticle ? "Mettre à jour" : "Publier"}</Button>
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
                        {articles.map(article => (
                            <div key={article.id} className="border rounded-lg p-4 flex justify-between items-start">
                                <div>
                                    <h3 className="font-semibold">{article.title}</h3>
                                    <p className="text-sm text-muted-foreground">{article.category}</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(article)}><Edit className="h-4 w-4 mr-1" />Modifier</Button>
                                    <Button size="sm" variant="destructive" onClick={() => handleDelete(article.id!)}><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
