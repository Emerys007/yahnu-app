
"use client"

import { useLocalization } from "@/context/localization-context"
import { ContentPagesEditor } from "@/features/content/ContentPagesEditor"
import { FileText } from "lucide-react"

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
            <h1 className="text-3xl font-bold tracking-tight">{t('Content Management')}</h1>
            <p className="text-muted-foreground mt-1">{t('Manage your platform\'s blog and page content.')}</p>
          </div>
        </div>
      </div>
      
      <ContentPagesEditor />
    </div>
  )
}
