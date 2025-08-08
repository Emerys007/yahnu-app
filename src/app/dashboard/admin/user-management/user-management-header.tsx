
"use client";

import { useLocalization } from "@/context/localization-context";

export function UserManagementHeader() {
    const { t } = useLocalization();
    
    return (
        <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.user_management.title')}</h1>
            <p className="text-muted-foreground mt-1">{t('dashboard.user_management.description')}</p>
        </div>
    );
}
