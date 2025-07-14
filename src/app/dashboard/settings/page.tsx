
"use client"

import { useAuth, type Role } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Bell, Building, CreditCard, Users, Contact, FileText, Trash2 } from "lucide-react"

// #region Graduate Settings
const GraduateSettings = () => {
  const { t } = useLocalization()
  return (
    <div className="space-y-8">
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

      <Card>
        <CardHeader>
          <CardTitle>{t('Profile Settings')}</CardTitle>
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
            <Card>
                <CardHeader>
                    <CardTitle>{t('Organization Settings')}</CardTitle>
                    <CardDescription>{t('Manage your company\'s public profile and branding.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="company-name">{t('Company Name')}</Label>
                        <Input id="company-name" defaultValue="Innovate Inc." />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="company-website">{t('Website')}</Label>
                        <Input id="company-website" defaultValue="https://innovate.inc" />
                    </div>
                </CardContent>
            </Card>

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
            <Card>
                <CardHeader>
                    <CardTitle>{t('Institution Profile')}</CardTitle>
                    <CardDescription>{t('Manage your school\'s public information.')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-1">
                        <Label htmlFor="school-name">{t('School Name')}</Label>
                        <Input id="school-name" defaultValue="Institut National Polytechnique Félix Houphouët-Boigny" />
                    </div>
                     <div className="space-y-1">
                        <Label htmlFor="school-website">{t('Website')}</Label>
                        <Input id="school-website" defaultValue="https://www.inphb.ci" />
                    </div>
                </CardContent>
            </Card>
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
                </CardContent>
            </Card>
        </div>
    )
}
// #endregion


const settingsComponents: Record<Role, React.ComponentType> = {
  graduate: GraduateSettings,
  company: CompanySettings,
  school: SchoolSettings,
};

const pageConfig: Record<Role, { icon: React.ElementType; title: string; description: string }> = {
    graduate: { icon: User, title: 'Your Settings', description: 'Manage your personal account details, profile visibility, and notifications.' },
    company: { icon: Building, title: 'Company Settings', description: 'Manage your organization settings, team members, and billing.' },
    school: { icon: Building, title: 'School Settings', description: 'Manage your institution\'s public profile and primary contacts.' },
}

export default function SettingsPage() {
  const { role } = useAuth()
  const { t } = useLocalization()

  const ActiveSettingsComponent = settingsComponents[role]
  const { icon: Icon, title, description } = pageConfig[role];

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
