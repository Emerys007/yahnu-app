
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { BookOpen, Plus, Edit, Trash2, Search, Filter, Eye, Globe, Lock } from "lucide-react"
import React, { useState, useMemo } from "react"
import { motion } from "framer-motion"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { RichTextEditor } from "@/components/ui/rich-text-editor"

type Article = {
  id: string;
  title: string;
  content: string;
  category: string;
  visibility: 'public' | 'private';
  lastUpdated: string;
  views: number;
  status: 'published' | 'draft';
};

const articleSchema = z.object({
  title: z.string().min(3, "Le titre doit comporter au moins 3 caractères."),
  content: z.string().min(50, "Le contenu doit comporter au moins 50 caractères."),
  category: z.string().min(1, "La catégorie est requise."),
  visibility: z.enum(['public', 'private']),
});

const initialArticles: Article[] = [
    { 
        id: '1', 
        title: "Comment créer votre profil de diplômé", 
        content: "<h3>Étape 1: Inscription</h3><p>Commencez par vous inscrire en tant que 'Diplômé'. Vous devrez fournir votre prénom, nom, adresse e-mail et choisir votre école dans la liste des institutions partenaires. Assurez-vous d'utiliser une adresse e-mail valide.</p><h3>Étape 2: Remplir les informations personnelles</h3><p>Une fois inscrit, accédez à votre tableau de bord et cliquez sur 'Profil'. Remplissez les informations de base comme votre numéro de téléphone et un titre professionnel (ex: 'Développeur Frontend Junior').</p><h3>Étape 3: Ajouter votre formation et expérience</h3><p>C'est la partie la plus importante. Détaillez vos diplômes, en précisant le domaine d'études et l'année d'obtention. Décrivez vos expériences professionnelles, y compris les stages, en mettant l'accent sur vos responsabilités et vos réalisations.</p><h3>Étape 4: Mettre en avant vos compétences</h3><p>Énumérez toutes vos compétences pertinentes, qu'elles soient techniques (ex: React, Python, Excel) ou non techniques (ex: Gestion de projet, Communication). Séparez-les par des virgules. Pour valider vos compétences, passez nos évaluations dans l'onglet 'Certifications'.</p><p><strong>Astuce:</strong> Utilisez la fonction 'Remplir avec le CV' pour accélérer le processus, mais vérifiez toujours les informations extraites par notre IA !</p>", 
        category: "Démarrage", 
        visibility: "public", 
        lastUpdated: "2024-01-15", 
        views: 1234, 
        status: "published" 
    },
    { 
        id: '2', 
        title: "Processus d'enregistrement d'entreprise", 
        content: "<h3>Étape 1: Créer un compte</h3><p>Sur la page d'inscription, sélectionnez 'Représentant(e) d'entreprise'. Vous devrez fournir le nom de votre entreprise, votre nom en tant que contact, votre secteur d'activité, votre e-mail et un mot de passe.</p><h3>Étape 2: Approbation du compte</h3><p>Après l'inscription, votre compte sera 'en attente'. L'équipe administrative de Yahnu examinera votre demande. Ce processus garantit la légitimité des entreprises sur notre plateforme. Vous recevrez une notification par e-mail une fois votre compte approuvé.</p><h3>Étape 3: Compléter le profil de l'entreprise</h3><p>Une fois approuvé, connectez-vous et allez dans 'Profil de l'entreprise'. Ajoutez votre logo, une description détaillée de votre culture, et d'autres informations pertinentes pour attirer les meilleurs talents.</p><h3>Étape 4: Publier des offres</h3><p>Vous pouvez maintenant commencer à publier des offres d'emploi via l'onglet 'Offres d'emploi' de votre tableau de bord.</p>", 
        category: "Guide entreprise", 
        visibility: "public", 
        lastUpdated: "2024-01-12", 
        views: 856, 
        status: "published" 
    },
    { 
        id: '3', 
        title: "Résolution des problèmes de connexion", 
        content: "<h3>Mot de passe oublié</h3><p>Si vous avez oublié votre mot de passe, cliquez sur 'Mot de passe oublié ?' sur la page de connexion. Entrez votre adresse e-mail et nous vous enverrons un lien pour le réinitialiser.</p><h3>Compte bloqué</h3><p>Pour des raisons de sécurité, votre compte peut être temporairement bloqué après plusieurs tentatives de connexion infructueuses. Veuillez utiliser la fonction de réinitialisation du mot de passe ou attendre un peu avant de réessayer.</p><h3>Problèmes avec Google Sign-In</h3><p>Assurez-vous que les pop-ups sont autorisés pour notre site. Si votre compte Google est associé à une autre adresse e-mail que celle que vous avez utilisée pour vous inscrire, la connexion peut échouer.</p><h3>Compte en attente ou suspendu</h3><p>Si vous recevez un message indiquant que votre compte est en attente ou suspendu, cela signifie qu'il n'a pas encore été approuvé ou qu'il a été désactivé. Veuillez contacter le support si vous pensez qu'il s'agit d'une erreur.</p>", 
        category: "Support technique", 
        visibility: "public", 
        lastUpdated: "2024-01-10", 
        views: 432, 
        status: "draft" 
    },
    { 
        id: '4', 
        title: "Avantages du partenariat scolaire", 
        content: "<h3>Accès direct aux entreprises</h3><p>En tant qu'école partenaire, vous pouvez facilement établir des relations avec des entreprises de premier plan à la recherche de vos diplômés.</p><h3>Suivi des diplômés</h3><p>Notre tableau de bord analytique vous donne un aperçu du taux de placement de vos diplômés, des secteurs qui les recrutent et des entreprises les plus populaires, vous aidant à affiner vos programmes académiques.</p><h3>Gestion des diplômés</h3><p>Gérez facilement les comptes de vos diplômés, vérifiez leurs diplômes pour ajouter une couche de confiance pour les recruteurs et communiquez avec eux via des messages groupés.</p><h3>Organisation d'événements</h3><p>Organisez vos propres salons de l'emploi virtuels, ateliers et webinaires directement sur la plateforme pour connecter vos étudiants aux opportunités.</p>", 
        category: "Guide école", 
        visibility: "private", 
        lastUpdated: "2024-01-08", 
        views: 123, 
        status: "published" 
    }
];

