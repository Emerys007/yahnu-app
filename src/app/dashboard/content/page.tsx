'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlusCircle, FileText, Globe, Users, Calendar, Edit, Trash2, Eye, Search } from 'lucide-react'
import { useLocalization } from '@/context/localization-context'

export default function ContentManagementPage() {
  const { t } = useLocalization()

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.content.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.content.description')}</p>
          </div>
        </div>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          {t('dashboard.content.create_content')}
        </Button>
      </div>

      <Tabs defaultValue="blog" className="space-y-6">
        <TabsList>
          <TabsTrigger value="blog">{t('dashboard.content.blog_posts')}</TabsTrigger>
          <TabsTrigger value="pages">{t('dashboard.content.static_pages')}</TabsTrigger>
          <TabsTrigger value="announcements">{t('dashboard.content.announcements')}</TabsTrigger>
        </TabsList>

        <TabsContent value="blog" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('dashboard.content.search_blog_posts')} className="w-[300px]" />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dashboard.content.new_blog_post')}
            </Button>
          </div>

          <div className="grid gap-6">
            {[1, 2, 3].map((post) => (
              <Card key={post}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">Sample Blog Post {post}</CardTitle>
                      <CardDescription>
                        Published on {new Date().toLocaleDateString()} by Admin User
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="secondary">{t('dashboard.content.published')}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
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
                  <p className="text-muted-foreground">
                    This is a sample blog post excerpt that would appear in the content management system...
                  </p>
                  <div className="flex items-center mt-4 space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="mr-1 h-3 w-3" />
                      {Math.floor(Math.random() * 1000)} views
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Last updated 2 days ago
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('dashboard.content.search_pages')} className="w-[300px]" />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dashboard.content.new_page')}
            </Button>
          </div>

          <div className="grid gap-6">
            {['About Us', 'Privacy Policy', 'Terms of Service', 'Contact'].map((page) => (
              <Card key={page}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">{page}</CardTitle>
                      <CardDescription>
                        Static page • Last updated {Math.floor(Math.random() * 30)} days ago
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{t('dashboard.content.static')}</Badge>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Static page content for {page.toLowerCase()}...
                  </p>
                  <div className="flex items-center mt-4 space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Globe className="mr-1 h-3 w-3" />
                      Public page
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="announcements" className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input placeholder={t('dashboard.content.search_announcements')} className="w-[300px]" />
            </div>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              {t('dashboard.content.new_announcement')}
            </Button>
          </div>

          <div className="grid gap-6">
            {[1, 2].map((announcement) => (
              <Card key={announcement}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-xl">System Announcement {announcement}</CardTitle>
                      <CardDescription>
                        Active until {new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="default">{t('dashboard.content.active')}</Badge>
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
                  <p className="text-muted-foreground">
                    Important system announcement that will be displayed to all users...
                  </p>
                  <div className="flex items-center mt-4 space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center">
                      <Users className="mr-1 h-3 w-3" />
                      All users
                    </div>
                    <div className="flex items-center">
                      <Calendar className="mr-1 h-3 w-3" />
                      Expires in 7 days
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}