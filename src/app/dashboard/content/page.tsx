
'use client'

import { ContentPagesEditor } from '@/features/content/ContentPagesEditor'
import { FileText } from 'lucide-react'

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
      <ContentPagesEditor />
    </div>
  )
}