const ArticleForm = ({ article, onSave, onCancel }: { article: Partial<Article> | null, onSave: (data: z.infer<typeof articleSchema>) => void, onCancel: () => void }) => {
    const form = useForm<z.infer<typeof articleSchema>>({
        resolver: zodResolver(articleSchema),
        defaultValues: {
            title: article?.title || '',
            content: article?.content || '',
            category: article?.category || 'Démarrage',
            visibility: article?.visibility || 'public',
        }
    });

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSave)} className="space-y-4">
                <FormField name="title" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <FormField name="content" control={form.control} render={({ field }) => (
                    <FormItem><FormLabel>Contenu</FormLabel><FormControl><RichTextEditor placeholder="Rédigez votre article ici..." {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                 <div className="grid grid-cols-2 gap-4">
                    <FormField name="category" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Catégorie</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="Démarrage">Démarrage</SelectItem>
                                <SelectItem value="Guide entreprise">Guide entreprise</SelectItem>
                                <SelectItem value="Support technique">Support technique</SelectItem>
                                <SelectItem value="Guide école">Guide école</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                     <FormField name="visibility" control={form.control} render={({ field }) => (
                        <FormItem><FormLabel>Visibilité</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="public">Public</SelectItem>
                                <SelectItem value="private">Privé (Interne)</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                    )} />
                </div>
                 <DialogFooter>
                    <Button type="button" variant="outline" onClick={onCancel}>Annuler</Button>
                    <Button type="submit">Sauvegarder</Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

export default function KnowledgeBaseEditorPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [articles, setArticles] = useState<Article[]>(initialArticles);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Article | null>(null);
    const [articleToDelete, setArticleToDelete] = useState<string | null>(null);
    const [articleToView, setArticleToView] = useState<Article | null>(null);
    const [filters, setFilters] = useState<{ category: string, visibility: string }>({ category: 'all', visibility: 'all' });

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const searchMatch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                article.category.toLowerCase().includes(searchTerm.toLowerCase());
            const categoryMatch = filters.category === 'all' || article.category === filters.category;
            const visibilityMatch = filters.visibility === 'all' || article.visibility === filters.visibility;
            return searchMatch && categoryMatch && visibilityMatch;
        });
    }, [articles, searchTerm, filters]);
    
    const handleCreateClick = () => {
        setEditingArticle(null);
        setIsDialogOpen(true);
    };

    const handleEditClick = (article: Article) => {
        setEditingArticle(article);
        setIsDialogOpen(true);
    };

    const handleSave = (data: z.infer<typeof articleSchema>) => {
        const newArticleData = {
            ...data,
            lastUpdated: new Date().toISOString().split('T')[0],
            status: 'published' as const
        };

        if (editingArticle) {
            setArticles(articles.map(a => a.id === editingArticle.id ? { ...a, ...newArticleData } : a));
            toast({ title: "Article mis à jour", description: "L'article a été modifié avec succès." });
        } else {
            const newArticle: Article = {
                ...newArticleData,
                id: Date.now().toString(),
                views: 0,
            };
            setArticles([newArticle, ...articles]);
            toast({ title: "Article créé", description: "Le nouvel article a été ajouté à la base de connaissances." });
        }
        setIsDialogOpen(false);
        setEditingArticle(null);
    };

    const handleDelete = () => {
        if (articleToDelete) {
            setArticles(articles.filter(a => a.id !== articleToDelete));
            toast({ title: "Article supprimé", variant: "destructive" });
            setArticleToDelete(null);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }

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
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Éditeur de la Base de Connaissances</h1>
                        <p className="text-muted-foreground mt-1">Créez et gérez les articles du centre d'aide.</p>
                    </div>
                </div>
                <Button onClick={handleCreateClick}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un article
                </Button>
            </div>
            
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input placeholder="Rechercher des articles..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
                </div>
                <Popover>
                    <PopoverTrigger asChild>
                         <Button variant="outline"><Filter className="h-4 w-4 mr-2" />Filtrer</Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-4 space-y-4">
                        <div className="space-y-2">
                            <Label>Catégorie</Label>
                             <Select value={filters.category} onValueChange={(v) => setFilters(f => ({ ...f, category: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    <SelectItem value="Démarrage">Démarrage</SelectItem>
                                    <SelectItem value="Guide entreprise">Guide entreprise</SelectItem>
                                    <SelectItem value="Support technique">Support technique</SelectItem>
                                    <SelectItem value="Guide école">Guide école</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                             <Label>Visibilité</Label>
                             <Select value={filters.visibility} onValueChange={(v) => setFilters(f => ({ ...f, visibility: v }))}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Toutes</SelectItem>
                                    <SelectItem value="public">Public</SelectItem>
                                    <SelectItem value="private">Privé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </PopoverContent>
                </Popover>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Base de Connaissances</CardTitle>
                    <CardDescription>Articles d'aide pour les utilisateurs.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-8"><BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" /><h3 className="text-lg font-medium">Aucun article trouvé</h3><p className="text-muted-foreground">Essayez d'ajuster vos termes de recherche ou créez un nouvel article.</p></div>
                        ) : (
                            filteredArticles.map((article) => (
                                <motion.div key={article.id} className="border rounded-lg p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{article.title}</h3>
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>{article.status === 'published' ? 'Publié' : 'Brouillon'}</Badge>
                                                <Badge variant={article.visibility === 'public' ? 'outline' : 'secondary'}>{article.visibility === 'public' ? 'Public' : 'Privé'}</Badge>
                                            </div>
                                            <div className="prose prose-sm max-w-none text-muted-foreground line-clamp-2" dangerouslySetInnerHTML={{ __html: article.content }} />
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                                                <span>Catégorie: {article.category}</span><span>•</span>
                                                <span>Vues: {article.views}</span><span>•</span>
                                                <span>Dernière mise à jour: {formatDate(article.lastUpdated)}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button variant="outline" size="sm" onClick={() => setArticleToView(article)}><Eye className="h-4 w-4 mr-1" />Voir</Button>
                                            <Button variant="outline" size="sm" onClick={() => handleEditClick(article)}><Edit className="h-4 w-4 mr-1" />Modifier</Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="destructive" size="sm" onClick={() => setArticleToDelete(article.id)}><Trash2 className="h-4 w-4 mr-1" />Supprimer</Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
                                                        <AlertDialogDescription>Cette action ne peut être annulée. Cela supprimera définitivement l'article.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel onClick={() => setArticleToDelete(null)}>Annuler</AlertDialogCancel>
                                                        <AlertDialogAction onClick={handleDelete}>Supprimer</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </div>
                                </motion.div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={(open) => !open && setIsDialogOpen(false)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{editingArticle ? "Modifier l'article" : "Créer un nouvel article"}</DialogTitle>
                    </DialogHeader>
                    <ArticleForm article={editingArticle} onSave={handleSave} onCancel={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>

            <Dialog open={!!articleToView} onOpenChange={(open) => !open && setArticleToView(null)}>
                <DialogContent className="max-w-3xl">
                    <DialogHeader>
                        <DialogTitle>{articleToView?.title}</DialogTitle>
                         <DialogDescription className="flex items-center gap-4 text-sm text-muted-foreground pt-2">
                             <Badge variant={articleToView?.visibility === 'public' ? 'outline' : 'secondary'}>{articleToView?.visibility === 'public' ? <Globe className="mr-1 h-3 w-3"/> : <Lock className="mr-1 h-3 w-3" />}{articleToView?.visibility === 'public' ? 'Public' : 'Privé'}</Badge>
                            <span>Catégorie: {articleToView?.category}</span>
                            <span>•</span>
                            <span>Dernière mise à jour: {articleToView && formatDate(articleToView.lastUpdated)}</span>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="prose prose-sm max-w-none py-4" dangerouslySetInnerHTML={{ __html: articleToView?.content || '' }} />
                </DialogContent>
            </Dialog>
        </motion.div>
    );
}
