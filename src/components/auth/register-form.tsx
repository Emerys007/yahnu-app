

"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter, useSearchParams } from "next/navigation"

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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
  } from "@/components/ui/select"
import { useAuth, type UserProfile } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { useLocalization } from "@/context/localization-context"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "../ui/separator"
import Link from "next/link"
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

type SchoolOption = {
    id: string;
    name: string;
}

const industrySectors = [
    "Agriculture", "Finance & Banking", "Information Technology", "Telecommunications",
    "Mining & Resources", "Construction & Real Estate", "Retail & Commerce",
    "Transportation & Logistics", "Tourism & Hospitality", "Health & Pharmaceuticals",
    "Education", "Energy"
];

const baseSchema = z.object({
    role: z.enum(['graduate', 'company', 'school', 'admin']),
    email: z.string().email({ message: "Veuillez saisir une adresse e-mail valide." }),
    password: z.string().min(8, { message: "Le mot de passe doit comporter au moins 8 caractères." }),
    confirmPassword: z.string()
});

const graduateSchema = baseSchema.extend({
    firstName: z.string().min(2, { message: "Le prénom est requis." }),
    lastName: z.string().min(2, { message: "Le nom de famille est requis." }),
    schoolId: z.string().min(1, { message: "L'école est requise pour les diplômés." }),
    companyName: z.string().optional(),
    schoolName: z.string().optional(),
    contactName: z.string().optional(),
    industry: z.string().optional(),
});

const companySchema = baseSchema.extend({
    companyName: z.string().min(2, { message: "Le nom de l'entreprise est requis." }),
    contactName: z.string().min(2, { message: "Le nom de la personne de contact est requis." }),
    industry: z.string().min(1, { message: "Le secteur d'activité est requis." }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    schoolName: z.string().optional(),
});

const schoolSchema = baseSchema.extend({
    schoolName: z.string().min(2, { message: "Le nom de l'école est requis." }), // Use schoolName
    contactName: z.string().min(2, { message: "Le nom de la personne de contact est requis." }),
    companyName: z.string().optional(), // Make companyName optional
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    industry: z.string().optional(),
})

const adminSchema = baseSchema.extend({
    firstName: z.string().min(2, { message: "Le prénom est requis." }),
    lastName: z.string().min(2, { message: "Le nom de famille est requis." }),
    companyName: z.string().optional(),
    schoolName: z.string().optional(),
    contactName: z.string().optional(),
    industry: z.string().optional(),
    schoolId: z.string().optional(),
})

const registerSchema = z.discriminatedUnion("role", [
    graduateSchema.extend({ role: z.literal("graduate") }),
    companySchema.extend({ role: z.literal("company") }),
    schoolSchema.extend({ role: z.literal("school") }),
    adminSchema.extend({ role: z.literal("admin") }),
]).refine(data => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
});

