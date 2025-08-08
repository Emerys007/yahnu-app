
"use client"

import { Activity } from "lucide-react";
import { useLocalization } from "@/context/localization-context";

export default function SystemHealthPage() {
  const { t } = useLocalization();

  return (
    <div className="space-y-8">
      <div className="flex items-start gap-4">
        <div className="bg-primary/10 p-3 rounded-lg">
          <Activity className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.support.system_health.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('dashboard.support.system_health.description')}</p>
        </div>
      </div>
      <div className="text-center py-8">
        <p className="text-muted-foreground">{t('common.coming_soon')}</p>
      </div>
    </div>
  );
}
