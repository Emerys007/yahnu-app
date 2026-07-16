
"use client"

import { useState } from "react"
import Link from "next/link"
import { useAuth, type Role } from "@/context/auth-context"
import { useLocalization } from "@/context/localization-context"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { PasswordInput } from "@/components/ui/password-input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { ArrowUpRight, User, Shield, Building, School as SchoolIcon, KeyRound } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { motion } from "framer-motion"

// #region Shared Settings
const UserAccountSettings = () => {
    const { t } = useLocalization();
    const { user, createPassword, updateProfile } = useAuth();
    const { toast } = useToast();
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const emailChanged = Boolean(user && email.trim().toLowerCase() !== (user.email ?? '').toLowerCase());

    const handleSaveChanges = async () => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            const updates: { name?: string; email?: string; currentPassword?: string } = {};
            if (name !== user.name) {
                updates.name = name;
            }
            if (emailChanged) {
                updates.email = email.trim().toLowerCase();
                updates.currentPassword = currentPassword;
            }

            if (Object.keys(updates).length > 0) {
                const result = await updateProfile(updates);
                toast({
                    title: t('Profile Updated'),
                    description: t('Your changes have been saved successfully.'),
                });
                if (updates.email && result.emailChangeDelivery === 'failed') {
                    toast({
                        title: t('Verification email could not be sent'),
                        description: t('Your email change is pending. Try again later or contact support.'),
                        variant: 'destructive',
                    });
                } else if (updates.email && result.emailChangeDelivery) {
                    toast({
                        title: t('Verification email sent'),
                        description: t('Please check your new email address to verify the change.'),
                    });
                }
                if (updates.email) {
                    setCurrentPassword('');
                    setEmail(user.email ?? '');
                }
            } else {
                 toast({
                    title: t('No Changes'),
                    description: t("You haven't made any changes."),
                });
            }
        } catch {
            toast({
                title: t('Error'),
                description: t('Failed to update profile.'),
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCreatePassword = async () => {
        if (!user || !user.email) return;
        try {
            const reset = await createPassword();
            toast({
                title: t('Password reset email sent'),
                description: t('Check your inbox to create a new password.'),
            });
            if (reset.debugUrl) window.location.assign(reset.debugUrl);
        } catch {
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
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                </div>
              </div>
              {emailChanged && (user?.hasPassword ? (
                <div className="max-w-md space-y-1">
                  <Label htmlFor="current-password">{t('Current Password')}</Label>
                  <PasswordInput
                    id="current-password"
                    value={currentPassword}
                    onChange={(event) => setCurrentPassword(event.target.value)}
                    autoComplete="current-password"
                    hideSuggestions
                  />
                  <p className="text-sm text-muted-foreground">
                    {t('Re-enter your password to authorize this email change. You will be signed out after the new address is verified.')}
                  </p>
                </div>
              ) : (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
                  {t('Create a password before changing your email address. Use the button below, then return here after setting it.')}
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveChanges} disabled={isSubmitting || (emailChanged && (!user?.hasPassword || !currentPassword))}>
                    {isSubmitting ? t('Saving...') : t('Save Changes')}
                </Button>
                <Button variant="outline" onClick={handleCreatePassword}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {user?.hasPassword ? t('Change Password') : t('Create Password')}
                </Button>
              </div>
            </CardContent>
        </Card>
    )
}
// #endregion

// #region Graduate Settings
const GraduateSettings = () => {
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
            <CardTitle>Visibilité du profil</CardTitle>
            <CardDescription>Votre profil professionnel est utilisé dans les espaces de recrutement réservés aux comptes autorisés.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline"><Link href="/dashboard/profile">Vérifier les informations visibles<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
          </CardContent>
        </Card>
      </motion.div>
      <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
        <Card>
          <CardHeader>
            <CardTitle>Alertes d’opportunités</CardTitle>
            <CardDescription>Les préférences d’alertes personnalisées seront proposées ici lorsqu’elles seront reliées au service d’e-mail Yahnu.</CardDescription>
          </CardHeader>
          <CardContent>
              <p className="rounded-xl border border-dashed bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">En attendant, consultez les offres ouvertes depuis votre tableau de bord. Aucun réglage affiché ici ne prétend être enregistré.</p>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
// #endregion

// #region Company Settings
const CompanySettings = () => {
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
                        <CardTitle>Profil de l’entreprise</CardTitle>
                        <CardDescription>Les informations visibles par les candidats sont gérées dans un espace dédié.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline"><Link href="/dashboard/company-profile">Mettre à jour le profil<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
                    </CardContent>
                </Card>
            </motion.div>
            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}>
                <Card>
                    <CardHeader>
                        <CardTitle>Accès de l’équipe</CardTitle>
                        <CardDescription>La gestion multi-utilisateur n’est pas encore activée. Aucun collaborateur fictif n’est affiché ici.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="rounded-xl border border-dashed bg-muted/25 p-4 text-sm leading-6 text-muted-foreground">Pour ajouter un recruteur à votre compte, contactez le support Yahnu depuis votre tableau de bord.</p>
                    </CardContent>
                </Card>
            </motion.div>
        </motion.div>
    )
}
// #endregion

// #region School Settings
const SchoolSettings = () => {
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
                        <CardTitle>Profil de l’établissement</CardTitle>
                        <CardDescription>Gardez vos coordonnées et votre présentation à jour pour les diplômés et les partenaires.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button asChild variant="outline"><Link href="/dashboard/school-profile">Mettre à jour le profil<ArrowUpRight className="ml-2 h-4 w-4" aria-hidden="true" /></Link></Button>
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
  content_moderator: UserAccountSettings,
  support_staff: UserAccountSettings,
};

const pageConfig: Record<string, { icon: React.ElementType; title: string; description: string }> = {
    graduate: { icon: User, title: 'Mes paramètres', description: 'Gérez votre compte, la visibilité de votre profil et vos notifications.' },
    company: { icon: Building, title: 'Paramètres recruteur', description: 'Gérez votre compte personnel et les informations de votre entreprise.' },
    school: { icon: SchoolIcon, title: 'Paramètres établissement', description: 'Gérez votre compte et les informations de votre établissement.' },
    admin: { icon: Shield, title: 'Paramètres administrateur', description: 'Gérez les informations et la sécurité de votre compte Yahnu.' },
    super_admin: { icon: Shield, title: 'Paramètres administrateur', description: 'Gérez les informations et la sécurité de votre compte Yahnu.' },
    content_manager: { icon: Shield, title: 'Paramètres éditoriaux', description: 'Gérez les informations et la sécurité de votre compte Yahnu.' },
    content_moderator: { icon: Shield, title: 'Paramètres de modération', description: 'Gérez les informations et la sécurité de votre compte Yahnu.' },
    support_staff: { icon: Shield, title: 'Paramètres support', description: 'Gérez les informations et la sécurité de votre compte Yahnu.' },
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
                <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
                <p className="text-muted-foreground mt-1">{description}</p>
            </div>
        </motion.div>
        <Separator />
        {ActiveSettingsComponent ? <ActiveSettingsComponent /> : <p>{t('No settings available for this role.')}</p>}
    </div>
  );
}
