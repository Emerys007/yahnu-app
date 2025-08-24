
"use client"

import React, { useState, useMemo } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Loader2, PlusCircle, Trash2, Edit, Search, BookText, Newspaper } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Textarea } from "@/components/ui/textarea"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { collection, addDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"

const postSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères."),
  slug: z.string().min(3, "Le slug est requis."),
  author: z.string().min(1, "L'auteur est requis."),
  date: z.string().min(1, "La date est requise."),
  image: z.string().url("Veuillez fournir une URL d'image valide."),
  brief: z.string().min(10, "Un bref résumé est requis."),
  content: z.string().min(50, "Le contenu de l'article est requis."),
});

type Post = z.infer<typeof postSchema>;

const initialPosts: Post[] = [
    {
      slug: 'future-of-work-remote',
      author: 'Auteur du blog',
      date: '2024-07-22',
      image: '/images/Blog/remote-work.jpg',
      title: "L'avenir du travail en Afrique est à distance",
      brief: `Le passage mondial au travail à distance représente une opportunité massive pour la jeunesse talentueuse d'Afrique. Découvrez les tendances, les avantages et les défis.`,
      content: `<p>Contenu complet de l'article...</p>`,
    },
    {
      slug: 'bridging-the-gap',
      author: 'Auteur du blog',
      date: '2024-07-20',
      image: '/images/Blog/Yahnu-Connects-Graduates-with-Industry.jpg',
      title: "Combler le fossé : Comment Yahnu connecte les diplômés à l'industrie",
      brief: `Le "déficit de compétences" est un obstacle majeur pour les diplômés. Découvrez comment Yahnu construit le pont entre l'éducation et le monde professionnel.`,
      content: `<p>Contenu complet de l'article...</p>`,
    },
];

const PostForm = ({ post, onSave, onCancel }: { post?: Post, onSave: (data: Post) => void, onCancel: () => void }) => {
    const form = useForm<Post>({
        resolver: zodResolver(postSchema),
        defaultValues: post || {
            title: "",
            slug: "",
            author: "Auteur du blog",
            date: new Date().toISOString().split("T")[0],
            image: "",
            brief: "",
            content: ""
        }
    });
    
    const slugify = (str: string) => {
        return str
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    const title = form.watch("title");
    React.useEffect(() => {
        if(title && !post?.slug) { // Only auto-slugify on creation
            form.setValue('slug', slugify(title));
        }
    }, [title, form, post?.slug]);

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField control={form.control} name="title" render={({ field }) => (
                    <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="slug" render={({ field }) => (
                    <FormItem><FormLabel>Slug</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-2 gap-4">
                     <FormField control={form.control} name="author" render={({ field }) => (
                        <FormItem><FormLabel>Auteur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                     <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem><FormLabel>Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
                 <FormField control={form.control} name="image" render={({ field }) => (
                    <FormItem><FormLabel>URL de l'image de couverture</FormLabel><FormControl><Input placeholder="https://..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="brief" render={({ field }) => (
                    <FormItem><FormLabel>Résumé</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField control={form.control} name="content" render={({ field }) => (
                    <FormItem><FormLabel>Contenu complet</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onCancel}>Annuler</Button>
                    <Button type="submit">Enregistrer l'article</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function BlogManagementPage() {
    const { toast } = useToast();
    const { user } = useAuth();
    const [searchTerm, setSearchTerm] = useState("");
    const [posts, setPosts] = useState<Post[]>(initialPosts);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<Post | null>(null);

    const filteredPosts = useMemo(() => {
        return posts.filter(post => post.title.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [posts, searchTerm]);
    
    const handleCreateClick = () => {
        setEditingPost(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (post: Post) => {
        setEditingPost(post);
        setIsDialogOpen(true);
    };
    
    const handleDelete = (slug: string) => {
        setPosts(prev => prev.filter(p => p.slug !== slug));
        toast({ title: "Article supprimé", variant: "destructive" });
    }

    const handleSave = async (data: Post) => {
        if (editingPost) {
            setPosts(posts.map(p => p.slug === editingPost.slug ? data : p));
            toast({ title: "Article mis à jour", description: `L'article "${data.title}" a été mis à jour.` });
        } else {
            setPosts([data, ...posts]);
            toast({ title: "Article créé", description: `L'article "${data.title}" a été publié.` });
        }

        try {
            await addDoc(collection(db, "notifications"), {
                recipientRole: 'content_manager',
                text: `Un article de blog a été ${editingPost ? 'mis à jour' : 'créé'}: "${data.title}"`,
                link: `/dashboard/content/blog`,
                type: 'blog',
                createdAt: serverTimestamp(),
                createdBy: user?.uid,
            });
        } catch (e) {
            console.error("Error creating notification for blog post:", e);
        }

        setIsDialogOpen(false);
    };

    return (
        <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
             <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                    <div className="bg-primary/10 p-3 rounded-lg">
                        <Newspaper className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Gestion du Blog</h1>
                        <p className="text-muted-foreground mt-1">Créez, modifiez et gérez les articles du blog.</p>
                    </div>
                </div>
                 <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button onClick={handleCreateClick}>
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Créer un Article
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                        <DialogHeader>
                            <DialogTitle>{editingPost ? "Modifier l'article" : "Créer un nouvel article"}</DialogTitle>
                        </DialogHeader>
                        <PostForm onSave={handleSave} onCancel={() => setIsDialogOpen(false)} post={editingPost || undefined} />
                    </DialogContent>
                 </Dialog>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Articles de Blog</CardTitle>
                    <CardDescription>
                        <div className="flex items-center justify-between">
                            <span>Gérez tous les articles de blog publiés.</span>
                            <div className="relative w-full max-w-xs">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Rechercher par titre..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                            </div>
                        </div>
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                       {filteredPosts.map(post => (
                           <Card key={post.slug} className="p-4 flex items-center justify-between">
                               <div>
                                   <p className="font-semibold">{post.title}</p>
                                   <p className="text-sm text-muted-foreground">Publié le {new Date(post.date).toLocaleDateString('fr-FR')} par {post.author}</p>
                               </div>
                               <div className="flex gap-2">
                                   <Button variant="outline" size="sm" onClick={() => handleEditClick(post)}>
                                       <Edit className="h-4 w-4 mr-1" /> Modifier
                                   </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                           <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-1" /> Supprimer
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Êtes-vous sûr(e) ?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    Cette action est irréversible et supprimera définitivement cet article.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(post.slug)}>Supprimer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                               </div>
                           </Card>
                       ))}
                       {filteredPosts.length === 0 && <p className="text-center text-muted-foreground py-8">Aucun article trouvé.</p>}
                    </div>
                </CardContent>
            </Card>
        </motion.div>
    )
}
