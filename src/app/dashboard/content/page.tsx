
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
import { ContentPagesEditor } from '@/features/content/ContentPagesEditor'

export default function ContentManagementPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-start gap-4">
          <div className="bg-primary/10 p-3 rounded-lg">
            <FileText className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Gestion de Contenu</h1>
            <p className="text-muted-foreground mt-1">Gérez les pages statiques, les articles de blog et les annonces.</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="pages" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pages">Pages Statiques</TabsTrigger>
          <TabsTrigger value="blog" disabled>Articles de Blog (Bientôt disponible)</TabsTrigger>
        </TabsList>

        <TabsContent value="pages" className="space-y-6">
            <ContentPagesEditor />
        </TabsContent>
        <TabsContent value="blog" className="space-y-6">
          {/* Blog post management will be implemented here */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
