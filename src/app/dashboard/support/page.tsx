
"use client"

import { useAuth, type Role } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { LifeBuoy, Mail, Phone } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

interface FaqItem {
  question: string;
  answer: string;
}

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

export default function SupportPage() {
  const { t } = useLocalization();
  const { role } = useAuth();

  const generalFaqs: FaqItem[] = [
    { question: t('faq_q_password'), answer: t('faq_a_password') },
    { question: t('faq_q_info'), answer: t('faq_a_info') },
    { question: t('faq_q_contact'), answer: t('faq_a_contact') },
  ];

  const graduateFaqs: FaqItem[] = [
    { question: t('faq_q_pending'), answer: t('faq_a_pending') },
    { question: t('faq_q_profile'), answer: t('faq_a_profile') },
    { question: t('faq_q_matching'), answer: t('faq_a_matching') },
  ];
  
  const companyFaqs: FaqItem[] = [
    { question: t('faq_q_post_job'), answer: t('faq_a_post_job') },
    { question: t('faq_q_find_candidates'), answer: t('faq_a_find_candidates') },
    { question: t('faq_q_partnerships'), answer: t('faq_a_partnerships') },
  ];

  const schoolFaqs: FaqItem[] = [
    { question: t('faq_q_approve_graduates'), answer: t('faq_a_approve_graduates') },
    { question: t('faq_q_school_partnerships'), answer: t('faq_a_school_partnerships') },
    { question: t('faq_q_placement_analytics'), answer: t('faq_a_placement_analytics') },
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
        
        <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('Frequently Asked Questions')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {specificFaqs.length > 0 && <FAQSection title={specificFaqTitle} faqs={specificFaqs} />}
                        <FAQSection title={t('faq_general_title')} faqs={generalFaqs} />
                    </CardContent>
                </Card>
            </div>
            <div className="lg:col-span-1">
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
            </div>
        </div>
    </div>
  );
}
