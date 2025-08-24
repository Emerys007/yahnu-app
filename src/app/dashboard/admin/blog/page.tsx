
"use client"

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { Plus, Newspaper, Edit, Trash2, Eye, Loader2, Upload } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast';
import { db, storage } from '@/lib/firebase';
import { collection, addDoc, getDocs, updateDoc, deleteDoc, doc, serverTimestamp, query, orderBy, DocumentData } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import Image from 'next/image';

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Le titre est requis."),
  slug: z.string().min(1, "Le slug est requis.").regex(/^[a-z0-9-]+$/, "Le slug ne peut contenir que des lettres minuscules, des chiffres et des traits d'union."),
  author: z.string().min(1, "L'auteur est requis."),
  status: z.enum(['draft', 'published']),
  imageUrl: z.string().url({ message: "Veuillez entrer une URL valide." }).optional().or(z.literal('')),
  content: z.string().min(100, "Le contenu doit comporter au moins 100 caractères."),
  excerpt: z.string().max(200, "L'extrait ne doit pas dépasser 200 caractères.").optional(),
});

type Post = z.infer<typeof postSchema>;

export default function BlogManagementPage() {
    const [posts, setPosts] = useState<Post[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedPost, setSelectedPost] = useState<Post | null>(null);
    const [isFormVisible, setIsFormVisible] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const { toast } = useToast();

    const form = useForm<Post>({
        resolver: zodResolver(postSchema),
        defaultValues: { status: 'draft', imageUrl: '' }
    });

    useEffect(() => {
        const fetchPosts = async () => {
            setIsLoading(true);
            const postsCollection = collection(db, "blogPosts");
            const q = query(postsCollection, orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const postsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postsData);
            setIsLoading(false);
        };
        fetchPosts();
    }, []);

    const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setImageFile(file);
            setImagePreview(URL.createObjectURL(file));
            form.setValue('imageUrl', ''); // Clear URL if a file is chosen
        }
    };
    
    const onSubmit = async (data: Post) => {
        let finalImageUrl = data.imageUrl;

        if (imageFile) {
            try {
                const storageRef = ref(storage, `blogImages/${Date.now()}_${imageFile.name}`);
                const uploadTask = await uploadBytesResumable(storageRef, imageFile);
                finalImageUrl = await getDownloadURL(uploadTask.ref);
            } catch (error) {
                toast({ title: "Erreur de téléversement", description: "Impossible de téléverser l'image.", variant: "destructive" });
                return;
            }
        }

        const postData = { ...data, imageUrl: finalImageUrl };

        try {
            if (selectedPost) {
                const postDoc = doc(db, "blogPosts", selectedPost.id!);
                await updateDoc(postDoc, { ...postData, updatedAt: serverTimestamp() });
                setPosts(posts.map(p => p.id === selectedPost.id ? { ...postData, id: p.id } : p));
                toast({ title: "Succès", description: "Article de blog mis à jour." });
            } else {
                const docRef = await addDoc(collection(db, "blogPosts"), { ...postData, createdAt: serverTimestamp() });
                setPosts([{ ...postData, id: docRef.id }, ...posts]);
                toast({ title: "Succès", description: "Article de blog créé." });
            }
            resetForm();
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de sauvegarder l'article.", variant: "destructive" });
        }
    };
    
    const handleEdit = (post: Post) => {
        setSelectedPost(post);
        form.reset(post);
        setImagePreview(post.imageUrl || null);
        setImageFile(null);
        setIsFormVisible(true);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteDoc(doc(db, "blogPosts", id));
            setPosts(posts.filter(p => p.id !== id));
            toast({ title: "Succès", description: "Article de blog supprimé." });
        } catch (error) {
            toast({ title: "Erreur", description: "Impossible de supprimer l'article.", variant: "destructive" });
        }
    };

    const resetForm = () => {
        setSelectedPost(null);
        form.reset({ title: '', slug: '', author: '', status: 'draft', content: '', excerpt: '', imageUrl: '' });
        setIsFormVisible(false);
        setImageFile(null);
        setImagePreview(null);
    };

    const watchContent = form.watch('content');
    const watchImageUrl = form.watch('imageUrl');
    const displayImage = imagePreview || watchImageUrl;
    
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
                    <Button onClick={() => { setSelectedPost(null); form.reset({ title: '', slug: '', author: '', status: 'draft', content: '', excerpt: '', imageUrl: '' }); setIsFormVisible(true); }}>
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
                                        <div className="grid md:grid-cols-2 gap-6">
                                            <div className="space-y-6">
                                                <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="slug" render={({ field }) => (<FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name="author" render={({ field }) => (<FormItem><FormLabel>Auteur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            </div>
                                            <div>
                                                <FormLabel>Image à la une</FormLabel>
                                                <Tabs defaultValue="upload" className="w-full mt-2">
                                                    <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="upload">Téléverser</TabsTrigger><TabsTrigger value="url">URL</TabsTrigger></TabsList>
                                                    <TabsContent value="upload">
                                                        <Card className="mt-2">
                                                            <CardContent className="p-4">
                                                                <Button asChild variant="outline" className="w-full"><label htmlFor="image-upload"><Upload className="mr-2 h-4 w-4" />Choisir un fichier</label></Button>
                                                                <input id="image-upload" type="file" className="sr-only" accept="image/*" onChange={handleImageChange} />
                                                            </CardContent>
                                                        </Card>
                                                    </TabsContent>
                                                    <TabsContent value="url">
                                                         <Card className="mt-2">
                                                            <CardContent className="p-4">
                                                                <FormField control={form.control} name="imageUrl" render={({ field }) => (<FormItem><FormControl><Input {...field} placeholder="https://..." onChange={(e) => { field.onChange(e); setImagePreview(null); setImageFile(null); }} /></FormControl><FormMessage /></FormItem>)} />
                                                            </CardContent>
                                                        </Card>
                                                    </TabsContent>
                                                </Tabs>
                                                <div className="w-full h-32 mt-4 relative rounded-lg overflow-hidden border bg-muted">
                                                    {displayImage ? <Image src={displayImage} alt="Aperçu" fill className="object-cover" /> : <div className="flex items-center justify-center h-full text-muted-foreground text-sm">Aperçu</div>}
                                                </div>
                                            </div>
                                        </div>
                                        <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>Contenu Principal</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <div className="flex justify-between items-center">
                                            <FormField control={form.control} name="status" render={({ field }) => (<FormItem className="flex items-center gap-2"><FormLabel>Statut:</FormLabel><FormControl><Select onValueChange={field.onChange} defaultValue={field.value}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="published">Publié</SelectItem></SelectContent></Select></FormControl><FormMessage /></FormItem>)} />
                                            <div className="flex gap-2">
                                                <Dialog><DialogTrigger asChild><Button type="button" variant="outline"><Eye className="h-4 w-4 mr-2" />Prévisualiser</Button></DialogTrigger><DialogContent className="max-w-4xl h-[90vh] flex flex-col"><DialogHeader><DialogTitle>Prévisualisation de l'Article</DialogTitle></DialogHeader><div className="flex-1 overflow-y-auto prose max-w-none p-4" dangerouslySetInnerHTML={{ __html: watchContent || "" }} /></DialogContent></Dialog>
                                                <Button type="button" variant="ghost" onClick={resetForm}>Annuler</Button>
                                                <Button type="submit" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedPost ? "Mettre à jour" : "Publier"}</Button>
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
                    {isLoading ? <div className="flex justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="space-y-4">
                        {posts.map(post => (<div key={post.id} className="border rounded-lg p-4"><div className="flex justify-between items-start"><div><Badge variant={post.status === 'published' ? 'default' : 'secondary'} className="mb-2">{post.status}</Badge><h3 className="font-semibold text-lg">{post.title}</h3><p className="text-sm text-muted-foreground">par {post.author} | Slug: /{post.slug}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => handleEdit(post)}><Edit className="h-4 w-4 mr-1" />Modifier</Button><Button size="sm" variant="destructive" onClick={() => handleDelete(post.id!)}><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button></div></div></div>))}
                    </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
