
"use client"

import { MessageSquare } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

export default function AnnouncementsPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.announcements.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.support.announcements.description')}</p>
        </div>
      </div>
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('common.coming_soon')}</p>
      </div>
    </div>
  );
}
