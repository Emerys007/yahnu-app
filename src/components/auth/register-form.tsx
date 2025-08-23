
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
                    title: "Impossible de charger les écoles",
                    description: "Un problème est survenu lors de la récupération de la liste des écoles. Veuillez réessayer plus tard.",
                    variant: "destructive"
                });
            }
        };

        fetchSchools();
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
                toastDescription = "Votre compte est en attente d'approbation de la part de l'administrateur de votre école. Nous vous informerons de son activation.";
                break;
            case 'company':
            case 'school':
                 toastDescription = "Votre inscription est en attente d'approbation par un administrateur de Yahnu. Nous vous informerons de son activation.";
                 break;
            case 'admin':
                toastDescription = "Compte administrateur créé. Vous pouvez maintenant vous connecter.";
                break;
        }

        toast({
            title: "Compte créé !",
            description: toastDescription,
          });

        router.push('/login');
    } catch (error: any) {
        toast({
            title: "Oh non ! Quelque chose s'est mal passé.",
            description: error.message || "Un problème est survenu avec votre demande.",
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
        title: "Connecté avec succès !",
        description: "Bienvenue sur Yahnu.",
      });
      router.push('/dashboard');
    } catch (error: any) {
      let errorMessage = error.message || "Impossible de se connecter avec Google.";
       if (error.message === "pending_graduate") {
            errorMessage = "Votre compte est en attente d'approbation de la part de l'administrateur de votre école.";
        } else if (error.message === 'pending_org') {
             errorMessage = "Votre inscription est en attente d'approbation par un administrateur de Yahnu.";
        } else if (error.message === "suspended") {
            errorMessage = "Votre compte a été suspendu. Veuillez contacter le support.";
        }
      toast({
        title: "Oh non ! Quelque chose s'est mal passé.",
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
            <h1 className="text-3xl font-bold">Créer un compte</h1>
            <p className="text-muted-foreground mt-2">
                Entrez vos informations pour créer un compte
            </p>
        </div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
         <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Je suis un(e)...</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre type de compte" />
                    </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        <SelectItem value="graduate">Diplômé(e)</SelectItem>
                        <SelectItem value="company">Représentant(e) d'entreprise</SelectItem>
                        <SelectItem value="school">Administrateur(trice) d'école</SelectItem>
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
                        <FormLabel>Prénom</FormLabel>
                        <FormControl><Input placeholder="John" {...field} disabled={isLoading} /></FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                />
                 <FormField
                    control={form.control} name="lastName"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Nom</FormLabel>
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
                  <FormLabel>Nom de l'entreprise</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la personne de contact</FormLabel>
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
                  <FormLabel>Nom de l'école</FormLabel>
                  <FormControl><Input {...field} disabled={isLoading} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField control={form.control} name="contactName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom de la personne de contact</FormLabel>
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
                <FormLabel>École/Université</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading || schools.length === 0}>
                    <FormControl>
                    <SelectTrigger>
                        <SelectValue placeholder="Sélectionnez votre école" />
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
                    <FormLabel>Secteur d'activité</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isLoading}>
                        <FormControl>
                            <SelectTrigger><SelectValue placeholder="Sélectionnez un secteur" /></SelectTrigger>
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
              <FormLabel>E-mail</FormLabel>
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
              <FormLabel>Mot de passe</FormLabel>
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
              <FormLabel>Confirmer le mot de passe</FormLabel>
              <FormControl>
                <PasswordInput placeholder="••••••••" {...field} disabled={isLoading} hideSuggestions />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Création du compte..." : "Créer un compte"}
        </Button>

        {role === 'graduate' && (
          <>
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <Separator />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Ou continuer avec</span>
                </div>
            </div>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleSignIn} disabled={isLoading}>
                <svg className="mr-2 h-4 w-4" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512"><path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 126 21.2 177 60.4L373 124.9c-32.5-30.3-74.2-48.7-125-48.7-93.1 0-170 73.1-170 180s76.9 180 170 180c101.4 0 148.2-73.3 152.8-112.3H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path></svg>
                S'inscrire avec Google
            </Button>
          </>
        )}

        <div className="mt-4 text-center text-sm">
            Vous avez déjà un compte ?
            <Link href="/login" className="underline ml-1">
                Se connecter
            </Link>
        </div>
      </form>
    </Form>
    </>
  )
}
