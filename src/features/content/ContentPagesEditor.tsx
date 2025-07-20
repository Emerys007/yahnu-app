
"use client"

import React, { useState, useEffect } from "react"
import { useForm, useFieldArray, UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useLocalization } from "@/context/localization-context"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, PlusCircle, Trash2 } from "lucide-react"
import { doc, getDoc, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RichTextEditor } from "@/components/ui/rich-text-editor"
import { Separator } from "@/components/ui/separator"

// --- Schemas and Default Values (Defined at the top level) ---

const teamMemberSchema = z.object({
  name: z.string().min(1, "Name is required."),
  role: z.string().min(1, "Role is required."),
  imageUrl: z.string().url("Must be a valid URL.").or(z.literal("")),
});

const aboutPageSchema = z.object({
    aboutTitle: z.string().min(1, "Required"),
    aboutSubtitle: z.string().min(1, "Required"),
    storyTitle: z.string().min(1, "Required"),
    storyContent1: z.string().min(1, "Required"),
    storyContent2: z.string().min(1, "Required"),
    missionTitle: z.string().min(1, "Required"),
    missionContent: z.string().min(1, "Required"),
    visionTitle: z.string().min(1, "Required"),
    visionContent: z.string().min(1, "Required"),
    valuesTitle: z.string().min(1, "Required"),
    valuesContent: z.string().min(1, "Required"),
    teamMembers: z.array(teamMemberSchema).optional(),
});

const legalPageSchema = z.object({
    title: z.string().min(1, "Required"),
    lastUpdated: z.string().min(1, "Required"),
    content: z.string().min(50, "Content must be at least 50 characters."),
})

const defaultAboutValues: z.infer<typeof aboutPageSchema> = {
    aboutTitle: "About Yahnu",
    aboutSubtitle: "We are on a mission to bridge the gap between education and employment, creating a thriving ecosystem for talent to connect with opportunity in {country} and beyond.",
    storyTitle: "Our Story",
    storyContent1: "<p>Founded by a team of educators and entrepreneurs, Yahnu was born from a shared vision: to unlock the immense potential of graduates by directly connecting them with the industries that need their skills. We saw a disconnect between the classroom and the workplace and set out to build the bridge.</p>",
    storyContent2: "<p>Today, Yahnu is a dynamic platform that empowers students to launch their careers, helps companies find the right talent efficiently, and enables schools to forge meaningful industry partnerships. We believe in building futures, one connection at a time.</p>",
    missionTitle: "Our Mission",
    missionContent: "<p>To empower graduates, companies, and schools by creating a seamless and efficient ecosystem for talent development and career growth.</p>",
    visionTitle: "Our Vision",
    visionContent: "<p>To be the leading platform for professional connection and opportunity in Africa, driving economic growth and individual success.</p>",
    valuesTitle: "Our Values",
    valuesContent: "<p>Integrity, Innovation, Collaboration, and an unwavering commitment to the success of our users.</p>",
    teamMembers: [
        { name: "Colombe Koffi", role: "Founder & CEO", imageUrl: "/images/Colombe Koffi.jpeg" },
        { name: "Joël K", role: "Head of Product & Lead Engineer", imageUrl: "/images/Joel K.jpeg" },
        { name: "Bethel Touman", role: "Data Engineer", imageUrl: "/images/Bethel_Touman.jpeg" },
    ]
}

const defaultPrivacyPolicy: z.infer<typeof legalPageSchema> = {
    title: "Privacy Policy",
    lastUpdated: "January 15, 2025",
    content: `<p>This Privacy Policy describes Our policies and procedures on the collection, use and disclosure of Your information when You use the Service and tells You about Your privacy rights and how the law protects You.</p><h2>Interpretation and Definitions</h2><h3>Interpretation</h3><p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p><h3>Definitions</h3><p>For the purposes of this Privacy Policy:</p><ul><li><strong>Account</strong> means a unique account created for You to access our Service or parts of our Service.</li><li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Yahnu.</li><li><strong>Cookies</strong> are small files that are placed on Your computer, mobile device or any other device by a website, containing the details of Your browsing history on that website among its many uses.</li><li><strong>Country</strong> refers to: Côte d'Ivoire</li><li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li><li><strong>Personal Data</strong> is any information that relates to an identified or identifiable individual.</li><li><strong>Service</strong> refers to the Website.</li><li><strong>Usage Data</strong> refers to data collected automatically, either generated by the use of the Service or from the Service infrastructure itself (for example, the duration of a page visit).</li><li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li></ul><h2>Collecting and Using Your Personal Data</h2><h3>Types of Data Collected</h3><h4>Personal Data</h4><p>While using Our Service, We may ask You to provide Us with certain personally identifiable information that can be used to contact or identify You. Personally identifiable information may include, but is not limited to:</p><ul><li>Email address</li><li>First name and last name</li><li>Phone number</li><li>Usage Data</li></ul><h2>Use of Your Personal Data</h2><p>The Company may use Personal Data for the following purposes:</p><ul><li>To provide and maintain our Service, including to monitor the usage of our Service.</li><li>To manage Your Account: to manage Your registration as a user of the Service. The Personal Data You provide can give You access to different functionalities of the Service that are available to You as a registered user.</li></ul><h2>Changes to this Privacy Policy</h2><p>We may update Our Privacy Policy from time to time. We will notify You of any changes by posting the new Privacy Policy on this page.</p><p>We will let You know via email and/or a prominent notice on Our Service, prior to the change becoming effective and update the "Last updated" date at the top of this Privacy Policy.</p><p>You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p><h2>Contact Us</h2><p>If you have any questions about this Privacy Policy, You can contact us:</p><ul><li>By email: <strong>contact@yahnu.org</strong></li></ul>`
};

