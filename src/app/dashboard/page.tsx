
"use client"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Briefcase, User, Building, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"

export default function DashboardPage() {
  const { t } = useLocalization();
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('Welcome to your Dashboard')}</h1>
        <p className="text-muted-foreground mt-1">{t("Here's a quick overview of your Yahnu world.")}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Profile Completion')}
            </CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">75%</div>
            <p className="text-xs text-muted-foreground">
              {t('Complete your profile to stand out')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Job Applications')}
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">
              {t('+2 in the last 7 days')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('Companies Viewed')}
            </CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">34</div>
            <p className="text-xs text-muted-foreground">
              {t('Explore more company profiles')}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t('Recommended For You')}</CardTitle>
          <CardDescription>{t('Based on your profile and activity, here are some opportunities you might like.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                    <h3 className="font-semibold">{t('Software Engineer at TechCorp')}</h3>
                    <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                </div>
                <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard/jobs">{t('View')} <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                </Button>
            </div>
             <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                    <h3 className="font-semibold">{t('Product Manager at Innovate Inc.')}</h3>
                    <p className="text-sm text-muted-foreground">Remote</p>
                </div>
                <Button asChild variant="secondary" size="sm">
                    <Link href="/dashboard/jobs">{t('View')} <ArrowUpRight className="h-4 w-4 ml-2" /></Link>
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
