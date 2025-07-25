

"use client"

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { useConfetti } from '@/context/confetti-context';
import { useLocalization } from '@/context/localization-context';
import React from 'react';

const testTitles: Record<string, Record<string, string>> = {
    'frontend-basics': {
        en: 'Frontend Development (React)',
        fr: 'Développement Frontend (React)'
    },
    'financial-analysis': {
        en: 'Financial Analysis Fundamentals',
        fr: 'Principes de l\'Analyse Financière'
    },
    'agronomy-principles': {
        en: 'Modern Agronomy Principles',
        fr: 'Principes d\'Agronomie Moderne'
    },
    'supply-chain': {
        en: 'Supply Chain Essentials',
        fr: 'Essentiels de la Chaîne d\'Approvisionnement'
    },
    'cognitive-aptitude': {
        en: 'Cognitive Aptitude Test',
        fr: 'Test d\'Aptitude Cognitive'
    },
    'customer-service': {
        en: 'Customer Service Excellence',
        fr: 'Excellence du Service Client'
    }
}

export default function AssessmentResultPage() {
    const params = useParams();
    const testId = params.testId as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const score = searchParams.get('score');
    const disqualified = searchParams.get('disqualified') === 'true';
    const { fire } = useConfetti();
    const { t, language } = useLocalization();
    const [testTitle, setTestTitle] = React.useState("Assessment");

    const scoreValue = score ? parseInt(score, 10) : 0;
    const passed = scoreValue >= 70 && !disqualified;

    React.useEffect(() => {
        setTestTitle(testTitles[testId]?.[language] || "Assessment");
        if(passed) {
            fire();
        }
    }, [testId, language, passed, fire]);
    
    // In a real app, you'd save this result and badge to the user's profile in the DB here.
    // For now, we simulate this by just showing the result.

    return (
        <div className="container mx-auto py-12 flex items-center justify-center">
            <Card className="max-w-lg w-full text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted p-4 rounded-full w-fit mb-4">
                        {passed ? (
                            <Award className="h-12 w-12 text-primary" />
                        ) : (
                            <XCircle className="h-12 w-12 text-destructive" />
                        )}
                    </div>
                    <CardTitle className="text-3xl">
                        {disqualified ? "Test Disqualified" : passed ? t("Congratulations!") : t("Assessment Complete")}
                    </CardTitle>
                    <CardDescription>
                        {t('You have completed the {testTitle} assessment.', {testTitle})}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {disqualified ? (
                        <p className="text-destructive font-semibold">
                            Your test was disqualified due to leaving the browser window. You will be unable to retake this assessment for 3 months.
                        </p>
                     ) : (
                        <>
                            <div className="text-6xl font-bold">
                                {scoreValue}%
                            </div>
                            {passed ? (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <p className="font-semibold">{t('You passed! A new badge has been added to your profile.')}</p>
                                </div>
                            ) : (
                                <p className="text-destructive">
                                    {t('You did not meet the passing score of 70%. You can try again in 30 days.')}
                                </p>
                            )}
                        </>
                     )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push('/dashboard/profile')}>
                        {t('Return to My Profile')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

    