const defaultTerms: z.infer<typeof legalPageSchema> = {
    title: "Terms of Service",
    lastUpdated: "January 15, 2025",
    content: `<p>Please read these terms and conditions carefully before using Our Service.</p><h2>Interpretation and Definitions</h2><h3>Interpretation</h3><p>The words of which the initial letter is capitalized have meanings defined under the following conditions. The following definitions shall have the same meaning regardless of whether they appear in singular or in plural.</p><h3>Definitions</h3><p>For the purposes of these Terms and Conditions:</p><ul><li><strong>Country</strong> refers to: Côte d'Ivoire</li><li><strong>Company</strong> (referred to as either "the Company", "We", "Us" or "Our" in this Agreement) refers to Yahnu.</li><li><strong>Device</strong> means any device that can access the Service such as a computer, a cellphone or a digital tablet.</li><li><strong>Service</strong> refers to the Website.</li><li><strong>Terms and Conditions</strong> (also referred to as "Terms") mean these Terms and Conditions that form the entire agreement between You and the Company regarding the use of the Service.</li><li><strong>You</strong> means the individual accessing or using the Service, or the company, or other legal entity on behalf of which such individual is accessing or using the Service, as applicable.</li></ul><h2>Acknowledgment</h2><p>These are the Terms and Conditions governing the use of this Service and the agreement that operates between You and the Company. These Terms and Conditions set out the rights and obligations of all users regarding the use of the Service.</p><p>Your access to and use of the Service is conditioned on Your acceptance of and compliance with these Terms and Conditions. These Terms and Conditions apply to all visitors, users and others who access or use the Service.</p><h2>User Accounts</h2><p>When You create an account with Us, You must provide Us information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of Your account on Our Service.</p><h2>Termination</h2><p>We may terminate or suspend Your Account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if You breach these Terms and Conditions.</p><h2>Changes to These Terms and Conditions</h2><p>We reserve the right, at Our sole discretion, to modify or replace these Terms at any time. If a revision is material We will make reasonable efforts to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at Our sole discretion.</p><h2>Contact Us</h2><p>If you have any questions about these Terms and Conditions, You can contact us:</p><ul><li>By email: <strong>contact@yahnu.org</strong></li></ul>`
};

// --- Helper Component ---

const PageFormWrapper = ({ pageId, schema, defaultValues, children }: { pageId: string, schema: any, defaultValues: any, children: (form: any, isSaving: boolean) => React.ReactNode }) => {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm({
        resolver: zodResolver(schema),
        defaultValues: defaultValues,
    });

    useEffect(() => {
        const fetchContent = async () => {
            setIsLoading(true);
            try {
                const docRef = doc(db, "pages", pageId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (pageId === 'about-us' && (!data.teamMembers || !Array.isArray(data.teamMembers))) {
                        data.teamMembers = defaultValues.teamMembers;
                    }
                    form.reset(data);
                } else {
                    form.reset(defaultValues);
                }
            } catch (error) {
                 console.error("Failed to fetch page content:", error);
                 form.reset(defaultValues);
            } finally {
                setIsLoading(false);
            }
        }
        fetchContent();
    }, [form, pageId, defaultValues]);

    const onSubmit = async (values: z.infer<any>) => {
        setIsSaving(true);
         try {
            const docRef = doc(db, "pages", pageId);
            await setDoc(docRef, values, { merge: true });
            toast({
                title: "Content Updated",
                description: "The page content has been saved.",
            });
        } catch (error) {
            console.error("Failed to save content:", error);
            toast({ title: "Error", description: "Failed to save page content.", variant: "destructive" });
        } finally {
            setIsSaving(false);
        }
    }

    if (isLoading) {
        return <div className="flex justify-center items-center h-48"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {children(form, isSaving)}
            </form>
        </Form>
    );
};

