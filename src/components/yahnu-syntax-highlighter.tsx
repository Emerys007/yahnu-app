import * as React from 'react';

interface YahnuSyntaxHighlighterProps {
  code: string;
}

const YAHNU_KEYWORDS = ['def', 'if', 'else', 'loop', 'print', 'return', 'True', 'False', 'None'];
const YAHNU_OPERATORS = /(=|\+|-|\*|\/|%|==|!=|<|>|<=|>=|:)/g;

const escapeHtml = (unsafe: string): string => {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

const highlight = (code: string) => {
  let highlightedCode = escapeHtml(code);

  // Comments (#...)
  highlightedCode = highlightedCode.replace(/(#.*)$/gm, `<span class="text-muted-foreground italic">$1</span>`);

  // Strings ("..." or '...')
  highlightedCode = highlightedCode.replace(/(".*?"|'.*?')/g, `<span class="text-accent">$1</span>`);

  // Keywords
  const keywordRegex = new RegExp(`\\b(${YAHNU_KEYWORDS.join('|')})\\b`, 'g');
  highlightedCode = highlightedCode.replace(keywordRegex, `<span class="text-primary font-semibold">$1</span>`);
  
  // Function names (def name(...))
  highlightedCode = highlightedCode.replace(/\bdef\s+([a-zA-Z_][a-zA-Z0-9_]*)/g, `<span class="text-primary font-semibold">def</span> <span class="text-green-500 dark:text-green-400">$1</span>`);

  // Numbers (integers and floats)
  highlightedCode = highlightedCode.replace(/\b(\d+\.?\d*)\b/g, `<span class="text-blue-600 dark:text-blue-400">$1</span>`);

  // Operators
  highlightedCode = highlightedCode.replace(YAHNU_OPERATORS, `<span class="text-foreground/80">$1</span>`);

  return highlightedCode;
};

export const YahnuSyntaxHighlighter: React.FC<YahnuSyntaxHighlighterProps> = ({ code }) => {
  // Add a non-breaking space to empty lines to preserve line height
  const formattedCode = code.replace(/^(?=\s*$)/gm, '\u00A0');
  const highlightedHtml = highlight(formattedCode);
  
  return (
    <pre className="p-4" aria-hidden="true">
      <code dangerouslySetInnerHTML={{ __html: highlightedHtml }} />
    </pre>
  );
};
