
"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useForm } from "react-hook-form";
import { Plus, Newspaper, Edit, Trash2, Eye } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis."),
  slug: z.string().min(1, "Le slug est requis."),
  author: z.string().min(1, "L'auteur est requis."),
  status: z.enum(['draft', 'published']),
  content: z.string().min(100, "Le contenu doit comporter au moins 100 caractères."),
  excerpt: z.string().max(200, "L'extrait ne doit pas dépasser 200 caractères.").optional(),
});

type Post = z.infer<typeof postSchema>;

const initialPosts: Post[] = [
    { id: '1', title: '5 Astuces pour une Recherche d\'Emploi Efficace', slug: '5-astuces-recherche-emploi', author: 'Jane Doe', status: 'published', content: 'Contenu détaillé sur les astuces pour la recherche d\'emploi...', excerpt: 'Découvrez 5 astuces pour optimiser votre recherche d\'emploi et décrocher le poste de vos rêves.' },
];

export default function BlogManagementPage() {
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);

    const form = useForm<Post>({
        resolver: zodResolver(postSchema),
        defaultValues: { status: 'draft' }
    });
    
    const onSubmit = (data: Post) => {
        if (selectedPost) {
            setPosts(posts.map(p => p.id === selectedPost.id ? { ...data, id: p.id } : p));
        } else {
            setPosts([...posts, { ...data, id: Date.now().toString() }]);
        }
        resetForm();
    };
    
    const handleEdit = (post: Post) => {
        setSelectedPost(post);
        form.reset(post);
        setIsFormVisible(true);
    };

    const handleDelete = (id: string) => {
        setPosts(posts.filter(p => p.id !== id));
    };

    const resetForm = () => {
        setSelectedPost(null);
        form.reset({ title: '', slug: '', author: '', status: 'draft', content: '', excerpt: '' });
        setIsFormVisible(false);
    };

    const watchContent = form.watch('content');
    
    return (
        <div className="space-y-8">
            <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg"><Newspaper className="h-6 w-6 text-primary" /></div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion du Blog</h1>
                        <p className="text-muted-foreground mt-1">Rédigez, modifiez et publiez des articles de blog.</p>
                    </div>
                </div>
                {!isFormVisible && (
                    <Button onClick={() => { setSelectedPost(null); form.reset({ title: '', slug: '', author: '', status: 'draft', content: '', excerpt: '' }); setIsFormVisible(true); }}>
                        <Plus className="h-4 w-4 mr-2" />Nouvel Article
                    </Button>
                )}
            </div>

            <AnimatePresence>
                {isFormVisible && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                        <Card>
                            <CardHeader><CardTitle>{selectedPost ? "Modifier l'Article" : "Créer un Nouvel Article"}</CardTitle></CardHeader>
                            <CardContent>
                                <Form {...form}>
                                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                        <div className="grid md:grid-cols-3 gap-6">
                                            <FormField control={form.control} name="title" render={({ field }) => (
                                                <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="slug" render={({ field }) => (
                                                <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                            <FormField control={form.control} name="author" render={({ field }) => (
                                                <FormItem><FormLabel>Auteur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                            )} />
                                        </div>
                                        <FormField control={form.control} name="content" render={({ field }) => (
                                            <FormItem><FormLabel>Contenu Principal</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>
                                        )} />
                                        <div className="flex justify-between items-center">
                                            <FormField control={form.control} name="status" render={({ field }) => (
                                                <FormItem className="flex items-center gap-2"><FormLabel>Statut:</FormLabel><FormControl>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
                                                    <SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="published">Publié</SelectItem></SelectContent></Select>
                                                </FormControl><FormMessage /></FormItem>
                                            )} />
                                            <div className="flex gap-2">
                                                <Dialog>
                                                    <DialogTrigger asChild><Button type="button" variant="outline"><Eye className="h-4 w-4 mr-2" />Prévisualiser</Button></DialogTrigger>
                                                    <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                                                        <DialogHeader><DialogTitle>Prévisualisation de l'Article</DialogTitle></DialogHeader>
                                                        <div className="flex-1 overflow-y-auto prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: watchContent || "" }} />
                                                    </DialogContent>
                                                </Dialog>
                                                <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
                                                <Button type="submit">{selectedPost ? "Mettre à jour" : "Publier"}</Button>
                                            </div>
                                        </div>
                                    </form>
                                </Form>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>

            <Card>
                <CardHeader><CardTitle>Articles de Blog</CardTitle><CardDescription>Gérez tous vos articles de blog.</CardDescription></CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {posts.map(post => (
                            <div key={post.id} className="border rounded-lg p-4">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="mb-2">{post.status}</Badge>
                                        <h3 className="font-semibold text-lg">{post.title}</h3>
                                        <p className="text-sm text-muted-foreground">par {post.author} | Slug: /{post.slug}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(post)}><Edit className="h-4 w-4 mr-1" />Modifier</Button>
                                        <Button size="sm" variant="destructive" onClick={() => handleDelete(post.id!)}><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