const AboutUsForm = ({ form, isSaving }: { form: UseFormReturn<z.infer<typeof aboutPageSchema>>, isSaving: boolean }) => {
    const { t } = useLocalization();
    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "teamMembers"
    });
    
    return (
        <div className="space-y-8">
            <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Hero Section')}</h3>
                <FormField control={form.control} name="aboutTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="aboutSubtitle" render={({ field }) => (<FormItem><FormLabel>{t('Subtitle')}</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Story Section')}</h3>
                <FormField control={form.control} name="storyTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent1" render={({ field }) => (<FormItem><FormLabel>{t('Content Paragraph 1')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="storyContent2" render={({ field }) => (<FormItem><FormLabel>{t('Content Paragraph 2')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <h3 className="text-lg font-semibold">{t('Mission, Vision & Values')}</h3>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Mission Card')}</h4>
                        <FormField control={form.control} name="missionTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="missionContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Vision Card')}</h4>
                        <FormField control={form.control} name="visionTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="visionContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                    <div className="space-y-4">
                        <h4 className="text-md font-semibold">{t('Values Card')}</h4>
                        <FormField control={form.control} name="valuesTitle" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="valuesContent" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
                    </div>
                </div>
             </div>
             <Separator />
             <div className="space-y-4 p-4 border rounded-lg">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">{t('Meet the Team Section')}</h3>
                    <Button type="button" size="sm" variant="outline" onClick={() => append({ name: '', role: '', imageUrl: '' })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> {t('Add Member')}
                    </Button>
                </div>
                <div className="space-y-4">
                    {fields.map((field, index) => (
                        <div key={field.id} className="p-4 border rounded-lg relative space-y-4 bg-muted/50">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <FormField control={form.control} name={`teamMembers.${index}.name`} render={({ field }) => (<FormItem><FormLabel>{t('Name')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                                <FormField control={form.control} name={`teamMembers.${index}.role`} render={({ field }) => (<FormItem><FormLabel>{t('Role')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            </div>
                            <FormField control={form.control} name={`teamMembers.${index}.imageUrl`} render={({ field }) => (<FormItem><FormLabel>{t('Image URL')}</FormLabel><FormControl><Input placeholder="https://example.com/image.png" {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => remove(index)}>
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}
                </div>
             </div>

            <div className="flex justify-end">
                <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('Save About Page')}
                </Button>
            </div>
        </div>
    )
}

const LegalPageForm = ({ form, isSaving, pageName }: { form: UseFormReturn<z.infer<typeof legalPageSchema>>, isSaving: boolean, pageName: string }) => {
    const { t } = useLocalization();
    return (
        <div className="space-y-4">
            <FormField control={form.control} name="title" render={({ field }) => (<FormItem><FormLabel>{t('Title')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lastUpdated" render={({ field }) => (<FormItem><FormLabel>{t('Last Updated Date')}</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="content" render={({ field }) => (<FormItem><FormLabel>{t('Content')}</FormLabel><FormControl><RichTextEditor {...field} /></FormControl><FormMessage /></FormItem>)} />
             <div className="flex justify-end">
                 <Button type="submit" disabled={isSaving}>
                    {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} {t('Save {pageName}', { pageName })}
                </Button>
            </div>
        </div>
    )
}

// --- Main Component ---

export function ContentPagesEditor() {
    const { t } = useLocalization();
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Static Page Content</CardTitle>
                <CardDescription>Edit the content displayed on various public pages of the site.</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="about-us">
                    <TabsList>
                        <TabsTrigger value="about-us">{t("About Us")}</TabsTrigger>
                        <TabsTrigger value="privacy-policy">{t("Privacy Policy")}</TabsTrigger>
                        <TabsTrigger value="terms-of-service">{t("Terms of Service")}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="about-us" className="pt-6">
                        <PageFormWrapper pageId="about-us" schema={aboutPageSchema} defaultValues={defaultAboutValues}>
                             {(form, isSaving) => <AboutUsForm form={form} isSaving={isSaving} />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="privacy-policy" className="pt-6">
                        <PageFormWrapper pageId="privacy-policy" schema={legalPageSchema} defaultValues={defaultPrivacyPolicy}>
                            {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName="Privacy Policy" />}
                        </PageFormWrapper>
                    </TabsContent>
                    <TabsContent value="terms-of-service" className="pt-6">
                        <PageFormWrapper pageId="terms-of-service" schema={legalPageSchema} defaultValues={defaultTerms}>
                             {(form, isSaving) => <LegalPageForm form={form} isSaving={isSaving} pageName="Terms of Service" />}
                        </PageFormWrapper>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}


    