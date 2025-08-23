
"use client"

import { useSearchParams, useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Award, CheckCircle, XCircle } from 'lucide-react';
import { useConfetti } from '@/context/confetti-context';
import React from 'react';

const testTitles: Record<string, string> = {
    'frontend-basics': 'Développement Frontend (React)',
    'financial-analysis': 'Principes de l\'Analyse Financière',
    'agronomy-principles': 'Principes d\'Agronomie Moderne',
    'supply-chain': 'Essentiels de la Chaîne d\'Approvisionnement',
    'cognitive-aptitude': 'Test d\'Aptitude Cognitive',
    'customer-service': 'Excellence du Service Client'
}

export default function AssessmentResultPage() {
    const params = useParams();
    const testId = params.testId as string;
    const router = useRouter();
    const searchParams = useSearchParams();
    const score = searchParams.get('score');
    const disqualified = searchParams.get('disqualified') === 'true';
    const { fire } = useConfetti();
    const [testTitle, setTestTitle] = React.useState("Évaluation");

    const scoreValue = score ? parseInt(score, 10) : 0;
    const passed = scoreValue >= 70 && !disqualified;

    React.useEffect(() => {
        setTestTitle(testTitles[testId] || "Évaluation");
        if(passed) {
            fire();
        }
    }, [testId, passed, fire]);
    
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
                        {disqualified ? "Test Disqualifié" : passed ? "Félicitations !" : "Évaluation Terminée"}
                    </CardTitle>
                    <CardDescription>
                        Vous avez terminé l'évaluation de {testTitle}.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                     {disqualified ? (
                        <p className="text-destructive font-semibold">
                            Votre test a été disqualifié pour avoir quitté la fenêtre du navigateur. Vous ne pourrez pas repasser cette évaluation avant 3 mois.
                        </p>
                     ) : (
                        <>
                            <div className="text-6xl font-bold">
                                {scoreValue}%
                            </div>
                            {passed ? (
                                <div className="flex items-center justify-center gap-2 text-green-600">
                                    <CheckCircle className="h-5 w-5" />
                                    <p className="font-semibold">Vous avez réussi ! Un nouveau badge a été ajouté à votre profil.</p>
                                </div>
                            ) : (
                                <p className="text-destructive">
                                    Vous n'avez pas atteint le score de passage de 70%. Vous pourrez réessayer dans 30 jours.
                                </p>
                            )}
                        </>
                     )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <Button onClick={() => router.push('/dashboard/profile')}>
                        Retourner à Mon Profil
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
