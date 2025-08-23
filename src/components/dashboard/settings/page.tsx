

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
                    title: t('settings.profile_updated_title'),
                    description: t('settings.profile_updated_desc'),
                });
                 if(updates.email) {
                    toast({
                        title: t('settings.verification_sent_title'),
                        description: t('settings.verification_sent_desc'),
                    });
                }
            } else {
                 toast({
                    title: t('settings.no_changes_title'),
                    description: t("settings.no_changes_desc"),
                });
            }
        } catch (error: any) {
            toast({
                title: t('common.error'),
                description: error.message || t('settings.update_failed_desc'),
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
                title: t('settings.password_reset_sent_title'),
                description: t('settings.password_reset_sent_desc'),
            });
        } catch (error) {
            toast({
                title: t('common.error'),
                description: t('settings.password_reset_failed_desc'),
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
              <CardTitle>{t('settings.account_info_title')}</CardTitle>
              <CardDescription>{t('settings.account_info_desc')}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">{t('common.full_name')}</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">{t('common.email')}</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? t('settings.saving') : t('common.save_changes')}
                </Button>
                <Button variant="outline" onClick={handleCreatePassword}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {isGoogleProvider() ? t('settings.create_password') : t('settings.change_password')}
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
            <CardTitle>{t('settings.profile_visibility_title')}</CardTitle>
            <CardDescription>{t('settings.profile_visibility_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">{t('settings.public_profile_label')}</Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.public_profile_desc')}
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
            <CardTitle>{t('settings.job_alerts_title')}</CardTitle>
            <CardDescription>{t('settings.job_alerts_desc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-1">
                  <Label htmlFor="alert-frequency">{t('settings.notif_frequency_label')}</Label>
                  <Select defaultValue="daily">
                      <SelectTrigger id="alert-frequency" className="w-[280px]">
                          <SelectValue placeholder={t('settings.select_frequency')} />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="daily">{t('common.daily')}</SelectItem>
                          <SelectItem value="weekly">{t('common.weekly')}</SelectItem>
                          <SelectItem value="never">{t('common.never')}</SelectItem>
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
                        <CardTitle>{t('settings.team_members_title')}</CardTitle>
                        <CardDescription>{t('settings.team_members_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">{t('settings.invite_member')}</p>
                            <Button>{t('settings.send_invite')}</Button>
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
                        <CardTitle>{t('settings.billing_info_title')}</CardTitle>
                        <CardDescription>{t('settings.billing_info_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{t('settings.billing_coming_soon')}</p>
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
                        <CardTitle>{t('settings.key_contacts_title')}</CardTitle>
                        <CardDescription>{t('settings.key_contacts_desc')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="contact-name">{t('settings.primary_contact_name')}</Label>
                            <Input id="contact-name" defaultValue="Dr. Fatou Bamba" />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="contact-email">{t('settings.contact_email')}</Label>
                            <Input id="contact-email" type="email" defaultValue="partnerships@inphb.ci" />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                            <div className="space-y-0.5">
                            <Label className="text-base">{t('settings.partnership_requests_label')}</Label>
                            <p className="text-sm text-muted-foreground">
                                {t('settings.partnership_requests_desc')}
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
  content_manager: UserAccountSettings,
  support_staff: UserAccountSettings,
};

const pageConfig: Record<string, { icon: React.ElementType; title: string; description: string }> = {
    graduate: { icon: User, title: 'settings.graduate_title', description: 'settings.graduate_desc' },
    company: { icon: Building, title: 'settings.company_title', description: 'settings.company_desc' },
    school: { icon: SchoolIcon, title: 'settings.school_title', description: 'settings.school_desc' },
    admin: { icon: Shield, title: 'settings.admin_title', description: 'settings.admin_desc' },
    super_admin: { icon: Shield, title: 'settings.admin_title', description: 'settings.admin_desc' },
    content_manager: { icon: Shield, title: 'settings.admin_title', description: 'settings.admin_desc' },
    support_staff: { icon: Shield, title: 'settings.admin_title', description: 'settings.admin_desc' },
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
        {ActiveSettingsComponent ? <ActiveSettingsComponent /> : <p>{t('settings.no_settings_available')}</p>}
    </div>
  );
}
