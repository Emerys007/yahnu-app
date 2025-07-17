
"use client"

import { useSearchParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useConfetti } from '@/hooks/use-confetti';

const testTitles: Record<string, string> = {
    'frontend-basics': 'Frontend Development (React)',
    'financial-analysis': 'Financial Analysis Fundamentals',
    'agronomy-principles': 'Modern Agronomy Principles',
    'supply-chain': 'Supply Chain Essentials',
    'cognitive-aptitude': 'Cognitive Aptitude Test',
}

export default function AssessmentResultPage({ params }: { params: { testId: string } }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const score = searchParams.get('score');
    const { fire } = useConfetti();

    const scoreValue = score ? parseInt(score, 10) : 0;
    const passed = scoreValue >= 70;
    const testTitle = testTitles[params.testId] || "Assessment";

    if(passed) {
        fire();
    }
    
    // In a real app, you'd save this result and badge to the user's profile in the DB here.
    // For now, we simulate this by just showing the result.

    return (
        <div className="min-h-[60vh] flex items-center justify-center">
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
                        {passed ? "Congratulations!" : "Assessment Complete"}
                    </CardTitle>
                    <CardDescription>
                        You have completed the {testTitle} assessment.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="text-6xl font-bold">
                        {scoreValue}%
                    </div>
                    {passed ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <p className="font-semibold">You passed! A new badge has been added to your profile.</p>
                        </div>
                    ) : (
                        <p className="text-destructive">
                            You did not meet the passing score of 70%. You can try again in 30 days.
                        </p>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push('/dashboard/profile')}>
                        Return to My Profile
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
