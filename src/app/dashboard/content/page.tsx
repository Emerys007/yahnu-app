
'use client'

import { useState } from 'react'
import { useLocalization } from '@/context/localization-context'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { 
  FileText, 
  Globe, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Calendar,
  User,
  Tag,
  MoreHorizontal,
  Filter
} from 'lucide-react'
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ContentPagesEditor } from '@/features/content/ContentPagesEditor'

export default function ContentManagementPage() {
  const { t } = useLocalization()
  const [activeTab, setActiveTab] = useState('blog')
  const [searchQuery, setSearchQuery] = useState('')
  const [showEditor, setShowEditor] = useState(false)
  const [selectedContent, setSelectedContent] = useState(null)

  // Mock data for demonstration
  const blogPosts = [
    {
      id: 1,
      title: "5 Essential Skills Every Graduate Needs in 2024",
      slug: "essential-skills-graduates-2024",
      author: "Joel Katako",
      status: "published",
      publishDate: "2024-01-15",
      views: 1250,
      category: "Career Tips"
    },
    {
      id: 2,
      title: "How to Land Your First Internship in Tech",
      slug: "first-tech-internship",
      author: "Sarah Johnson",
      status: "draft",
      publishDate: null,
      views: 0,
      category: "Technology"
    },
    {
      id: 3,
      title: "Building Professional Networks as a Student",
      slug: "building-professional-networks",
      author: "Mike Chen",
      status: "published",
      publishDate: "2024-01-10",
      views: 890,
      category: "Networking"
    }
  ]

  const pages = [
    {
      id: 1,
      title: "About Us",
      slug: "about",
      lastModified: "2024-01-20",
      status: "published"
    },
    {
      id: 2,
      title: "Privacy Policy",
      slug: "privacy-policy",
      lastModified: "2024-01-18",
      status: "published"
    },
    {
      id: 3,
      title: "Terms of Service",
      slug: "terms-of-service",
      lastModified: "2024-01-15",
      status: "published"
    }
  ]

  const handleCreateNew = () => {
    setSelectedContent(null)
    setShowEditor(true)
  }

  const handleEdit = (content) => {
    setSelectedContent(content)
    setShowEditor(true)
  }

  const getStatusBadge = (status) => {
    const variants = {
      published: 'default',
      draft: 'secondary',
      archived: 'outline'
    }
    return <Badge variant={variants[status]}>{status}</Badge>
  }

  if (showEditor) {
    return (
      <ContentPagesEditor 
        content={selectedContent}
        onBack={() => setShowEditor(false)}
      />
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('Content Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your platform\'s blog and page content.')}</p>
          </div>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          {t('Create New')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="blog" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            {t('Blog Posts')}
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            {t('Static Pages')}
          </TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder={t('Search content...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            {t('Filter')}
          </Button>
        </div>

        <TabsContent value="blog" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Blog Posts')}</CardTitle>
              <CardDescription>
                {t('Manage your blog content and articles')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Title')}</TableHead>
                    <TableHead>{t('Author')}</TableHead>
                    <TableHead>{t('Category')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Views')}</TableHead>
                    <TableHead>{t('Date')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogPosts.map((post) => (
                    <TableRow key={post.id}>
                      <TableCell className="font-medium">
                        {post.title}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          {post.author}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{post.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(post.status)}
                      </TableCell>
                      <TableCell>{post.views}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {post.publishDate || t('Not published')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(post)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('Preview')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('Static Pages')}</CardTitle>
              <CardDescription>
                {t('Manage your website pages and legal documents')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('Title')}</TableHead>
                    <TableHead>{t('Slug')}</TableHead>
                    <TableHead>{t('Status')}</TableHead>
                    <TableHead>{t('Last Modified')}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pages.map((page) => (
                    <TableRow key={page.id}>
                      <TableCell className="font-medium">
                        {page.title}
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          /{page.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(page.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {page.lastModified}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(page)}>
                              <Edit className="mr-2 h-4 w-4" />
                              {t('Edit')}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              {t('Preview')}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="mr-2 h-4 w-4" />
                              {t('Delete')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
