
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
import { useAuth } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"
import { useLocalization } from "@/context/localization-context"
import { PasswordInput } from "@/components/ui/password-input"
import { Separator } from "../ui/separator"

const loginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(1, { message: "Password is required." }),
})

export function LoginForm() {
    const { t } = useLocalization();
    const { signIn, signInWithGoogle } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);


  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(values: z.infer<typeof loginSchema>) {
    setIsLoading(true);
    try {
        await signIn(values.email, values.password);
        toast({
            title: t("Logged In Successfully!"),
            description: t("Welcome back to Yahnu."),
        });
        router.push('/dashboard');
    } catch (error: any) {
        let errorMessage = t("Invalid credentials. Please try again.");
        if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = t("Invalid email or password. Please check your credentials.");
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = t("Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.")
        } else if (error.message === 'pending_graduate') {
            errorMessage = t("Your account is pending approval. Please contact your school's administrator.");
        } else if (error.message === 'pending_org') {
             errorMessage = t("Your account is pending approval. Please contact a Yahnu administrator.");
        } else if (error.message === "suspended") {
            errorMessage = t("Your account has been suspended. Please contact support.");
        }

        toast({
            title: t("Uh oh! Login Failed."),
            description: errorMessage,
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
      let errorMessage = error.message || t("Could not sign in with Google.");
       if (error.message === "pending_graduate") {
            errorMessage = t("Your account is pending approval. Please contact your school's administrator.");
        } else if (error.message === 'pending_org') {
             errorMessage = t("Your account is pending approval. Please contact a Yahnu administrator.");
        } else if (error.message === "suspended") {
            errorMessage = t("Your account has been suspended. Please contact support.");
        }
      toast({
        title: t("Uh oh! Something went wrong."),
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
            <h1 className="text-3xl font-bold">{t('Welcome Back')}</h1>
            <p className="text-muted-foreground mt-2">
                {t('Enter your email below to login to your account')}
            </p>
        </div>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
                    <div className="flex items-center">
                        <FormLabel>{t('Password')}</FormLabel>
                        <Link href="/forgot-password" className="ml-auto inline-block text-sm underline">
                            {t('Forgot your password?')}
                        </Link>
                    </div>
                    <FormControl>
                        <PasswordInput placeholder="••••••••" {...field} disabled={isLoading} hideSuggestions />
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )}
            />
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? t("Logging in...") : t("Login")}
            </Button>
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
                 {t('Login with Google')}
            </Button>
        </form>
        </Form>
        <div className="mt-4 text-center text-sm">
            {t("Don't have an account?")}
            <Link href="/signup" className="underline ml-1">
                {t('Sign up')}
            </Link>
        </div>
    </>
  )
}
