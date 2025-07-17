
"use client"

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Loader2, Video, ShieldAlert } from 'lucide-react';
import { useLocalization } from '@/context/localization-context';

const testData = {
    'frontend-basics': {
        en: {
            title: 'Frontend Development (React)',
            questions: [
                { question: "What is JSX?", options: ["A JavaScript syntax extension", "A templating engine", "A CSS preprocessor", "A database query language"], answer: "A JavaScript syntax extension" },
                { question: "How do you pass data to a component from outside?", options: ["state", "props", "refs", "context"], answer: "props" },
                { question: "Which hook would you use to track state in a function component?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
            ]
        },
        fr: {
            title: 'Développement Frontend (React)',
            questions: [
                { question: "Qu'est-ce que le JSX ?", options: ["Une extension de syntaxe JavaScript", "Un moteur de modèles", "Un préprocesseur CSS", "Un langage de requête de base de données"], answer: "Une extension de syntaxe JavaScript" },
                { question: "Comment passez-vous des données à un composant de l'extérieur ?", options: ["state", "props", "refs", "context"], answer: "props" },
                { question: "Quel hook utiliseriez-vous pour suivre l'état dans un composant fonctionnel ?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
            ]
        }
    },
    'financial-analysis': {
        en: {
            title: 'Financial Analysis Fundamentals',
            questions: [
                { question: "Which statement shows a company's financial position at a specific point in time?", options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Statement of Retained Earnings"], answer: "Balance Sheet" },
                { question: "What does EBIT stand for?", options: ["Earnings Before Interest and Taxes", "Earnings Before Investment and Transactions", "Estimated Business Income and Totals", "Equity Backed Investment Trust"], answer: "Earnings Before Interest and Taxes" },
            ]
        },
        fr: {
            title: 'Principes de l\'Analyse Financière',
            questions: [
                { question: "Quel état financier montre la situation financière d'une entreprise à un moment précis ?", options: ["Compte de résultat", "Bilan", "Tableau des flux de trésorerie", "État des résultats non distribués"], answer: "Bilan" },
                { question: "Que signifie EBIT ?", options: ["Bénéfice Avant Intérêts et Impôts", "Bénéfice Avant Investissement et Transactions", "Revenu d'Entreprise Estimé et Totaux", "Fiducie de Placement adossée à des Actions"], answer: "Bénéfice Avant Intérêts et Impôts" },
            ]
        }
    }
}

type TestId = keyof typeof testData;

const ProctoringSetup = ({ onSetupComplete }: { onSetupComplete: () => void }) => {
  const { toast } = useToast();
  const { t } = useLocalization();
  const [hasPermission, setHasPermission] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setHasPermission(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: t('Camera Access Denied'),
          description: t('Please enable camera and microphone permissions in your browser settings to continue.'),
        });
      }
    };
    getCameraPermission();
  }, [toast, t]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('Assessment Setup')}</CardTitle>
        <CardDescription>{t('Please complete the following steps to begin your proctored assessment.')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5" />
            <span>{t('Camera Access')}</span>
          </div>
          <span className={`text-sm font-semibold ${hasPermission ? 'text-green-600' : 'text-destructive'}`}>
            {hasPermission ? t('Enabled') : t('Disabled')}
          </span>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>{t('Assessment Rules')}</AlertTitle>
          <AlertDescription>
            {t('You must remain in the browser window for the duration of the test. Navigating away will be flagged.')}
          </AlertDescription>
        </Alert>
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
      </CardContent>
      <CardFooter>
        <Button onClick={onSetupComplete} disabled={!hasPermission} className="w-full">
          {hasPermission ? t("Start Assessment") : <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {t('Waiting for permissions...')}</>}
        </Button>
      </CardFooter>
    </Card>
  );
};


const TestInterface = ({ testId, onTestComplete }: { testId: TestId; onTestComplete: (score: number) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const { language, t } = useLocalization();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  
  const testContent = testData[testId][language as keyof typeof testData[TestId]];
  const totalQuestions = testContent.questions.length;
  
  // Tab focus lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast({
          variant: "destructive",
          title: t("Warning: Focus Lost"),
          description: t("You have navigated away from the test. This event has been logged."),
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [toast, t]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft]);
  
  useEffect(() => {
    const getCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            if(videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (error) {
            console.error("Could not get camera for test interface", error)
        }
    }
    getCamera();
  }, [])

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = answer;
    setAnswers(newAnswers);
  };
  
  const handleSubmit = () => {
    let score = 0;
    testContent.questions.forEach((q, i) => {
        if (answers[i] === q.answer) {
            score++;
        }
    });
    const finalScore = Math.round((score / totalQuestions) * 100);
    onTestComplete(finalScore);
  }

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
        handleSubmit();
    }
  };

  const progress = ((currentQuestion + 1) / totalQuestions) * 100;
  const q = testContent.questions[currentQuestion];

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{testContent.title}</CardTitle>
                        <div className="font-mono text-lg">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}</div>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <CardDescription>{t('Question {current} of {total}', {current: currentQuestion + 1, total: totalQuestions})}</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="font-semibold text-lg mb-6">{q.question}</p>
                    <RadioGroup onValueChange={handleAnswer} value={answers[currentQuestion]}>
                        {q.options.map(opt => (
                            <div key={opt} className="flex items-center space-x-2">
                                <RadioGroupItem value={opt} id={opt} />
                                <Label htmlFor={opt} className="font-normal">{opt}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </CardContent>
                <CardFooter>
                    <Button onClick={handleNext} className="ml-auto">
                        {currentQuestion < totalQuestions - 1 ? t('Next Question') : t('Finish & Submit')}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="sticky top-24 space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
            <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>{t('Proctoring Enabled')}</AlertTitle>
                <AlertDescription>
                    {t('Your session is being monitored. Please remain focused on the test.')}
                </AlertDescription>
            </Alert>
        </div>
    </div>
  )
}


export default function TakeAssessmentPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const { t } = useLocalization();
  const [step, setStep] = useState<'setup' | 'test'>('setup');
  
  if (!Object.keys(testData).includes(params.testId)) {
    return <div>{t('Test not found')}</div>;
  }

  const handleTestComplete = (score: number) => {
    // In a real app, you would save the score to the database
    router.push(`/dashboard/assessment/${params.testId}/result?score=${score}`);
  };

  return (
    <div className="container mx-auto py-8">
        {step === 'setup' && <ProctoringSetup onSetupComplete={() => setStep('test')} />}
        {step === 'test' && <TestInterface testId={params.testId as TestId} onTestComplete={handleTestComplete} />}
    </div>
  );
}
