import * as React from 'react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Terminal } from 'lucide-react';

interface OutputConsoleProps {
  output: string[];
  error: string | null;
}

export const OutputConsole = ({ output, error }: OutputConsoleProps) => {
  return (
    <ScrollArea className="h-full w-full">
      <div className="p-4 font-mono text-sm">
        {error ? (
          <div className="text-destructive flex flex-col gap-2">
            <div className="flex items-center font-semibold">
              <AlertTriangle className="mr-2 h-4 w-4" />
              <span>Error</span>
            </div>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        ) : (
          <div>
            {output.map((line, index) => (
              <div key={index} className="flex items-start">
                <span className="text-muted-foreground mr-2 select-none">&gt;</span>
                <span className="flex-1">{line}</span>
              </div>
            ))}
          </div>
        )}
        {!error && output.length === 0 && (
          <div className="flex items-center text-muted-foreground">
            <Terminal className="mr-2 h-4 w-4" />
            <span>Click "Run" to see code output here.</span>
          </div>
        )}
      </div>
    </ScrollArea>
  );
};
