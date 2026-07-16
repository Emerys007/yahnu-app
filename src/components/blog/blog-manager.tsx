'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  AlertCircle,
  CheckCircle2,
  Edit3,
  ExternalLink,
  Eye,
  FileText,
  ImagePlus,
  Loader2,
  Newspaper,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  Upload,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { BlogCoverImage } from '@/components/blog/blog-cover-image';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { SafeRichText } from '@/components/ui/safe-rich-text';
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
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ApiClientError, apiFetch } from '@/lib/api-client';
import {
  BLOG_SLUG_PATTERN,
  blogHtmlToPlainText,
  isSafeBlogImageUrl,
  slugifyBlogTitle,
  type BlogPost,
} from '@/lib/blog';

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const acceptedImageTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const editorSchema = z.object({
  title: z.string().trim().min(3, 'Le titre doit comporter au moins 3 caractères.').max(240),
  slug: z.string().trim().min(3, 'Le slug doit comporter au moins 3 caractères.').max(120)
    .regex(BLOG_SLUG_PATTERN, 'Utilisez uniquement des lettres minuscules, des chiffres et des tirets.'),
  author: z.string().trim().min(2, 'Le nom de l’auteur est requis.').max(160),
  excerpt: z.string().trim().min(10, 'Ajoutez un résumé d’au moins 10 caractères.').max(500, 'Le résumé ne doit pas dépasser 500 caractères.'),
  contentHtml: z.string().min(1, 'Le contenu est requis.').max(200_000)
    .refine((value) => blogHtmlToPlainText(value).length >= 50, 'Le contenu doit comporter au moins 50 caractères.'),
  status: z.enum(['draft', 'published']),
  imageUrl: z.string().trim().max(2_048).refine(isSafeBlogImageUrl, 'Utilisez une URL HTTPS ou téléversez une image.'),
});

type EditorValues = z.infer<typeof editorSchema>;
type BlogEnvelope = { data: { posts: BlogPost[]; hasMore: boolean } };
type BlogPostEnvelope = { data: { post: BlogPost } };
type MediaEnvelope = {
  data: {
    media: { url: string };
    reused: boolean;
  };
};

const blankPost: EditorValues = {
  title: '',
  slug: '',
  author: 'Équipe Yahnu',
  excerpt: '',
  contentHtml: '',
  status: 'draft',
  imageUrl: '',
};

const dateFormatter = new Intl.DateTimeFormat('fr-CI', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Africa/Abidjan',
});

function errorMessage(error: unknown, fallback: string) {
  if (error instanceof ApiClientError) {
    if (error.status === 401) return 'Votre session a expiré. Reconnectez-vous pour continuer.';
    if (error.status === 403) return 'Votre compte ne dispose pas de cet accès éditorial.';
    if (error.status === 409) return 'Un article utilise déjà ce slug. Choisissez-en un autre.';
    if (error.status === 413) return 'Le contenu ou l’image dépasse la taille autorisée.';
    if (error.status === 422) return 'Certaines informations doivent être corrigées avant l’enregistrement.';
  }
  return fallback;
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.set('file', file);
  const response = await fetch('/api/media', {
    method: 'POST',
    body: formData,
    credentials: 'same-origin',
    headers: { Accept: 'application/json' },
  });
  const payload = await response.json().catch(() => ({})) as MediaEnvelope & { error?: { message?: string } };
  if (!response.ok) throw new Error(payload.error?.message ?? 'Le téléversement a échoué.');
  return payload.data.media.url;
}

