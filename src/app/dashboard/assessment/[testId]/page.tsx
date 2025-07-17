
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
import { Loader2, Video, Volume2, ShieldAlert } from 'lucide-react';

const testData = {
    'frontend-basics': {
        title: 'Frontend Development (React)',
        questions: [
            { question: "What is JSX?", options: ["A JavaScript syntax extension", "A templating engine", "A CSS preprocessor", "A database query language"], answer: "A JavaScript syntax extension" },
            { question: "How do you pass data to a component from outside?", options: ["state", "props", "refs", "context"], answer: "props" },
            { question: "Which hook would you use to track state in a function component?", options: ["useEffect", "useState", "useContext", "useReducer"], answer: "useState" },
        ]
    },
    'financial-analysis': {
        title: 'Financial Analysis Fundamentals',
        questions: [
            { question: "Which statement shows a company's financial position at a specific point in time?", options: ["Income Statement", "Balance Sheet", "Cash Flow Statement", "Statement of Retained Earnings"], answer: "Balance Sheet" },
            { question: "What does EBIT stand for?", options: ["Earnings Before Interest and Taxes", "Earnings Before Investment and Transactions", "Estimated Business Income and Totals", "Equity Backed Investment Trust"], answer: "Earnings Before Interest and Taxes" },
        ]
    }
}

type TestId = keyof typeof testData;

const ProctoringSetup = ({ onSetupComplete }: { onSetupComplete: () => void }) => {
  const { toast } = useToast();
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
          title: 'Camera Access Denied',
          description: 'Please enable camera and microphone permissions in your browser settings to continue.',
        });
      }
    };
    getCameraPermission();
  }, [toast]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Assessment Setup</CardTitle>
        <CardDescription>Please complete the following steps to begin your proctored assessment.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Video className="h-5 w-5" />
            <span>Camera Access</span>
          </div>
          <span className={`text-sm font-semibold ${hasPermission ? 'text-green-600' : 'text-destructive'}`}>
            {hasPermission ? 'Enabled' : 'Disabled'}
          </span>
        </div>
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Assessment Rules</AlertTitle>
          <AlertDescription>
            You must remain in the browser window for the duration of the test. Navigating away will be flagged.
          </AlertDescription>
        </Alert>
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
      </CardContent>
      <CardFooter>
        <Button onClick={onSetupComplete} disabled={!hasPermission} className="w-full">
          {hasPermission ? "Start Assessment" : <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Waiting for permissions...</>}
        </Button>
      </CardFooter>
    </Card>
  );
};


const TestInterface = ({ testId, onTestComplete }: { testId: TestId; onTestComplete: (score: number) => void }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState(30 * 60); // 30 minutes
  
  const test = testData[testId];
  const totalQuestions = test.questions.length;
  
  // Tab focus lock
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        toast({
          variant: "destructive",
          title: "Warning: Focus Lost",
          description: "You have navigated away from the test. This event has been logged.",
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [toast]);

  // Timer
  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }
    const timer = setInterval(() => setTimeLeft(timeLeft - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);
  
  useEffect(() => {
    const getCamera = async () => {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if(videoRef.current) {
            videoRef.current.srcObject = stream;
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
    test.questions.forEach((q, i) => {
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
  const q = test.questions[currentQuestion];

  return (
    <div className="grid md:grid-cols-[1fr_300px] gap-8 items-start">
        <div>
            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>{test.title}</CardTitle>
                        <div className="font-mono text-lg">{`${Math.floor(timeLeft / 60).toString().padStart(2, '0')}:${(timeLeft % 60).toString().padStart(2, '0')}`}</div>
                    </div>
                    <Progress value={progress} className="w-full" />
                    <CardDescription>Question {currentQuestion + 1} of {totalQuestions}</CardDescription>
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
                        {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'Finish & Submit'}
                    </Button>
                </CardFooter>
            </Card>
        </div>
        <div className="sticky top-24 space-y-4">
            <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted />
            <Alert>
                <ShieldAlert className="h-4 w-4" />
                <AlertTitle>Proctoring Enabled</AlertTitle>
                <AlertDescription>
                    Your session is being monitored. Please remain focused on the test.
                </AlertDescription>
            </Alert>
        </div>
    </div>
  )
}


export default function TakeAssessmentPage({ params }: { params: { testId: string } }) {
  const router = useRouter();
  const [step, setStep] = useState<'setup' | 'test'>('setup');
  
  if (!Object.keys(testData).includes(params.testId)) {
    return <div>Test not found</div>;
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

