
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PlusCircle, BookOpen, Edit, Trash2, Search, Globe, Lock } from 'lucide-react'
import { useLocalization } from '@/context/localization-context'

type Article = {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  visibility: 'public' | 'internal'
  lastUpdated: string
  views: number
}

// Mock data
const mockArticles: Article[] = [
  {
    id: '1',
    title: 'How to Create Your Profile',
    content: 'Step-by-step guide to creating an effective profile on Yahnu...',
    category: 'getting_started',
    tags: ['profile', 'setup', 'beginner'],
    visibility: 'public',
    lastUpdated: '2025-01-15',
    views: 245
  },
  {
    id: '2',
    title: 'Troubleshooting Login Issues',
    content: 'Common solutions for login problems and account access...',
    category: 'troubleshooting',
    tags: ['login', 'password', 'access'],
    visibility: 'public',
    lastUpdated: '2025-01-12',
    views: 156
  },
  {
    id: '3',
    title: 'Admin Dashboard Overview',
    content: 'Internal guide for administrators on using the dashboard...',
    category: 'admin',
    tags: ['admin', 'dashboard', 'internal'],
    visibility: 'internal',
    lastUpdated: '2025-01-10',
    views: 67
  }
]

export default function KnowledgeBaseEditor() {
  const { t } = useLocalization()
  const [articles, setArticles] = useState<Article[]>(mockArticles)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [newArticle, setNewArticle] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    visibility: 'public' as const
  })

  const handleCreateArticle = () => {
    const article: Article = {
      id: Math.random().toString(36).substr(2, 9),
      title: newArticle.title,
      content: newArticle.content,
      category: newArticle.category,
      tags: newArticle.tags.split(',').map(tag => tag.trim()).filter(tag => tag),
      visibility: newArticle.visibility,
      lastUpdated: new Date().toISOString().split('T')[0],
      views: 0
    }
    setArticles([...articles, article])
    setIsCreateDialogOpen(false)
    setNewArticle({
      title: '',
      content: '',
      category: 'general',
      tags: '',
      visibility: 'public'
    })
  }

  const filteredArticles = articles.filter(article =>
    article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    article.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'getting_started': return t('dashboard.support.knowledge_base.getting_started')
      case 'account_management': return t('dashboard.support.knowledge_base.account_management')
      case 'troubleshooting': return t('dashboard.support.knowledge_base.troubleshooting')
      case 'billing': return t('dashboard.support.knowledge_base.billing')
      case 'general': return t('dashboard.support.knowledge_base.general')
      default: return category
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.knowledge_base.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.support.knowledge_base.description')}</p>
          </div>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dashboard.support.knowledge_base.create_article')}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>{t('dashboard.support.knowledge_base.create_article')}</DialogTitle>
              <DialogDescription>
                Create a new knowledge base article to help users.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">{t('dashboard.support.knowledge_base.title_label')}</Label>
                <Input
                  id="title"
                  value={newArticle.title}
                  onChange={(e) => setNewArticle({ ...newArticle, title: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="content">{t('dashboard.support.knowledge_base.content_label')}</Label>
                <Textarea
                  id="content"
                  value={newArticle.content}
                  onChange={(e) => setNewArticle({ ...newArticle, content: e.target.value })}
                  rows={6}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>{t('dashboard.support.knowledge_base.category')}</Label>
                  <Select value={newArticle.category} onValueChange={(value) => setNewArticle({ ...newArticle, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="getting_started">{t('dashboard.support.knowledge_base.getting_started')}</SelectItem>
                      <SelectItem value="account_management">{t('dashboard.support.knowledge_base.account_management')}</SelectItem>
                      <SelectItem value="troubleshooting">{t('dashboard.support.knowledge_base.troubleshooting')}</SelectItem>
                      <SelectItem value="billing">{t('dashboard.support.knowledge_base.billing')}</SelectItem>
                      <SelectItem value="general">{t('dashboard.support.knowledge_base.general')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>{t('dashboard.support.knowledge_base.visibility')}</Label>
                  <Select value={newArticle.visibility} onValueChange={(value: any) => setNewArticle({ ...newArticle, visibility: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">{t('dashboard.support.knowledge_base.public')}</SelectItem>
                      <SelectItem value="internal">{t('dashboard.support.knowledge_base.internal')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="tags">{t('dashboard.support.knowledge_base.tags')}</Label>
                <Input
                  id="tags"
                  placeholder="Enter tags separated by commas"
                  value={newArticle.tags}
                  onChange={(e) => setNewArticle({ ...newArticle, tags: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                {t('dashboard.support.knowledge_base.cancel')}
              </Button>
              <Button onClick={handleCreateArticle}>
                {t('dashboard.support.knowledge_base.save')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center space-x-2">
        <Search className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t('dashboard.support.knowledge_base.search_articles')}
          className="w-[300px]"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight">{t('dashboard.support.knowledge_base.existing_articles')}</h2>
        {filteredArticles.length > 0 ? (
          <div className="grid gap-6">
            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{article.title}</CardTitle>
                      <CardDescription>
                        {getCategoryLabel(article.category)} • {t('dashboard.support.knowledge_base.last_updated')} {new Date(article.lastUpdated).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant={article.visibility === 'public' ? 'default' : 'secondary'}>
                        {article.visibility === 'public' ? (
                          <><Globe className="mr-1 h-3 w-3" /> {t('dashboard.support.knowledge_base.public')}</>
                        ) : (
                          <><Lock className="mr-1 h-3 w-3" /> {t('dashboard.support.knowledge_base.internal')}</>
                        )}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {article.content.length > 150 ? `${article.content.substring(0, 150)}...` : article.content}
                  </p>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <span>{article.views} views</span>
                    <div className="flex flex-wrap gap-1">
                      {article.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium text-muted-foreground">{t('dashboard.support.knowledge_base.no_articles')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
