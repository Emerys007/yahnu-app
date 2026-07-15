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
import Link from "next/link"
import { apiFetch } from "@/lib/api-client"

type SchoolOption = {
    id: string;
    name: string;
}

type SchoolsResponse = {
    data: {
        schools: SchoolOption[];
    };
}

const industrySectors = [
    "Agriculture", "Finance & Banking", "Information Technology", "Telecommunications",
    "Mining & Resources", "Construction & Real Estate", "Retail & Commerce",
    "Transportation & Logistics", "Tourism & Hospitality", "Health & Pharmaceuticals",
    "Education", "Energy"
];

const baseSchema = z.object({
    role: z.enum(['graduate', 'company', 'school']),
    email: z.string().email({ message: "Please enter a valid email address." }),
    password: z.string()
        .min(12, { message: "Password must be at least 12 characters." })
        .max(128, { message: "Password must be 128 characters or fewer." })
        .regex(/[A-Za-z]/, { message: "Password must include at least one letter and one number." })
        .regex(/\d/, { message: "Password must include at least one letter and one number." }),
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

const registerSchema = z.discriminatedUnion("role", [
    graduateSchema.extend({ role: z.literal("graduate") }),
    companySchema.extend({ role: z.literal("company") }),
    schoolSchema.extend({ role: z.literal("school") }),
]).refine(data => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
});

export function RegisterForm() {
    const { t } = useLocalization();
    const { signUp } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isLoading, setIsLoading] = React.useState(false);
    const [schools, setSchools] = React.useState<SchoolOption[]>([]);

    React.useEffect(() => {
        const controller = new AbortController();
        const fetchSchools = async () => {
            try {
                const response = await apiFetch<SchoolsResponse>('/api/schools', { signal: controller.signal });
                setSchools(response.data.schools);
            } catch (error) {
                if (controller.signal.aborted) return;
                console.error("Failed to fetch schools:", error);
                toast({
                    title: "Could not load schools",
                    description: "There was a problem fetching the list of schools. Please try again later.",
                    variant: "destructive"
                });
            }
        };

        void fetchSchools();
        return () => controller.abort();
    }, [toast]);

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
    graduate: t('Full name'),
    company: t('Company Name'),
    school: t('School Name'),
  };

  async function onSubmit(values: z.infer<typeof registerSchema>) {
    setIsLoading(true);
    try {
        let name: string | undefined;
        let profileData: Omit<UserProfile, 'uid' | 'status'>;

        if (values.role === 'graduate') {
            name = `${values.firstName} ${values.lastName}`;
            profileData = { ...values, name, email: values.email, role: values.role };
        } else if (values.role === 'company') {
            name = values.companyName;
            profileData = { ...values, name, email: values.email, role: values.role };
        } else { // school
            name = values.schoolName;
            profileData = { ...values, name, email: values.email, role: values.role };
        }

        const registration = await signUp(profileData, values.password);

        let toastDescription = "";
        switch(role) {
            case 'graduate':
                toastDescription = t("Your account is pending approval from your school's administrator. We'll notify you once it's active.");
                break;
            case 'company':
            case 'school':
                 toastDescription = t("Your registration is pending approval from a Yahnu administrator. We'll notify you once it's active.");
                 break;
        }

        toast({
            title: t("Account Created!"),
            description: registration.emailDelivery === 'failed'
                ? t("Your account was created, but the verification email could not be delivered. Please use the resend-verification page or contact support.")
                : toastDescription,
          });

        if (registration.debugUrl) {
            window.location.assign(registration.debugUrl);
            return;
        }
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

  return (
    <Form {...form}>
        <div className="text-center">
            <h1 className="text-3xl font-bold">{t('common.create_an_account')}</h1>
            <p className="text-muted-foreground mt-2">
                {t('auth.enter_info_to_create_account')}
            </p>
        </div>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("auth.i_am_a")}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("auth.select_account_type")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="graduate">{t("auth.graduate")}</SelectItem>
                        <SelectItem value="company">{t("auth.company_representative")}</SelectItem>
                        <SelectItem value="school">{t("auth.school_administrator")}</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === 'graduate' && (
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
            {isLoading ? t('auth.creating_account') : t('auth.create_account')}
        </Button>

        <div className="mt-4 text-center text-sm">
            {t('common.already_have_an_account')}
            <Link href="/login" className="underline ml-1">
                {t('common.sign_in')}
            </Link>
        </div>
      </form>
    </Form>
  )
}
