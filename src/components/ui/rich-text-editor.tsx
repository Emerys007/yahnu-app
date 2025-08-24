
"use client"

import React, { useState, forwardRef } from 'react';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Textarea } from './textarea';
import { Code } from 'lucide-react';

const ReactQuill = dynamic(
    () => import('react-quill'), 
    { ssr: false }
);

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const CustomToolbar = ({ onToggleHtml, isHtmlView }: { onToggleHtml: () => void, isHtmlView: boolean }) => (
  <div id="toolbar" className="ql-toolbar ql-snow rounded-t-md border-input border-b-0">
    <span className="ql-formats">
      <select className="ql-header" defaultValue="">
        <option value="1">Titre 1</option>
        <option value="2">Titre 2</option>
        <option value="3">Titre 3</option>
        <option value="">Normal</option>
      </select>
    </span>
    <span className="ql-formats">
      <button className="ql-bold"></button>
      <button className="ql-italic"></button>
      <button className="ql-underline"></button>
      <button className="ql-strike"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-list" value="ordered"></button>
      <button className="ql-list" value="bullet"></button>
    </span>
    <span className="ql-formats">
      <button className="ql-link"></button>
    </span>
    <span className="ql-formats">
       <button type="button" onClick={onToggleHtml} className={cn(isHtmlView && "ql-active")}>
        <Code className="h-4 w-4" />
      </button>
    </span>
    <span className="ql-formats">
      <button className="ql-clean"></button>
    </span>
  </div>
);

export const RichTextEditor = forwardRef<HTMLDivElement, RichTextEditorProps>(
  ({ value, onChange, className, placeholder }, ref) => {
    const [showHtml, setShowHtml] = useState(false);
    
    const modules = {
      toolbar: {
        container: "#toolbar"
      },
    };

    const formats = [
      'header',
      'bold', 'italic', 'underline', 'strike',
      'list', 'bullet',
      'link', 'code-block'
    ];
    
    return (
      <div ref={ref} className={cn("bg-background rounded-md border border-input", className)}>
          <CustomToolbar onToggleHtml={() => setShowHtml(p => !p)} isHtmlView={showHtml} />
          {showHtml ? (
              <Textarea
                  value={value}
                  onChange={(e) => onChange(e.target.value)}
                  className="min-h-[268px] rounded-t-none border-0 font-mono text-sm focus-visible:ring-0"
                  placeholder="<!-- Écrivez votre HTML ici -->"
              />
          ) : (
              <ReactQuill 
                  theme="snow" 
                  value={value} 
                  onChange={onChange}
                  modules={modules}
                  formats={formats}
                  placeholder={placeholder}
                  className="[&_.ql-container]:min-h-[268px] [&_.ql-container]:border-0 [&_.ql-toolbar]:hidden [&_.ql-editor]:resize-y"
              />
          )}
      </div>
    );
  }
);

RichTextEditor.displayName = 'RichTextEditor';
