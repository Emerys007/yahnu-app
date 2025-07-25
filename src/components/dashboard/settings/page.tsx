
"use client"

import { useAuth, type AccountType } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Bell, Building, CreditCard, Users, Contact, FileText, Trash2, SchoolIcon } from "lucide-react"

// #region Shared Settings
const UserAccountSettings = () => {
    const { t } = useLocalization();
    return (
        <Card>
            <CardHeader>
              <CardTitle>{t('Account Information')}</CardTitle>
              <CardDescription>{t('Manage your personal and login details.')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">{t('Full Name')}</Label>
                  <Input id="name" defaultValue="John Doe" />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">{t('Email Address')}</Label>
                  <Input id="email" type="email" defaultValue="user@example.com" />
                </div>
              </div>
              <Button variant="outline">{t('Change Password')}</Button>
            </CardContent>
        </Card>
    )
}
// #endregion

// #region Graduate Settings
const GraduateSettings = () => {
  const { t } = useLocalization()
  return (
    <div className="space-y-8">
      <UserAccountSettings />
      <Card>
        <CardHeader>
          <CardTitle>{t('Profile Visibility')}</CardTitle>
          <CardDescription>{t('Control the visibility of your professional profile.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label className="text-base">{t('Public Profile')}</Label>
              <p className="text-sm text-muted-foreground">
                {t('Allow companies to view your full profile.')}
              </p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Job Alerts')}</CardTitle>
          <CardDescription>{t('Configure your email notifications for new job opportunities.')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="space-y-1">
                <Label htmlFor="alert-frequency">{t('Notification Frequency')}</Label>
                <Select defaultValue="daily">
                    <SelectTrigger id="alert-frequency" className="w-[280px]">
                        <SelectValue placeholder={t('Select frequency')} />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="daily">{t('Daily')}</SelectItem>
                        <SelectItem value="weekly">{t('Weekly')}</SelectItem>
                        <SelectItem value="never">{t('Never')}</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </CardContent>
      </Card>
    </div>
  )
}
// #endregion

// #region Company Settings
const CompanySettings = () => {
    const { t } = useLocalization();
    return (
        <div className="space-y-8">
            <UserAccountSettings />
            <Card>
                <CardHeader>
                    <CardTitle>{t('Team Members')}</CardTitle>
                    <CardDescription>{t('Manage who has access to your company account.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="font-medium">{t('Invite a new team member')}</p>
                        <Button>{t('Send Invite')}</Button>
                    </div>
                     <div className="space-y-2">
                        <div className="flex items-center justify-between p-3 rounded-lg border">
                            <div>
                                <p className="font-semibold">Jane Smith</p>
                                <p className="text-sm text-muted-foreground">jane@innovate.inc</p>
                            </div>
                            <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>{t('Billing Information')}</CardTitle>
                    <CardDescription>{t('Manage your subscription and payment methods.')}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{t('Billing features coming soon.')}</p>
                </CardContent>
            </Card>
        </div>
    )
}
// #endregion

// #region School Settings
const SchoolSettings = () => {
    const { t } = useLocalization();
    return (
        <div className="space-y-8">
            <UserAccountSettings />
             <Card>
                <CardHeader>
                    <CardTitle>{t('Key Contacts')}</CardTitle>
                    <CardDescription>{t('Manage primary points of contact for industry partnerships.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="contact-name">{t('Primary Contact Name')}</Label>
                        <Input id="contact-name" defaultValue="Dr. Fatou Bamba" />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="contact-email">{t('Contact Email')}</Label>
                        <Input id="contact-email" type="email" defaultValue="partnerships@inphb.ci" />
                    </div>
                     <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                        <div className="space-y-0.5">
                        <Label className="text-base">{t('Partnership Requests')}</Label>
                        <p className="text-sm text-muted-foreground">
                            {t('Receive email notifications for new company partnership requests.')}
                        </p>
                        </div>
                        <Switch defaultChecked />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
// #endregion


const settingsComponents: Record<AccountType, React.ComponentType> = {
  graduate: GraduateSettings,
  company: CompanySettings,
  school: SchoolSettings,
  admin: UserAccountSettings,
};

const pageConfig: Record<AccountType, { icon: React.ElementType; title: string; description: string }> = {
    graduate: { icon: User, title: 'Your Settings', description: 'Manage your personal account details, profile visibility, and notifications.' },
    company: { icon: Building, title: 'Company Settings', description: 'Manage your personal account, team members, and billing.' },
    school: { icon: SchoolIcon, title: 'School Settings', description: 'Manage your personal account and institution contacts.' },
    admin: { icon: Shield, title: 'Admin Settings', description: 'Manage your administrator account details.' },
}

export default function SettingsPage() {
  const { accountType } = useAuth()
  const { t } = useLocalization()

  const ActiveSettingsComponent = settingsComponents[accountType] || GraduateSettings;
  const { icon: Icon, title, description } = pageConfig[accountType] || pageConfig.graduate;

  return (
    <div className="space-y-8">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t(title)}</h1>
                <p className="text-muted-foreground mt-1">{t(description)}</p>
            </div>
        </div>
        <Separator />
        {ActiveSettingsComponent ? <ActiveSettingsComponent /> : <p>{t('No settings available for this role.')}</p>}
    </div>
  );
}
