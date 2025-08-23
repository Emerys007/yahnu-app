
"use client"

import { useState } from "react"
import { useAuth, type Role } from "@/context/auth-context"
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
                    title: "Profil mis à jour",
                    description: "Vos modifications ont été enregistrées avec succès.",
                });
                 if(updates.email) {
                    toast({
                        title: "E-mail de vérification envoyé",
                        description: "Veuillez vérifier votre nouvelle adresse e-mail pour valider le changement.",
                    });
                }
            } else {
                 toast({
                    title: "Aucune modification",
                    description: "Vous n'avez effectué aucune modification.",
                });
            }
        } catch (error: any) {
            toast({
                title: "Erreur",
                description: error.message || "La mise à jour du profil a échoué.",
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
                title: "E-mail de réinitialisation de mot de passe envoyé",
                description: "Consultez votre boîte de réception pour créer un nouveau mot de passe.",
            });
        } catch (error) {
            toast({
                title: "Erreur",
                description: "L'envoi de l'e-mail de réinitialisation de mot de passe a échoué.",
                variant: 'destructive',
            });
        }
    };

    return (
        <Card>
            <CardHeader>
              <CardTitle>Informations sur le compte</CardTitle>
              <CardDescription>Gérez vos informations personnelles et de connexion.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="name">Nom complet</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={handleSaveChanges} disabled={isSubmitting}>
                    {isSubmitting ? "Enregistrement..." : "Enregistrer les modifications"}
                </Button>
                <Button variant="outline" onClick={handleCreatePassword}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    {isGoogleProvider() ? "Créer un mot de passe" : "Changer le mot de passe"}
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
            <CardTitle>Visibilité du Profil</CardTitle>
            <CardDescription>Contrôlez la visibilité de votre profil professionnel.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Profil Public</Label>
                <p className="text-sm text-muted-foreground">
                  Autoriser les entreprises à voir votre profil complet.
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
            <CardTitle>Alertes d'emploi</CardTitle>
            <CardDescription>Configurez vos notifications par e-mail pour les nouvelles opportunités d'emploi.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
              <div className="space-y-1">
                  <Label htmlFor="alert-frequency">Fréquence des notifications</Label>
                  <Select defaultValue="daily">
                      <SelectTrigger id="alert-frequency" className="w-[280px]">
                          <SelectValue placeholder="Sélectionner la fréquence" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="daily">Quotidien</SelectItem>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="never">Jamais</SelectItem>
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
                        <CardTitle>Membres de l'équipe</CardTitle>
                        <CardDescription>Gérez qui a accès au compte de votre entreprise.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="font-medium">Inviter un nouveau membre</p>
                            <Button>Envoyer une invitation</Button>
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
                        <CardTitle>Informations de facturation</CardTitle>
                        <CardDescription>Gérez votre abonnement et vos moyens de paiement.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Les fonctionnalités de facturation seront bientôt disponibles.</p>
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
                        <CardTitle>Contacts Clés</CardTitle>
                        <CardDescription>Gérez les points de contact principaux pour les partenariats industriels.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-1">
                            <Label htmlFor="contact-name">Nom du contact principal</Label>
                            <Input id="contact-name" defaultValue="Dr. Fatou Bamba" />
                        </div>
                         <div className="space-y-1">
                            <Label htmlFor="contact-email">Email du contact</Label>
                            <Input id="contact-email" type="email" defaultValue="partnerships@inphb.ci" />
                        </div>
                         <div className="flex items-center justify-between rounded-lg border p-4 mt-4">
                            <div className="space-y-0.5">
                            <Label className="text-base">Demandes de partenariat</Label>
                            <p className="text-sm text-muted-foreground">
                                Recevoir des notifications par e-mail pour les nouvelles demandes de partenariat d'entreprises.
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
    graduate: { icon: User, title: 'Vos Paramètres', description: 'Gérez les détails de votre compte personnel, la visibilité de votre profil et les notifications.' },
    company: { icon: Building, title: 'Paramètres de l\'entreprise', description: 'Gérez votre compte personnel, les membres de l\'équipe et la facturation.' },
    school: { icon: SchoolIcon, title: 'Paramètres de l\'école', description: 'Gérez votre compte personnel et les contacts de votre établissement.' },
    admin: { icon: Shield, title: 'Paramètres Administrateur', description: 'Gérez les détails de votre compte administrateur.' },
    super_admin: { icon: Shield, title: 'Paramètres Administrateur', description: 'Gérez les détails de votre compte administrateur.' },
    content_moderator: { icon: Shield, title: 'Paramètres Administrateur', description: 'Gérez les détails de votre compte administrateur.' },
    support_staff: { icon: Shield, title: 'Paramètres Administrateur', description: 'Gérez les détails de votre compte administrateur.' },
}

export default function SettingsPage() {
  const { role } = useAuth()

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
        {ActiveSettingsComponent ? <ActiveSettingsComponent /> : <p>Aucun paramètre disponible pour ce rôle.</p>}
    </div>
  );
}
