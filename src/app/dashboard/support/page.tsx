
"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocalization } from "@/context/localization-context";
import { LifeBuoy, Mail, Phone, ChevronRight } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SupportPage() {
  const { t } = useLocalization();

  const faqs = [
    {
      question: t('faq_q1'),
      answer: t('faq_a1')
    },
    {
      question: t('faq_q2'),
      answer: t('faq_a2')
    },
    {
      question: t('faq_q3'),
      answer: t('faq_a3')
    },
    {
      question: t('faq_q4'),
      answer: t('faq_a4')
    },
    {
        question: t('faq_q5'),
        answer: t('faq_a5')
    }
  ];

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
                        <Accordion type="single" collapsible className="w-full">
                            {faqs.map((faq, index) => (
                                <AccordionItem value={`item-${index}`} key={index}>
                                    <AccordionTrigger>{faq.question}</AccordionTrigger>
                                    <AccordionContent>
                                        {faq.answer}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
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
