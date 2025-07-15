
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

const allSchools = [
    { id: "inp-hb", name: "Institut National Polytechnique Félix Houphouët-Boigny" },
    { id: "ufhb", name: "Université Félix Houphouët-Boigny" },
    { id: "csi", name: "Groupe CSI Pôle Polytechnique" },
];

const registerSchema = z.object({
  role: z.enum(['graduate', 'company', 'school']),
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  schoolId: z.string().optional(),
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(6, { message: "Password must be at least 6 characters." }),
}).refine(data => {
    if (data.role === 'graduate') {
        return !!data.schoolId;
    }
    return true;
}, {
    message: "School is required for graduates.",
    path: ["schoolId"],
});

export function RegisterForm() {
    const { t } = useLocalization();
    const { signUp } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);

  const form = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "graduate",
      schoolId: "",
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
        await signUp(values.name, values.email, values.password, values.role as UserProfile['role']);
        toast({
            title: t("Account Created!"),
            description: t("You have successfully signed up. Welcome to Yahnu!"),
          });
        router.push('/dashboard');
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
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                        <SelectItem value="company">{t("Company")}</SelectItem>
                        <SelectItem value="school">{t("School")}</SelectItem>
                    </SelectContent>
                </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{nameLabels[role]}</FormLabel>
              <FormControl>
                <Input placeholder={t("John Doe")} {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {role === 'graduate' && (
            <FormField
            control={form.control}
            name="schoolId"
            render={({ field }) => (
                <FormItem>
                <FormLabel>{t('School/University')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder={t("Select your school")} />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {allSchools.map(school => (
                            <SelectItem key={school.id} value={school.id}>{school.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FormMessage />
                </FormItem>
            )}
            />
        )}

        <FormField
          control={form.control}
          name="email"
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
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('Password')}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} disabled={isLoading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? t("Creating Account...") : t("Create Account")}
        </Button>
      </form>
    </Form>
  )
}
