'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Textarea } from '@/components/ui/textarea';
import { YahnuSyntaxHighlighter } from './yahnu-syntax-highlighter';
import { ScrollArea } from './ui/scroll-area';

interface YahnuEditorProps {
  value: string;
  onValueChange: (value: string) => void;
}

export const YahnuEditor = ({ value, onValueChange }: YahnuEditorProps) => {
  const editorRef = React.useRef<HTMLTextAreaElement>(null);
  const preRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = () => {
    if (preRef.current && editorRef.current) {
      preRef.current.scrollTop = editorRef.current.scrollTop;
      preRef.current.scrollLeft = editorRef.current.scrollLeft;
    }
  };

  return (
    <div className="relative h-full w-full font-mono text-sm bg-muted/30 dark:bg-card rounded-bl-lg rounded-br-lg">
      <ScrollArea className="h-full" ref={preRef}>
        <YahnuSyntaxHighlighter code={value} />
        {/* Empty line to ensure last line is visible */}
        <div className="h-8" />
      </ScrollArea>
      <Textarea
        ref={editorRef}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onScroll={handleScroll}
        spellCheck="false"
        className={cn(
          'absolute inset-0 z-10 resize-none overflow-auto whitespace-pre-wrap',
          'bg-transparent text-transparent caret-foreground',
          'p-4 border-0 focus-visible:ring-0 focus-visible:ring-offset-0'
        )}
      />
    </div>
  );
};
