
"use client"

import React, { useState } from 'react'
import Link from "next/link"
import { Eye, EyeOff, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Logo } from "@/components/logo"
import { useLocalization } from "@/context/localization-context"
import type { Role } from "@/context/auth-context"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" width="24px" height="24px" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C42.021,35.596,44,30.138,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
    </svg>
  )
}

const industrySectors = [
    "Agriculture",
    "Finance & Banking",
    "Information Technology",
    "Telecommunications",
    "Mining & Resources",
    "Construction & Real Estate",
    "Retail & Commerce",
    "Transportation & Logistics",
    "Tourism & Hospitality",
    "Health & Pharmaceuticals",
    "Education",
    "Energy"
]

export function RegisterForm() {
  const { t } = useLocalization();
  const { toast } = useToast();
  const [accountType, setAccountType] = useState<Role | ''>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [suggestedPassword, setSuggestedPassword] = useState("");

  const handleAccountTypeChange = (value: string) => {
    setAccountType(value as Role);
  };

  const generateStrongPassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+~`|}{[]:;?><,./-=";
    let password = "";
    for (let i = 0; i < 14; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSuggestedPassword(password);
  }

  const copyToClipboard = () => {
      if (!suggestedPassword) return;
      navigator.clipboard.writeText(suggestedPassword);
      toast({
          title: t('Password Copied'),
          description: t('The suggested password has been copied to your clipboard.'),
      });
  }
  
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <div className="flex flex-col items-center mb-4 lg:hidden">
            <Link href="/" aria-label="Back to home" className="flex flex-col items-center gap-2 text-center">
              <Logo className="h-12 w-12" />
              <p className="font-bold text-xl text-primary">Yahnu</p>
              <p className="text-sm text-muted-foreground">{t('Your future starts here')}</p>
            </Link>
        </div>
        <CardTitle className="text-2xl text-center">{t('Create an Account')}</CardTitle>
        <CardDescription className="text-center">
          {t('Enter your information to create an account')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="account-type">{t('I am a...')}</Label>
            <Select onValueChange={handleAccountTypeChange}>
              <SelectTrigger id="account-type">
                <SelectValue placeholder={t('Select your account type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="graduate">{t('Graduate')}</SelectItem>
                <SelectItem value="company">{t('Company')}</SelectItem>
                <SelectItem value="school">{t('School')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {accountType && (
            <>
              <div className="grid gap-2">
                <Label htmlFor="full-name">{accountType === 'graduate' ? t('Full name') : t('Contact Person Name')}</Label>
                <Input id="full-name" placeholder="Max Robinson" required />
              </div>

              {accountType === 'company' && (
                  <>
                    <div className="grid gap-2">
                        <Label htmlFor="company-name">{t('Company Name')}</Label>
                        <Input id="company-name" placeholder="Innovate Inc." required />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="industry-sector">{t('Industry Sector')}</Label>
                         <Select>
                            <SelectTrigger>
                                <SelectValue placeholder={t('Select an industry')} />
                            </SelectTrigger>
                            <SelectContent>
                                {industrySectors.map(sector => (
                                    <SelectItem key={sector} value={sector}>{t(sector)}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                  </>
              )}
              {accountType === 'school' && (
                  <div className="grid gap-2">
                      <Label htmlFor="school-name">{t('School Name')}</Label>
                      <Input id="school-name" placeholder="Prestige University" required />
                  </div>
              )}
               {accountType === 'graduate' && (
                  <div className="grid gap-2">
                      <Label htmlFor="graduate-school">{t('School/University')}</Label>
                       <Select>
                          <SelectTrigger>
                            <SelectValue placeholder={t('Select your school')} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inphb">INP-HB</SelectItem>
                            <SelectItem value="ufhb">UFHB</SelectItem>
                            <SelectItem value="csi">Groupe CSI</SelectItem>
                          </SelectContent>
                        </Select>
                  </div>
              )}

              <div className="grid gap-2">
                <Label htmlFor="email">{t('Email')}</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="password">{t('Password')}</Label>
                <div className="relative">
                    <Input id="password" type={showPassword ? "text" : "password"} className="pr-10" />
                    <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowPassword(!showPassword)}>
                        {showPassword ? <EyeOff /> : <Eye />}
                        <span className="sr-only">{ showPassword ? t('Hide password') : t('Show password')}</span>
                    </Button>
                </div>
              </div>

              {(accountType === 'company' || accountType === 'school') && (
                <div className="grid gap-2">
                  <Label htmlFor="confirm-password">{t('Confirm Password')}</Label>
                  <div className="relative">
                    <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} className="pr-10" />
                     <Button type="button" variant="ghost" size="icon" className="absolute top-0 right-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                        {showConfirmPassword ? <EyeOff /> : <Eye />}
                        <span className="sr-only">{ showConfirmPassword ? t('Hide password') : t('Show password')}</span>
                    </Button>
                  </div>
                </div>
              )}

              {(accountType === 'company' || accountType === 'school') && (
                <div>
                   <Button type="button" variant="link" size="sm" className="p-0 h-auto" onClick={generateStrongPassword}>
                        <Sparkles className="mr-2 h-4 w-4" />
                        {t('Suggest strong password')}
                   </Button>
                   {suggestedPassword && (
                    <Alert className="mt-2">
                        <AlertDescription className="flex items-center justify-between gap-4">
                            <code className="break-all">{suggestedPassword}</code>
                            <Button type="button" size="sm" onClick={copyToClipboard}>{t('Copy')}</Button>
                        </AlertDescription>
                    </Alert>
                   )}
                </div>
              )}
              
              <Button type="submit" className="w-full" asChild>
                <Link href="/login">{t('Create an account')}</Link>
              </Button>
              <div className="relative my-2">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">OR</span>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                 <GoogleIcon className="mr-2" />
                {t('Sign up with Google')}
              </Button>
            </>
          )}

        </div>
        <div className="mt-4 text-center text-sm">
          {t('Already have an account?')}
          <Link href="/login" className="underline ml-1">
            {t('Sign in')}
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
