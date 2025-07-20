
"use client"

import React, { useState, useEffect } from "react"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Newspaper, PlusCircle, Edit, Trash2, Loader2, FileText } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/auth-context"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ContentPagesEditor } from "@/features/content/ContentPagesEditor"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

const postSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(3, "Title must be at least 3 characters."),
  slug: z.string().min(3, "Slug must be at least 3 characters.").regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug must be lowercase and contain no spaces."),
  description: z.string().min(10, "Description must be at least 10 characters."),
  imageUrl: z.string().url("Please enter a valid URL for the image."),
  content: z.string().min(50, "Content must be at least 50 characters."),
})

type Post = z.infer<typeof postSchema>;

const PostForm = ({ post, onSave, onFinished }: { post?: Post, onSave: (data: Post) => Promise<void>, onFinished: () => void }) => {
  const { t } = useLocalization()
  const [isSaving, setIsSaving] = useState(false)
  const form = useForm<Post>({
    resolver: zodResolver(postSchema),
    defaultValues: post || {
      title: "",
      slug: "",
      description: "",
      imageUrl: "https://placehold.co/600x400.png",
      content: "",
    },
  })

  const onSubmit = async (values: Post) => {
    setIsSaving(true)
    await onSave(values)
    setIsSaving(false)
    onFinished()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField control={form.control} name="title" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Title')}</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="slug" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Slug')}</FormLabel>
            <FormControl><Input placeholder="e-g-unique-post-slug" {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="description" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Description')}</FormLabel>
            <FormControl><Textarea rows={2} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
         <FormField control={form.control} name="imageUrl" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Image URL')}</FormLabel>
            <FormControl><Input {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <FormField control={form.control} name="content" render={({ field }) => (
          <FormItem>
            <FormLabel>{t('Content')}</FormLabel>
            <FormControl><RichTextEditor placeholder={t('form_message_placeholder')} {...field} /></FormControl>
            <FormMessage />
          </FormItem>
        )} />
        <DialogFooter>
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t('Save Post')}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  )
}

const BlogPostsManager = () => {
    const { t } = useLocalization()
    const { user } = useAuth()
    const { toast } = useToast()
    const [posts, setPosts] = useState<Post[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingPost, setEditingPost] = useState<Post | undefined>(undefined)

    useEffect(() => {
        const postsCol = collection(db, 'posts');
        const unsubscribe = onSnapshot(postsCol, (snapshot) => {
            const postList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
            setPosts(postList);
            setIsLoading(false);
        }, (err) => {
            console.error("Firestore listen failed:", err);
            toast({ title: t("Error"), description: "Failed to load blog posts.", variant: "destructive" });
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [t, toast])

    const handleSavePost = async (data: Post) => {
        try {
        if (editingPost?.id) {
            const postDoc = doc(db, "posts", editingPost.id);
            await updateDoc(postDoc, { ...data, author: user?.name || "Yahnu Admin" });
            toast({ title: t("Post Updated"), description: t("Your changes have been saved.") });
        } else {
            await addDoc(collection(db, "posts"), { 
                ...data, 
                author: user?.name || "Yahnu Admin", 
                date: new Date().toISOString().split('T')[0],
                createdAt: serverTimestamp() 
            });
            toast({ title: t("Post Created"), description: t("Your new blog post is now live.") });
        }
        } catch (error) {
            console.error("Error saving post:", error);
            toast({ title: t("Error"), description: "Failed to save the post.", variant: "destructive" });
        }
    }

    const handleDeletePost = async (postId: string | undefined) => {
        if (!postId) return;
        try {
        await deleteDoc(doc(db, "posts", postId));
        toast({ title: t("Post Deleted"), variant: "destructive" });
        } catch (error) {
            console.error("Error deleting post:", error);
            toast({ title: t("Error"), description: "Failed to delete the post.", variant: "destructive" });
        }
    }

    const openDialog = (post?: Post) => {
        setEditingPost(post);
        setIsDialogOpen(true);
    }

    const closeDialog = () => {
        setIsDialogOpen(false);
        setEditingPost(undefined);
    }
    
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>{t('Blog Posts')}</CardTitle>
                    <CardDescription>{t('A list of all published articles.')}</CardDescription>
                </div>
                 <Button onClick={() => openDialog()}>
                    <PlusCircle className="mr-2 h-4 w-4" />{t('Create Post')}
                </Button>
            </CardHeader>
            <CardContent>
            {isLoading ? (
                <div className="flex justify-center items-center h-64"><Loader2 className="h-16 w-16 animate-spin text-primary" /></div>
            ) : (
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>{t('Title')}</TableHead>
                    <TableHead>{t('Description')}</TableHead>
                    <TableHead className="text-right">{t('Actions')}</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {posts.map(post => (
                    <TableRow key={post.id}>
                        <TableCell className="font-medium">{t(post.title)}</TableCell>
                        <TableCell className="max-w-sm truncate">{t(post.description)}</TableCell>
                        <TableCell className="text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => openDialog(post)}><Edit className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDeletePost(post.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </TableCell>
                    </TableRow>
                    ))}
                    {posts.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="h-24 text-center">{t('No posts found.')}</TableCell></TableRow>
                    )}
                </TableBody>
                </Table>
            )}
            </CardContent>
            <Dialog open={isDialogOpen} onOpenChange={closeDialog}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingPost ? t('Edit Post') : t('Create New Post')}</DialogTitle>
                        <DialogDescription>
                            {editingPost ? t('Make changes to your existing blog post.') : t('Fill out the form to publish a new article.')}
                        </DialogDescription>
                    </DialogHeader>
                    <PostForm post={editingPost} onSave={handleSavePost} onFinished={closeDialog} />
                </DialogContent>
            </Dialog>
        </Card>
    )
}

export default function ContentManagementPage() {
  const { t } = useLocalization()
  
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <Newspaper className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Content Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your platform\'s blog and page content.')}</p>
          </div>
        </div>
      </div>

       <Tabs defaultValue="blog-posts">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="blog-posts" className="gap-2"><Newspaper className="h-4 w-4"/>{t('Blog Posts')}</TabsTrigger>
            <TabsTrigger value="page-content" className="gap-2"><FileText className="h-4 w-4"/>{t('Page Content')}</TabsTrigger>
        </TabsList>
        <TabsContent value="blog-posts" className="mt-4">
            <BlogPostsManager />
        </TabsContent>
        <TabsContent value="page-content" className="mt-4">
            <ContentPagesEditor />
        </TabsContent>
        </Tabs>
    </div>
  )
}
