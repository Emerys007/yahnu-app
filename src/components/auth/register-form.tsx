
"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useRouter } from "next/navigation"

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
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string().min(8, { message: "Password must be at least 8 characters." }),
    confirmPassword: z.string()
});

const graduateSchema = baseSchema.extend({
    firstName: z.string().min(2, { message: "First name is required." }),
    lastName: z.string().min(2, { message: "Last name is required." }),
    schoolId: z.string().min(1, { message: "School is required for graduates." }),
    companyName: z.string().optional(),
    schoolName: z.string().optional(),
    contactName: z.string().optional(),
    industry: z.string().optional(),
});

const companySchema = baseSchema.extend({
    companyName: z.string().min(2, { message: "Company name is required." }),
    contactName: z.string().min(2, { message: "Contact person name is required." }),
    industry: z.string().min(1, { message: "Industry sector is required." }),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    schoolName: z.string().optional(),
});

const schoolSchema = baseSchema.extend({
    schoolName: z.string().min(2, { message: "School name is required." }), // Use schoolName
    contactName: z.string().min(2, { message: "Contact person name is required." }),
    companyName: z.string().optional(), // Make companyName optional
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    schoolId: z.string().optional(),
    industry: z.string().optional(),
})

const adminSchema = baseSchema.extend({
    firstName: z.string().min(2, { message: "First name is required." }),
    lastName: z.string().min(2, { message: "Last name is required." }),
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
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export function RegisterForm() {
    const { t } = useLocalization();
    const { signUp, signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [schools, setSchools] = React.useState<SchoolOption[]>([]);

    React.useEffect(() => {
        const fetchSchools = async () => {
            try {
                const schoolsQuery = query(collection(db, "users"), where("role", "==", "school"), where("status", "==", "active"));
                const querySnapshot = await getDocs(schoolsQuery);
                const schoolList = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    name: doc.data().name as string
                }));
                setSchools(schoolList);
            } catch (error) {
                console.error("Failed to fetch schools:", error);
                toast({
                    title: "Could not load schools",
                    description: "There was a problem fetching the list of schools. Please try again later.",
                    variant: "destructive"
                });
            }
        };

        fetchSchools();
    }, [toast]);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: "graduate",
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
    graduate: t('Full name'),
    company: t('Company Name'),
    school: t('School Name'),
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
                toastDescription = t("Your account is pending approval from your school's administrator. We'll notify you once it's active.");
                break;
            case 'company':
            case 'school':
                 toastDescription = t("Your registration is pending approval from a Yahnu administrator. We'll notify you once it's active.");
                 break;
            case 'admin':
                toastDescription = t("Admin account created. You can now log in.");
                break;
        }

        toast({
            title: t("Account Created!"),
            description: toastDescription,
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

  async function handleGoogleSignIn() {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: t("Signed In Successfully!"),
        description: t("Welcome to Yahnu."),
      });
      router.push('/dashboard');
    } catch (error: any) {
      toast({
        title: t("Uh oh! Something went wrong."),
        description: error.message || t("Could not sign in with Google."),
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
        <div className="text-center">
            <h1 className="text-3xl font-bold">{t('Create an Account')}</h1>
            <p className="text-muted-foreground mt-2">
                {t('Enter your information to create an account')}
            </p>
        </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("I am a...")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("Select your account type")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="graduate">{t("Graduate")}</SelectItem>
                        <SelectItem value="company">{t("Company Representative")}</SelectItem>
                        <SelectItem value="school">{t("School Administrator")}</SelectItem>
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
        )}

        {role === 'company' && (
          <>
            <FormField control={form.control} name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Company Name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Contact Person Name')}</FormLabel>
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
                  <FormLabel>{t('School Name')}</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Contact Person Name')}</FormLabel>
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
                <FormLabel>{t('School/University')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || schools.length === 0}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("Select your school")} />
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
                    <FormLabel>{t('Industry Sector')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder={t("Select an industry")} /></SelectTrigger>
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
              <FormLabel>{t('Email')}</FormLabel>
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
            {isLoading ? t("Creating Account...") : t("Create Account")}
        </Button>
        
        {role === 'graduate' && (
          <>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                </div>
            </div>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177 60.4L373 124.9c-32.5-30.3-74.2-48.7-125-48.7-93.1 0-170 73.1-170 180s76.9 180 170 180c101.4 0 148.2-73.3 152.8-112.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                {t('Sign up with Google')}
            </Button>
          </>
        )}

        <div className="mt-4 text-center text-sm">
            {t('Already have an account?')}
            <Link href="/login" className="underline ml-1">
                {t('Sign in')}
            </Link>
        </div>
      </form>
    </Form>
  )
}
