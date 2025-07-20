
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card"
import { Logo } from "@/components/ui/logo"
import { useAuth, type UserProfile, type Role } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLocalization } from "@/context/localization-context"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "@/components/ui/separator"
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { Loader2, ShieldCheck, AlertTriangle } from "lucide-react"

const adminRegisterSchema = z.object({
    firstName: z.string().min(2, { message: "First name is required." }),
    lastName: z.string().min(2, { message: "Last name is required." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});


type InviteData = {
    email: string;
    role: Role;
    status: 'pending' | 'used';
}

export default function AdminRegistrationPage() {
    const { t } = useLocalization();
    const { signUp } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const params = useParams();
    const token = params.token as string;
    
    const [isLoading, setIsLoading] = React.useState(false);
    const [isValidating, setIsValidating] = React.useState(true);
    const [inviteData, setInviteData] = React.useState<InviteData | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError("Invalid invitation link.");
                setIsValidating(false);
                return;
            }
            try {
                const inviteDocRef = doc(db, "invites", token);
                const docSnap = await getDoc(inviteDocRef);

                if (docSnap.exists() && docSnap.data().status === 'pending') {
                    setInviteData(docSnap.data() as InviteData);
                } else {
                    setError("This invitation is invalid or has already been used.");
                }
            } catch (err) {
                console.error("Token validation error:", err);
                setError("An error occurred while validating the invitation.");
            } finally {
                setIsValidating(false);
            }
        };
        validateToken();
    }, [token]);

  const form = useForm<z.infer<typeof adminRegisterSchema>>({
    resolver: zodResolver(adminRegisterSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values: z.infer<typeof adminRegisterSchema>) {
    if (!inviteData) return;
    setIsLoading(true);

    try {
        const name = `${values.firstName} ${values.lastName}`;
        const profileData: Omit<UserProfile, 'uid' | 'status'> = { 
            name, 
            firstName: values.firstName, 
            lastName: values.lastName,
            email: inviteData.email,
            role: inviteData.role,
        };
        
        await signUp(profileData, values.password, token);

        toast({
            title: t("Account Created!"),
            description: t("Your administrator account has been created. You can now log in."),
          });
        
        router.push('/login');
    } catch (error: any) {
        toast({
            title: t("Uh oh! Something went wrong."),
            description: error.message || t("There was a problem with your request."),
            variant: "destructive",
          });
    } finally {
        setIsLoading(false);
    }
  }
  
  const getRoleDisplayName = (role: Role) => {
    const roleMap: Record<Role, string> = {
        admin: 'Admin',
        super_admin: 'Super Admin',
        content_moderator: 'Content Moderator',
        support_staff: 'Support Staff',
        graduate: 'Graduate',
        company: 'Company',
        school: 'School'
    }
    return t(roleMap[role] || role);
  }

  if (isValidating) {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/40 p-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">{t("Validating invitation...")}</p>
        </div>
    )
  }

  if (error) {
     return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-muted/40 p-4 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive" />
            <h1 className="text-2xl font-bold mt-4">{t("Invitation Error")}</h1>
            <p className="mt-2 text-muted-foreground">{t(error)}</p>
            <Button asChild className="mt-6">
                <Link href="/">{t("Return to Homepage")}</Link>
            </Button>
        </div>
    )
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
             <div className="mx-auto w-fit mb-4">
                <Logo className="h-12 w-12" />
            </div>
            <CardTitle className="text-2xl">{t('Complete Your Admin Registration')}</CardTitle>
            <CardDescription>{t('You have been invited to join Yahnu as a {role}.', { role: getRoleDisplayName(inviteData!.role) })}</CardDescription>
        </CardHeader>
        <CardContent>
             <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control} name="firstName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('First Name')}</FormLabel>
                            <FormControl><Input placeholder="John" {...field} disabled={isLoading} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control} name="lastName"
                        render={({ field }) => (
                            <FormItem>
                            <FormLabel>{t('Last Name')}</FormLabel>
                            <FormControl><Input placeholder="Doe" {...field} disabled={isLoading} /></FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control} name="email"
                    render={() => (
                        <FormItem>
                        <FormLabel>{t('Email')}</FormLabel>
                        <FormControl><Input type="email" value={inviteData!.email} disabled /></FormControl>
                        </FormItem>
                    )}
                />
                <FormField
                control={form.control} name="password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('Password')}</FormLabel>
                    <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} disabled={isLoading} onSuggest={(p) => { form.setValue('password', p); form.setValue('confirmPassword', p, {shouldValidate: true}) }}/>
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control} name="confirmPassword"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>{t('Confirm Password')}</FormLabel>
                    <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} disabled={isLoading} hideSuggestions />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <Button type="submit" className="w-full" disabled={isLoading}>
                     {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldCheck className="mr-2 h-4 w-4" />}
                     {isLoading ? t("Creating Account...") : t("Create Admin Account")}
                </Button>
            </form>
            </Form>
        </CardContent>
      </Card>
    </div>
  );
}
