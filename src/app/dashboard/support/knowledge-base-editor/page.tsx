
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Plus, Edit, Trash2, Search, Filter, Eye } from "lucide-react"
import { useState } from "react"

export default function KnowledgeBaseEditorPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [articles, setArticles] = useState([
        {
            id: 1,
            title: "Comment créer votre profil de diplômé",
            content: "Guide étape par étape pour créer un profil de diplômé efficace qui attire les employeurs.",
            category: "Démarrage",
            visibility: "public",
            lastUpdated: "2024-01-15",
            views: 1234,
            status: "published"
        },
        {
            id: 2,
            title: "Processus d'enregistrement d'entreprise",
            content: "Guide complet pour les entreprises s'inscrire et commencer à publier des emplois sur la plateforme.",
            category: "Guide entreprise",
            visibility: "public",
            lastUpdated: "2024-01-12",
            views: 856,
            status: "published"
        },
        {
            id: 3,
            title: "Résolution des problèmes de connexion",
            content: "Solutions courantes pour les utilisateurs rencontrant des problèmes d'accès au compte.",
            category: "Support technique",
            visibility: "public",
            lastUpdated: "2024-01-10",
            views: 432,
            status: "draft"
        },
        {
            id: 4,
            title: "Avantages du partenariat scolaire",
            content: "Aperçu des avantages et fonctionnalités disponibles aux institutions éducatives partenaires.",
            category: "Guide école",
            visibility: "private",
            lastUpdated: "2024-01-08",
            views: 123,
            status: "published"
        }
    ]);

    const filteredArticles = articles.filter(article =>
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8">
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
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer un article
                </Button>
            </div>
            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder="Rechercher des articles..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    Filtrer
                </Button>
            </div>

            {/* Articles List */}
            <Card>
                <CardHeader>
                    <CardTitle>Base de Connaissances</CardTitle>
                    <CardDescription>
                        Articles d'aide pour les utilisateurs.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">Aucun article trouvé</h3>
                                <p className="text-muted-foreground">Essayez d'ajuster vos termes de recherche ou créez un nouvel article.</p>
                            </div>
                        ) : (
                            filteredArticles.map((article) => (
                                <div key={article.id} className="border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{article.title}</h3>
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                                    {article.status === 'published' ? 'Publié' : 'Brouillon'}
                                                </Badge>
                                                <Badge variant={article.visibility === 'public' ? 'outline' : 'secondary'}>
                                                    {article.visibility === 'public' ? 'Public' : 'Privé'}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-2">{article.content}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>Catégorie: {article.category}</span>
                                                <span>•</span>
                                                <span>Vues: {article.views}</span>
                                                <span>•</span>
                                                <span>Dernière mise à jour: {article.lastUpdated}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-1" />
                                                Voir
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4 mr-1" />
                                                Modifier
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                Supprimer
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
