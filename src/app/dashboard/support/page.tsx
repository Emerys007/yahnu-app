
"use client"

import { useAuth, type Role } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { LifeBuoy, Mail, Phone, Send, University } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

interface FaqItem {
  question: string;
  answer: string;
}

const contactFormSchema = z.object({
  subject: z.string().min(5, { message: "Subject must be at least 5 characters." }),
  message: z.string().min(20, { message: "Message must be at least 20 characters." }),
});

const FAQSection = ({ title, faqs }: { title: string; faqs: FaqItem[] }) => (
  <div className="mb-6">
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, index) => (
        <AccordionItem value={`item-${index}`} key={index}>
          <AccordionTrigger>{faq.question}</AccordionTrigger>
          <AccordionContent>{faq.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </div>
);

const ContactSupportForm = () => {
    const { t } = useLocalization();
    const { toast } = useToast();
    const form = useForm<z.infer<typeof contactFormSchema>>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: { subject: "", message: "" },
    });

    const onSubmit = (values: z.infer<typeof contactFormSchema>) => {
        console.log("Support form submitted:", values);
        toast({
            title: t('form_submitted_title'),
            description: t('form_submitted_desc'),
        });
        form.reset();
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{t('contact_form_title')}</CardTitle>
                <CardDescription>{t('contact_form_desc')}</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form_subject_label')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('form_subject_placeholder')} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('form_message_label')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('form_message_placeholder')} rows={6} {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="submit" className="w-full">
                            <Send className="mr-2 h-4 w-4" />
                            {t('form_submit_button')}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}

export default function SupportPage() {
  const { t } = useLocalization();
  const { user, role } = useAuth();
  const router = useRouter();

  const handleContactSchool = () => {
    if (user?.schoolId) {
        // This is a mock implementation. A real one would look up the school admin's name.
        // For now, we'll use a placeholder ID.
        router.push(`/dashboard/messages?new=${user.schoolId}`);
    }
  }

  const generalFaqs: FaqItem[] = [
    { question: t('faq_q_password'), answer: t('faq_a_password') },
    { question: t('faq_q_info'), answer: t('faq_a_info') },
    { question: t('faq_q_contact'), answer: t('faq_a_contact') },
    { question: t('faq_q_language_theme'), answer: t('faq_a_language_theme') },
  ];

  const graduateFaqs: FaqItem[] = [
    { question: t('faq_q_pending'), answer: t('faq_a_pending') },
    { question: t('faq_q_profile'), answer: t('faq_a_profile') },
    { question: t('faq_q_matching'), answer: t('faq_a_matching') },
    { question: t('faq_q_resume_parser'), answer: t('faq_a_resume_parser') },
  ];
  
  const companyFaqs: FaqItem[] = [
    { question: t('faq_q_post_job'), answer: t('faq_a_post_job') },
    { question: t('faq_q_find_candidates'), answer: t('faq_a_find_candidates') },
    { question: t('faq_q_partnerships'), answer: t('faq_a_partnerships') },
    { question: t('faq_q_assessment_generator'), answer: t('faq_a_assessment_generator') },
  ];

  const schoolFaqs: FaqItem[] = [
    { question: t('faq_q_approve_graduates'), answer: t('faq_a_approve_graduates') },
    { question: t('faq_q_school_partnerships'), answer: t('faq_a_school_partnerships') },
    { question: t('faq_q_placement_analytics'), answer: t('faq_a_placement_analytics') },
    { question: t('faq_q_event_management'), answer: t('faq_a_event_management') },
  ];
  
  const roleFaqs: Record<Role, FaqItem[]> = {
      graduate: graduateFaqs,
      company: companyFaqs,
      school: schoolFaqs,
      admin: [],
  };
  
  const roleFaqTitles: Record<Role, string> = {
      graduate: t('faq_graduate_title'),
      company: t('faq_company_title'),
      school: t('faq_school_title'),
      admin: '',
  };

  const specificFaqs = roleFaqs[role] || [];
  const specificFaqTitle = roleFaqTitles[role] || '';

  return (
    <div className="space-y-8">
        <div className="flex items-start gap-4">
            <div className="bg-primary/10 p-3 rounded-lg">
                <LifeBuoy className="h-6 w-6 text-primary" />
            </div>
            <div>
                <h1 className="text-3xl font-bold tracking-tight">{t('Support & FAQ')}</h1>
                <p className="text-muted-foreground mt-1">{t('Find answers to common questions or get in touch with our team.')}</p>
            </div>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-8 items-start">
            <div className="lg:col-span-2 space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Frequently Asked Questions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {specificFaqs.length > 0 && <FAQSection title={specificFaqTitle} faqs={specificFaqs} />}
                        <FAQSection title={t('faq_general_title')} faqs={generalFaqs} />
                    </CardContent>
                </Card>
                 <ContactSupportForm />
            </div>
            <div className="lg:col-span-1 sticky top-24 space-y-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('Contact Support')}</CardTitle>
                        <CardDescription>{t('Can\'t find an answer? Reach out to us.')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button asChild className="w-full justify-start">
                           <Link href="mailto:contact@yahnu.ci">
                             <Mail className="mr-2 h-4 w-4" />
                             {t('Email Support')}
                           </Link>
                        </Button>
                         <Button asChild variant="outline" className="w-full justify-start">
                           <Link href="tel:+2250102030405">
                             <Phone className="mr-2 h-4 w-4" />
                             {t('Call Us')}
                           </Link>
                        </Button>
                    </CardContent>
                </Card>
                {role === 'graduate' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('School Support')}</CardTitle>
                            <CardDescription>{t('Need to contact your school about your account?')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Button className="w-full justify-start" onClick={handleContactSchool}>
                                <University className="mr-2 h-4 w-4" />
                                {t('Contact Your School')}
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    </div>
  );
}
