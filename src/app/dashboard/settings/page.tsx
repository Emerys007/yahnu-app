
"use client"

import { useState } from "react"
import { useAuth, type Role } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { User, Shield, Bell, Building, CreditCard, Users, Contact, FileText, Trash2, School as SchoolIcon, KeyRound, Check, ChevronsUpDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

// #region Shared Settings
const UserAccountSettings = () => {
    const { t } = useLocalization();
    const { user, createPassword, isGoogleProvider, updateProfile } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const updates: { name?: string; email?: string } = {};
            if (name !== user.name) {
                updates.name = name;
            }
            if (email !== user.email) {
                updates.email = email;
            }

            if (Object.keys(updates).length > 0) {
                await updateProfile(updates);
                toast({
                    title: t('Profile Updated'),
                    description: t('Your changes have been saved successfully.'),
                });
                 if(updates.email) {
                    toast({
                        title: t('Verification email sent'),
                        description: t('Please check your new email address to verify the change.'),
                    });
                }
            } else {
                 toast({
                    title: t('No Changes'),
                    description: t("You haven't made any changes."),
                });
            }
        } catch (error: any) {
            toast({
                title: t('Error'),
                description: error.message || t('Failed to update profile.'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreatePassword = async () => {
        if (!user || !user.email) return;
        try {
            await createPassword();
            toast({
                title: t('Password reset email sent'),
                description: t('Check your inbox to create a new password.'),
            });
        } catch (error) {
            toast({
                title: t('Error'),
                description: t('Failed to send password reset email.'),
                variant: 'destructive',
            });
        }
    };

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
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">{t('Email Address')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? t('Saving...') : t('Save Changes')}
                </Button>
                <Button variant="outline" onClick={handleCreatePassword}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {isGoogleProvider() ? t('Create Password') : t('Change Password')}
                </Button>
              </div>
            </CardContent>
        </Card>
    )
}
// #endregion

// #region Graduate Settings
const GraduateSettings = () => {
  const { t } = useLocalization()
  return (
    <motion.div 
        className="space-y-8"
        variants={{
            hidden: {},
            visible: { transition: { staggerChildren: 0.1 } }
        }}
        initial="hidden"
        animate="visible"
    >
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <UserAccountSettings />
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
      </motion.div>
    </motion.div>
  )
}
// #endregion

// #region Company Settings
const CompanySettings = () => {
    const { t } = useLocalization();
    return (
        <motion.div 
            className="space-y-8"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <UserAccountSettings />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Billing Information')}</CardTitle>
                        <CardDescription>{t('Manage your subscription and payment methods.')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{t('Billing features coming soon.')}</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
// #endregion

// #region School Settings
const SchoolSettings = () => {
    const { t } = useLocalization();
    return (
        <motion.div 
            className="space-y-8"
            variants={{
                hidden: {},
                visible: { transition: { staggerChildren: 0.1 } }
            }}
            initial="hidden"
            animate="visible"
        >
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <UserAccountSettings />
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
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
            </motion.div>
        </motion.div>
    )
}
// #endregion


const settingsComponents: Record<Role, React.ComponentType> = {
  graduate: GraduateSettings,
  company: CompanySettings,
  school: SchoolSettings,
  admin: UserAccountSettings,
  super_admin: UserAccountSettings,
  content_moderator: UserAccountSettings,
  support_staff: UserAccountSettings,
};

const pageConfig: Record<string, { icon: React.ElementType; title: string; description: string }> = {
    graduate: { icon: User, title: 'Your Settings', description: 'Manage your personal account details, profile visibility, and notifications.' },
    company: { icon: Building, title: 'Company Settings', description: 'Manage your personal account, team members, and billing.' },
    school: { icon: SchoolIcon, title: 'School Settings', description: 'Manage your personal account and institution contacts.' },
    admin: { icon: Shield, title: 'Admin Settings', description: 'Manage your administrator account details.' },
    super_admin: { icon: Shield, title: 'Admin Settings', description: 'Manage your administrator account details.' },
    content_moderator: { icon: Shield, title: 'Admin Settings', description: 'Manage your administrator account details.' },
    support_staff: { icon: Shield, title: 'Admin Settings', description: 'Manage your administrator account details.' },
}

export default function SettingsPage() {
  const { role } = useAuth()
  const { t } = useLocalization()

  const ActiveSettingsComponent = settingsComponents[role] || GraduateSettings;
  const { icon: Icon, title, description } = pageConfig[role] || pageConfig.graduate;

  return (
    <div className="space-y-8">
        <motion.div 
            className="flex items-start gap-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <div className="bg-primary/10 p-3 rounded-lg">
                <Icon className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t(title)}</h1>
                <p className="text-muted-foreground mt-1">{t(description)}</p>
            </div>
        </motion.div>
        <Separator />
        {ActiveSettingsComponent ? <ActiveSettingsComponent /> : <p>{t('No settings available for this role.')}</p>}
    </div>
  );
}
