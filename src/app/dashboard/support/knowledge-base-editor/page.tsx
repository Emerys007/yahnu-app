"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { BookOpen, Plus, Edit, Trash2, Search, Filter, Eye } from "lucide-react"
import { useState } from "react"
import { useLocalization } from "@/context/localization-context"

export default function KnowledgeBaseEditorPage() {
    const { t } = useLocalization();
    const [searchTerm, setSearchTerm] = useState("");
    const [articles, setArticles] = useState([
        {
            id: 1,
            title: t('language') === 'fr' ? "Comment créer votre profil de diplômé" : "How to Create Your Graduate Profile",
            content: t('language') === 'fr' ? "Guide étape par étape pour créer un profil de diplômé efficace qui attire les employeurs." : "Step-by-step guide on creating an effective graduate profile that attracts employers.",
            category: t('language') === 'fr' ? "Commencer" : "Getting Started",
            visibility: "public",
            lastUpdated: "2024-01-15",
            views: 1234,
            status: "published"
        },
        {
            id: 2,
            title: t('language') === 'fr' ? "Processus d'enregistrement d'entreprise" : "Company Registration Process",
            content: t('language') === 'fr' ? "Guide complet pour les entreprises s'inscrire et commencer à publier des emplois sur la plateforme." : "Complete guide for companies to register and start posting jobs on the platform.",
            category: t('language') === 'fr' ? "Guide entreprise" : "Company Guide",
            visibility: "public",
            lastUpdated: "2024-01-12",
            views: 856,
            status: "published"
        },
        {
            id: 3,
            title: t('language') === 'fr' ? "Résolution des problèmes de connexion" : "Troubleshooting Login Issues",
            content: t('language') === 'fr' ? "Solutions courantes pour les utilisateurs rencontrant des problèmes d'accès au compte." : "Common solutions for users experiencing problems with account access.",
            category: t('language') === 'fr' ? "Support technique" : "Technical Support",
            visibility: "public",
            lastUpdated: "2024-01-10",
            views: 432,
            status: "draft"
        },
        {
            id: 4,
            title: t('language') === 'fr' ? "Avantages du partenariat scolaire" : "School Partnership Benefits",
            content: t('language') === 'fr' ? "Aperçu des avantages et fonctionnalités disponibles aux institutions éducatives partenaires." : "Overview of benefits and features available to partner educational institutions.",
            category: t('language') === 'fr' ? "Guide école" : "School Guide",
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
                        <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.knowledge_base_editor.title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('dashboard.support.knowledge_base_editor.description')}</p>
                    </div>
                </div>
                <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('common.knowledge_base.create_article')}
                </Button>
            </div>
            {/* Search and Filter */}
            <div className="flex gap-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                        placeholder={t('common.search') + '...'}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button variant="outline">
                    <Filter className="h-4 w-4 mr-2" />
                    {t('language') === 'fr' ? 'Filtrer' : 'Filter'}
                </Button>
            </div>

            {/* Articles List */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('common.knowledge_base.title')}</CardTitle>
                    <CardDescription>
                        {t('common.knowledge_base.description')}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {filteredArticles.length === 0 ? (
                            <div className="text-center py-8">
                                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-lg font-medium">{t('common.knowledge_base.no_articles')}</h3>
                                <p className="text-muted-foreground">{t('language') === 'fr' ? 'Essayez d\'ajuster vos termes de recherche ou créez un nouvel article.' : 'Try adjusting your search terms or create a new article.'}</p>
                            </div>
                        ) : (
                            filteredArticles.map((article) => (
                                <div key={article.id} className="border rounded-lg p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="text-lg font-semibold">{article.title}</h3>
                                                <Badge variant={article.status === 'published' ? 'default' : 'secondary'}>
                                                    {t(`dashboard.content.${article.status}`)}
                                                </Badge>
                                                <Badge variant={article.visibility === 'public' ? 'outline' : 'secondary'}>
                                                    {t(`common.knowledge_base.${article.visibility}`)}
                                                </Badge>
                                            </div>
                                            <p className="text-muted-foreground mb-2">{article.content}</p>
                                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                                <span>{t('common.knowledge_base.category')}: {article.category}</span>
                                                <span>•</span>
                                                <span>{t('dashboard.content.views')}: {article.views}</span>
                                                <span>•</span>
                                                <span>{t('common.knowledge_base.last_updated')}: {article.lastUpdated}</span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 ml-4">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-1" />
                                                {t('common.view_profile')}
                                            </Button>
                                            <Button variant="outline" size="sm">
                                                <Edit className="h-4 w-4 mr-1" />
                                                {t('common.knowledge_base.edit')}
                                            </Button>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="h-4 w-4 mr-1" />
                                                {t('common.knowledge_base.delete')}
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