export function RegisterForm() {
    const { t } = useLocalization();
    const { signUp, signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = React.useState(false);
    const [schools, setSchools] = React.useState<SchoolOption[]>([]);

    React.useEffect(() => {
        const fetchSchools = async () => {
            try {
                const schoolsQuery = query(collection(db, "users"), where("role", "==", "school"));
                const querySnapshot = await getDocs(schoolsQuery);
                const schoolList = querySnapshot.docs
                  .filter(doc => doc.data().status === 'active')
                  .map(doc => ({
                    id: doc.id,
                    name: doc.data().name as string
                }));
                setSchools(schoolList);
            } catch (error) {
                console.error("Failed to fetch schools:", error);
                toast({
                    title: t("auth.school_load_failed_title"),
                    description: t("auth.school_load_failed_desc"),
                    variant: "destructive"
                });
            }
        };

        fetchSchools();
    }, [toast, t]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: searchParams.get('role') === 'school_administrator' ? 'school' : searchParams.get('role') === 'graduate' ? 'graduate' : searchParams.get('role') === 'company' ? 'company' : searchParams.get('type') === 'school' ? 'school' : searchParams.get('type') === 'company' ? 'company' : "graduate",
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      schoolId: "",
      companyName: "",
      schoolName: "",
      contactName: "",
      industry: "",
    },
  });

  const role = form.watch("role");

  const nameLabels = {
    graduate: t('common.full_name'),
    company: t('common.company_name'),
    school: t('common.school_name'),
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
        let name: string | undefined;
        let profileData: Omit<UserProfile, 'uid' | 'status'>;

        if (values.role === 'graduate' || values.role === 'admin') {
            name = `${values.firstName} ${values.lastName}`;
            profileData = { ...values, name, email: values.email, role: values.role };
        } else if (values.role === 'company') {
            name = values.companyName;
            profileData = { ...values, name, email: values.email, role: values.role };
        } else { // school
            name = values.schoolName;
            profileData = { ...values, name, email: values.email, role: values.role };
        }

        await signUp(profileData, values.password);

        let toastDescription = "";
        switch(role) {
            case 'graduate':
                toastDescription = t("auth.pending_graduate");
                break;
            case 'company':
            case 'school':
                 toastDescription = t("auth.pending_org");
                 break;
            case 'admin':
                toastDescription = t("auth.admin_account_created");
                break;
        }

        toast({
            title: t("auth.account_created_title"),
            description: toastDescription,
          });

        router.push('/login');
    } catch (error: any) {
        toast({
            title: t("common.error"),
            description: error.message || t("auth.request_problem"),
            variant: "destructive",
          });
    } finally {
        setIsLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: t("auth.login_success_title"),
        description: t("auth.welcome_back_yahnu"),
      });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = error.message || t("auth.google_login_failed");
       if (error.message === "pending_graduate") {
            errorMessage = t("auth.pending_graduate");
        } else if (error.message === 'pending_org') {
             errorMessage = t("auth.pending_org");
        } else if (error.message === "suspended") {
            errorMessage = t("auth.suspended");
        }
      toast({
        title: t("common.error"),
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
        <div className="text-center">
            <h1 className="text-3xl font-bold">{t("auth.create_account")}</h1>
            <p className="text-muted-foreground mt-2">
                {t('auth.enter_info_to_create_account')}
            </p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('auth.i_am_a')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("auth.select_account_type")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="graduate">{t('auth.graduate')}</SelectItem>
                        <SelectItem value="company">{t('auth.company_representative')}</SelectItem>
                        <SelectItem value="school">{t('auth.school_administrator')}</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {(role === 'graduate' || role === 'admin') && (
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control} name="firstName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('common.first_name')}</FormLabel>
                        <FormControl><Input placeholder="John" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>{t('common.last_name')}</FormLabel>
                        <FormControl><Input placeholder="Doe" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </div>
        )}

        {role === 'company' && (
          <>
            <FormField control={form.control} name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.company_name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.contact_person_name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}

        {role === 'school' && (
          <>
            <FormField control={form.control} name="schoolName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('common.school_name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.contact_person_name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </>
        )}


        {role === 'graduate' && (
            <FormField
            control={form.control} name="schoolId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('common.school_university')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || schools.length === 0}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("common.select_your_school")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {schools.map(school => (
                            <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

        {role === 'company' && (
             <FormField control={form.control} name="industry"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>{t('common.industry_sector')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder={t("common.select_an_industry")} /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            {industrySectors.map(sector => (
                                <SelectItem key={sector} value={sector}>{t(sector)}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <FormMessage />
                </FormItem>
                )}
             />
        )}


        <FormField
          control={form.control} name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.email')}</FormLabel>
              <FormControl>
                <Input type="email" placeholder="you@example.com" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control} name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('common.password')}</FormLabel>
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
              <FormLabel>{t('common.confirm_password')}</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} disabled={isLoading} hideSuggestions />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t('auth.creating_account') : t("auth.create_account")}
        </Button>

        {role === 'graduate' && (
          <>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">{t('auth.or_continue_with')}</span>
                </div>
            </div>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177 60.4L373 124.9c-32.5-30.3-74.2-48.7-125-48.7-93.1 0-170 73.1-170 180s76.9 180 170 180c101.4 0 148.2-73.3 152.8-112.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                {t('common.sign_up_with_google')}
            </Button>
          </>
        )}

        <div className="mt-4 text-center text-sm">
            {t("common.already_have_an_account")}
            <Link href="/login" className="underline ml-1">
                {t('common.sign_in')}
            </Link>
        </div>
      </form>
    </Form>
    </>
  )
}
