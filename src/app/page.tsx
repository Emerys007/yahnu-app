'use client';

import * as React from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Code, Copy, Play, Loader2, Bot } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { generateCodeAction } from '@/app/actions';
import { YahnuEditor } from '@/components/yahnu-editor';
import { OutputConsole } from '@/components/output-console';
import { YahnuIcon } from '@/components/icons';

const initialCode = `
# Welcome to Yahnu!
# Use the panel on the left to generate code from natural language.
# Example: "Create a function that prints Hello World"

def greet():
  print("Hello, Yahnu!")

greet()
`.trim();

const GenerateButton = () => {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} size="lg" className="w-full">
      {pending ? (
        <>
          <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Generating...
        </>
      ) : (
        <>
          <Bot className="mr-2 h-5 w-5" /> Generate Code
        </>
      )}
    </Button>
  );
};

export default function Home() {
  const { toast } = useToast();
  const [yahnuCode, setYahnuCode] = React.useState(initialCode);
  const [naturalLanguage, setNaturalLanguage] = React.useState('');
  const [consoleOutput, setConsoleOutput] = React.useState<string[]>([]);
  const [consoleError, setConsoleError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState('code');
  const formRef = React.useRef<HTMLFormElement>(null);

  const [state, formAction] = useFormState(generateCodeAction, {
    yahnuCode: '',
    error: null,
  });

  React.useEffect(() => {
    if (state.yahnuCode) {
      setYahnuCode(state.yahnuCode);
      setActiveTab('code');
      setNaturalLanguage('');
      toast({
        title: 'Success!',
        description: 'Yahnu code has been generated.',
      });
    } else if (state.error) {
      toast({
        variant: 'destructive',
        title: 'An error occurred',
        description: state.error,
      });
    }
  }, [state, toast]);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(yahnuCode).then(
      () => {
        toast({
          title: 'Code copied to clipboard!',
        });
      },
      () => {
        toast({
          variant: 'destructive',
          title: 'Failed to copy code',
        });
      }
    );
  };

  const handleRunCode = () => {
    setConsoleError(null);
    const lines = yahnuCode.split('\n');
    const newOutput: string[] = [];
    let hasOutput = false;

    try {
      for (const [index, line] of lines.entries()) {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('print("')) {
          const match = trimmedLine.match(/print\("([^"]*)"\)/);
          if (match && match[1]) {
            newOutput.push(match[1]);
            hasOutput = true;
          }
        }
        if (trimmedLine.toLowerCase().includes('error')) {
          throw new Error(`Simulated runtime error on line ${index + 1}: "${line}"`);
        }
      }

      if (!hasOutput) {
        newOutput.push('Execution finished with no output.');
      }
      setConsoleOutput(newOutput);
    } catch (e: unknown) {
      if (e instanceof Error) {
        setConsoleError(e.message);
      } else {
        setConsoleError('An unknown error occurred during execution.');
      }
      setConsoleOutput([]);
    } finally {
      setActiveTab('output');
    }
  };

  return (
    <main className="min-h-screen p-4 sm:p-6 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-7xl mx-auto">
        <div className="flex flex-col gap-8">
          <header className="flex items-center gap-3">
            <YahnuIcon className="h-10 w-10 text-primary" />
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Yahnu Assistant</h1>
              <p className="text-muted-foreground">Your personal AI-powered Yahnu code generator</p>
            </div>
          </header>
          <Card className="flex-grow">
            <CardHeader>
              <CardTitle>Natural Language Input</CardTitle>
              <CardDescription>Describe the code you want to create in plain English. The AI will do the rest.</CardDescription>
            </CardHeader>
            <form action={formAction} ref={formRef}>
              <CardContent>
                <Textarea
                  name="naturalLanguage"
                  placeholder="e.g., Create a function that takes two numbers and returns their sum."
                  className="min-h-[200px] text-base"
                  value={naturalLanguage}
                  onChange={(e) => setNaturalLanguage(e.target.value)}
                />
              </CardContent>
              <CardFooter>
                <GenerateButton />
              </CardFooter>
            </form>
          </Card>
        </div>

        <Card>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col h-full">
            <div className="flex items-center p-4 border-b">
              <TabsList>
                <TabsTrigger value="code"><Code className="mr-2 h-4 w-4" /> Code</TabsTrigger>
                <TabsTrigger value="output"><Play className="mr-2 h-4 w-4" /> Output</TabsTrigger>
              </TabsList>
              <div className="ml-auto flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handleRunCode}>
                  <Play className="mr-2 h-4 w-4" />
                  Run
                </Button>
                <Button variant="outline" size="icon" onClick={handleCopyCode}>
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Copy Code</span>
                </Button>
              </div>
            </div>
            <TabsContent value="code" className="mt-0 flex-grow">
              <YahnuEditor value={yahnuCode} onValueChange={setYahnuCode} />
            </TabsContent>
            <TabsContent value="output" className="mt-0 flex-grow">
              <OutputConsole output={consoleOutput} error={consoleError} />
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </main>
  );
}