export function BlogManager() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [slugWasEdited, setSlugWasEdited] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const form = useForm<EditorValues>({
    resolver: zodResolver(editorSchema),
    defaultValues: blankPost,
  });

  const loadPosts = useCallback(async (offset = 0) => {
    const isFirstPage = offset === 0;
    if (isFirstPage) {
      setIsLoading(true);
      setLoadError(null);
      setHasMore(false);
    } else {
      setIsLoadingMore(true);
    }
    try {
      const payload = await apiFetch<BlogEnvelope>(`/api/blog?scope=all&limit=100&offset=${offset}`);
      setPosts((current) => {
        if (isFirstPage) return payload.data.posts;
        const existingIds = new Set(current.map((post) => post.id));
        return [...current, ...payload.data.posts.filter((post) => !existingIds.has(post.id))];
      });
      setHasMore(payload.data.hasMore);
    } catch (error) {
      const message = errorMessage(error, 'Impossible de charger les articles.');
      if (isFirstPage) {
        setLoadError(message);
      } else {
        toast({ title: 'Chargement impossible', description: message, variant: 'destructive' });
      }
    } finally {
      if (isFirstPage) setIsLoading(false);
      else setIsLoadingMore(false);
    }
  }, [toast]);

  useEffect(() => {
    void loadPosts();
  }, [loadPosts]);

  useEffect(() => () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const filteredPosts = useMemo(() => {
    const needle = search.trim().toLocaleLowerCase('fr');
    if (!needle) return posts;
    return posts.filter((post) => [post.title, post.author, post.slug, post.excerpt]
      .some((value) => value.toLocaleLowerCase('fr').includes(needle)));
  }, [posts, search]);

  const counts = useMemo(() => ({
    published: posts.filter((post) => post.status === 'published').length,
    drafts: posts.filter((post) => post.status === 'draft').length,
  }), [posts]);

  const clearImageSelection = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const closeEditor = () => {
    setIsEditorOpen(false);
    setSelectedPost(null);
    setSlugWasEdited(false);
    clearImageSelection();
    form.reset(blankPost);
  };

  const startCreate = () => {
    setSelectedPost(null);
    setSlugWasEdited(false);
    clearImageSelection();
    form.reset(blankPost);
    setIsEditorOpen(true);
  };

  const startEdit = async (summary: BlogPost) => {
    setEditingId(summary.id);
    try {
      // List endpoints intentionally omit article bodies. Always load the full
      // record before populating an editable form so a save cannot erase it.
      const payload = await apiFetch<BlogPostEnvelope>(`/api/blog/${encodeURIComponent(summary.id)}?scope=all`);
      const post = payload.data.post;
      setSelectedPost(post);
      setSlugWasEdited(true);
      clearImageSelection();
      form.reset({
        title: post.title,
        slug: post.slug,
        author: post.author,
        excerpt: post.excerpt,
        contentHtml: post.contentHtml,
        status: post.status,
        imageUrl: post.imageUrl ?? '',
      });
      setIsEditorOpen(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      toast({
        title: 'Ouverture impossible',
        description: errorMessage(error, 'Impossible de charger le contenu de cet article.'),
        variant: 'destructive',
      });
    } finally {
      setEditingId(null);
    }
  };

  const chooseImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!acceptedImageTypes.has(file.type)) {
      toast({ title: 'Format non accepté', description: 'Choisissez une image JPEG, PNG, WebP ou GIF.', variant: 'destructive' });
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast({ title: 'Image trop volumineuse', description: 'La taille maximale est de 5 Mo.', variant: 'destructive' });
      return;
    }
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    form.setValue('imageUrl', '', { shouldValidate: true });
  };

  const submitPost = async (values: EditorValues) => {
    try {
      setIsUploading(Boolean(imageFile));
      const imageUrl = imageFile ? await uploadImage(imageFile) : (values.imageUrl || null);
      const body = JSON.stringify({ ...values, imageUrl });
      const payload = selectedPost
        ? await apiFetch<BlogPostEnvelope>(`/api/blog/${encodeURIComponent(selectedPost.id)}`, { method: 'PATCH', body })
        : await apiFetch<BlogPostEnvelope>('/api/blog', { method: 'POST', body });

      const saved = payload.data.post;
      setPosts((current) => selectedPost
        ? current.map((post) => post.id === saved.id ? saved : post)
        : [saved, ...current]);
      toast({
        title: selectedPost ? 'Article mis à jour' : 'Article créé',
        description: saved.status === 'published'
          ? 'L’article est visible sur le blog public.'
          : 'Le brouillon a été enregistré.',
      });
      closeEditor();
    } catch (error) {
      toast({
        title: 'Enregistrement impossible',
        description: errorMessage(error, 'Vérifiez les informations et réessayez.'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const deletePost = async (post: BlogPost) => {
    setDeletingId(post.id);
    try {
      await apiFetch<{ data: { deleted: true } }>(`/api/blog/${encodeURIComponent(post.id)}`, { method: 'DELETE' });
      setPosts((current) => current.filter((candidate) => candidate.id !== post.id));
      if (selectedPost?.id === post.id) closeEditor();
      toast({ title: 'Article supprimé', description: `« ${post.title} » a été supprimé.` });
    } catch (error) {
      toast({ title: 'Suppression impossible', description: errorMessage(error, 'Réessayez dans quelques instants.'), variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const watchedContent = form.watch('contentHtml');
  const watchedTitle = form.watch('title');
  const watchedExcerpt = form.watch('excerpt');
  const watchedImageUrl = form.watch('imageUrl');
  const watchedStatus = form.watch('status');
  const displayedImage = imagePreview ?? watchedImageUrl;
  const isSaving = form.formState.isSubmitting || isUploading;

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-[linear-gradient(135deg,hsl(var(--primary)/0.14),hsl(var(--card))_54%,hsl(var(--accent)/0.16))] p-6 shadow-sm sm:p-8">
        <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full border-[28px] border-primary/10" />
        <div className="relative flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary p-3 text-primary-foreground shadow-sm"><Newspaper className="h-7 w-7" /></div>
          <div>
            <p className="section-kicker mb-3 w-fit">Studio éditorial · Côte d’Ivoire</p>
            <h1 className="font-display text-3xl font-bold tracking-[-0.04em] sm:text-4xl">Les histoires qui font avancer les talents d’ici.</h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted-foreground">Rédigez, prévisualisez et publiez des conseils utiles aux jeunes diplômés, recruteurs et établissements de Côte d’Ivoire.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href="/blog" target="_blank" rel="noopener noreferrer">Voir le blog <ExternalLink className="ml-2 h-4 w-4" /></Link></Button>
          {!isEditorOpen && <Button onClick={startCreate}><Plus className="mr-2 h-4 w-4" /> Nouvel article</Button>}
        </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-primary/10"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-primary/10 p-2"><FileText className="h-5 w-5 text-primary" /></span><div><p className="font-display text-2xl font-bold">{posts.length}</p><p className="text-sm text-muted-foreground">Articles chargés</p></div></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-emerald-500/10 p-2"><CheckCircle2 className="h-5 w-5 text-emerald-700 dark:text-emerald-300" /></span><div><p className="font-display text-2xl font-bold">{counts.published}</p><p className="text-sm text-muted-foreground">Publiés</p></div></CardContent></Card>
        <Card className="border-primary/10"><CardContent className="flex items-center gap-3 p-5"><span className="rounded-xl bg-amber-500/10 p-2"><Edit3 className="h-5 w-5 text-amber-700 dark:text-amber-300" /></span><div><p className="font-display text-2xl font-bold">{counts.drafts}</p><p className="text-sm text-muted-foreground">Brouillons</p></div></CardContent></Card>
      </div>

      {isEditorOpen && (
        <Card className="border-primary/20 shadow-sm">
          <CardHeader className="border-b bg-muted/20">
            <CardTitle>{selectedPost ? 'Modifier l’article' : 'Créer un article'}</CardTitle>
            <CardDescription>Les changements ne sont visibles publiquement que lorsque le statut est « Publié ».</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(submitPost)} className="space-y-7">
                <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
                  <div className="space-y-5">
                    <FormField control={form.control} name="title" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Titre</FormLabel>
                        <FormControl><Input {...field} placeholder="Ex. Réussir son premier entretien au Plateau" onChange={(event) => {
                          field.onChange(event);
                          if (!selectedPost && !slugWasEdited) {
                            form.setValue('slug', slugifyBlogTitle(event.target.value), { shouldValidate: true });
                          }
                        }} /></FormControl>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <div className="grid gap-5 sm:grid-cols-2">
                      <FormField control={form.control} name="slug" render={({ field }) => (
                        <FormItem><FormLabel>Slug</FormLabel><FormControl><div className="flex rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring"><span className="flex items-center border-r bg-muted/40 px-3 text-sm text-muted-foreground">/blog/</span><Input {...field} className="border-0 shadow-none focus-visible:ring-0" onChange={(event) => { setSlugWasEdited(true); field.onChange(event); }} /></div></FormControl><FormMessage /></FormItem>
                      )} />
                      <FormField control={form.control} name="author" render={({ field }) => (
                        <FormItem><FormLabel>Auteur</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )} />
                    </div>
                    <FormField control={form.control} name="excerpt" render={({ field }) => (
                      <FormItem><div className="flex items-center justify-between"><FormLabel>Résumé</FormLabel><span className="text-xs text-muted-foreground">{field.value.length}/500</span></div><FormControl><Textarea {...field} rows={4} placeholder="Expliquez concrètement ce que les talents ivoiriens vont apprendre…" /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>

                  <div className="space-y-3">
                    <FormLabel>Image à la une</FormLabel>
                    <BlogCoverImage src={displayedImage} alt={watchedTitle || 'Aperçu de l’image'} className="h-48 rounded-xl border" />
                    <Tabs defaultValue="upload">
                      <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="upload">Téléverser</TabsTrigger><TabsTrigger value="url">URL HTTPS</TabsTrigger></TabsList>
                      <TabsContent value="upload" className="mt-3">
                        <Button type="button" variant="outline" className="w-full" asChild>
                          <label htmlFor="blog-image-upload" className="cursor-pointer"><Upload className="mr-2 h-4 w-4" /> {imageFile ? 'Changer l’image' : 'Choisir une image'}</label>
                        </Button>
                        <input id="blog-image-upload" type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,image/gif" onChange={chooseImage} />
                        <p className="mt-2 text-xs text-muted-foreground">JPEG, PNG, WebP ou GIF. 5 Mo maximum.</p>
                        {imageFile && <p className="mt-2 truncate text-sm font-medium"><ImagePlus className="mr-1 inline h-4 w-4 text-primary" />{imageFile.name}</p>}
                      </TabsContent>
                      <TabsContent value="url" className="mt-3">
                        <FormField control={form.control} name="imageUrl" render={({ field }) => (
                          <FormItem><FormControl><Input {...field} type="url" placeholder="https://…" onChange={(event) => { clearImageSelection(); field.onChange(event); }} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </TabsContent>
                    </Tabs>
                  </div>
                </div>

                <FormField control={form.control} name="contentHtml" render={({ field }) => (
                  <FormItem><div className="flex items-center justify-between"><FormLabel>Contenu</FormLabel><span className="text-xs text-muted-foreground">{blogHtmlToPlainText(field.value).length} caractères</span></div><FormControl><RichTextEditor {...field} placeholder="Rédigez un conseil concret, humain et ancré dans les réalités de Côte d’Ivoire…" /></FormControl><FormMessage /></FormItem>
                )} />

                <div className="flex flex-col justify-between gap-4 border-t pt-6 sm:flex-row sm:items-end">
                  <FormField control={form.control} name="status" render={({ field }) => (
                    <FormItem className="w-full sm:w-56"><FormLabel>Statut</FormLabel><Select value={field.value} onValueChange={field.onChange}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="published">Publié</SelectItem></SelectContent></Select><FormMessage /></FormItem>
                  )} />
                  <div className="flex flex-wrap justify-end gap-2">
                    <Dialog>
                      <DialogTrigger asChild><Button type="button" variant="outline"><Eye className="mr-2 h-4 w-4" /> Prévisualiser</Button></DialogTrigger>
                      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                        <DialogHeader><DialogTitle>Aperçu de l’article</DialogTitle><DialogDescription>Cet aperçu utilise le même filtrage de contenu que le blog public.</DialogDescription></DialogHeader>
                        <BlogCoverImage src={displayedImage} alt={watchedTitle || 'Image de l’article'} className="mt-3 aspect-[16/7] rounded-xl" />
                        <div className="px-1 py-4"><Badge variant={watchedStatus === 'published' ? 'default' : 'secondary'}>{watchedStatus === 'published' ? 'Publié' : 'Brouillon'}</Badge><h2 className="mt-4 text-3xl font-bold">{watchedTitle || 'Titre de l’article'}</h2><p className="mt-3 text-muted-foreground">{watchedExcerpt || 'Le résumé apparaîtra ici.'}</p><SafeRichText html={watchedContent} className="mt-8" /></div>
                      </DialogContent>
                    </Dialog>
                    <Button type="button" variant="ghost" onClick={closeEditor} disabled={isSaving}>Annuler</Button>
                    <Button type="submit" disabled={isSaving}>{isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}{selectedPost ? 'Enregistrer' : watchedStatus === 'published' ? 'Publier' : 'Créer le brouillon'}</Button>
                  </div>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="gap-4 border-b sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>Articles</CardTitle><CardDescription>Les articles sont chargés par lots de 100.</CardDescription></div>
          <div className="flex w-full gap-2 sm:w-auto">
            <div className="relative flex-1 sm:w-72"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" className="pl-9" /></div>
            <Button variant="outline" size="icon" onClick={() => void loadPosts()} disabled={isLoading || isLoadingMore} aria-label="Actualiser"><RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-muted-foreground" aria-live="polite"><Loader2 className="h-7 w-7 animate-spin text-primary" /><span>Chargement des articles…</span></div>
          ) : loadError ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center" role="alert"><AlertCircle className="h-8 w-8 text-destructive" /><p className="mt-3 font-semibold">Chargement impossible</p><p className="mt-1 max-w-md text-sm text-muted-foreground">{loadError}</p><Button variant="outline" className="mt-5" onClick={() => void loadPosts()}>Réessayer</Button></div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex min-h-64 flex-col items-center justify-center p-8 text-center"><div className="rounded-2xl bg-muted p-4"><Newspaper className="h-8 w-8 text-muted-foreground" /></div><p className="mt-4 font-semibold">{posts.length ? 'Aucun résultat' : 'Aucun article pour le moment'}</p><p className="mt-1 text-sm text-muted-foreground">{posts.length ? 'Essayez une autre recherche.' : 'Créez votre premier article pour commencer.'}</p>{!posts.length && <Button className="mt-5" onClick={startCreate}><Plus className="mr-2 h-4 w-4" /> Créer un article</Button>}</div>
          ) : (
            <>
            <div className="divide-y">
              {filteredPosts.map((post) => (
                <div key={post.id} className="grid gap-4 p-5 transition-colors hover:bg-muted/20 md:grid-cols-[112px_1fr_auto] md:items-center">
                  <BlogCoverImage src={post.imageUrl} alt="" className="h-20 rounded-lg" />
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2"><Badge variant={post.status === 'published' ? 'default' : 'secondary'}>{post.status === 'published' ? 'Publié' : 'Brouillon'}</Badge><span className="text-xs text-muted-foreground">/blog/{post.slug}</span></div>
                    <h3 className="mt-2 truncate font-semibold">{post.title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{post.author} · Modifié le {dateFormatter.format(new Date(post.updatedAt))}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 md:justify-end">
                    {post.status === 'published' && <Button asChild size="sm" variant="ghost"><Link href={`/blog/${post.slug}`} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1.5 h-4 w-4" /> Voir</Link></Button>}
                    <Button size="sm" variant="outline" onClick={() => void startEdit(post)} disabled={editingId === post.id}>{editingId === post.id ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Edit3 className="mr-1.5 h-4 w-4" />}{editingId === post.id ? 'Ouverture…' : 'Modifier'}</Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button size="sm" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={deletingId === post.id}><Trash2 className="mr-1.5 h-4 w-4" /> Supprimer</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader><AlertDialogTitle>Supprimer cet article ?</AlertDialogTitle><AlertDialogDescription>« {post.title} » sera définitivement supprimé. Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                        <AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => void deletePost(post)}>Supprimer définitivement</AlertDialogAction></AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center border-t p-5">
                <Button variant="outline" onClick={() => void loadPosts(posts.length)} disabled={isLoadingMore}>
                  {isLoadingMore && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Charger 100 articles supplémentaires
                </Button>
              </div>
            )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
