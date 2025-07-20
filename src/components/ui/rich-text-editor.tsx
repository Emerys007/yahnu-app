

"use client"

import React, { useState, useEffect, useRef } from 'react';
import 'react-quill/dist/quill.snow.css';
import { cn } from '@/lib/utils';
import dynamic from 'next/dynamic';
import { Textarea } from './textarea';
import { useLocalization } from '@/context/localization-context';

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

export const RichTextEditor = ({ value, onChange, className, placeholder }: RichTextEditorProps) => {
    const [showHtml, setShowHtml] = useState(false);
    const { t } = useLocalization();
    const quillRef = useRef<any>(null);

    const modules = {
      toolbar: {
        container: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{'list': 'ordered'}, {'list': 'bullet'}],
          ['link'],
          ['code-block'],
          ['clean']
        ],
        handlers: {
          'code-block': () => {
            setShowHtml(prev => !prev);
          }
        }
      },
    };

    const formats = [
      'header',
      'bold', 'italic', 'underline', 'strike',
      'list', 'bullet',
      'link', 'code-block'
    ];

    useEffect(() => {
        const toolbar = quillRef.current?.getEditor().getModule('toolbar').container;
        if (toolbar) {
            const buttonMap: Record<string, string> = {
                'bold': t('Bold'),
                'italic': t('Italic'),
                'underline': t('Underline'),
                'strike': t('Strikethrough'),
                'list': t('List'),
                'link': t('Insert Link'),
                'code-block': t('Code View'),
                'clean': t('Clear Formatting')
            };

            Object.entries(buttonMap).forEach(([className, tooltipText]) => {
                const buttons = toolbar.querySelectorAll(`.ql-${className}`);
                buttons.forEach((button: HTMLElement) => {
                    button.setAttribute('title', tooltipText);
                });
            });
            const headerButton = toolbar.querySelector('.ql-header');
            if (headerButton) headerButton.setAttribute('title', t('Header Style'));
        }
    }, [t, showHtml, value]); // Re-run when view or value changes to reapply tooltips

  return (
    <div className={cn("bg-background", className)}>
        {showHtml ? (
            <div className="relative">
                <div id="toolbar-html" className="ql-toolbar ql-snow rounded-t-md border-input border">
                    <span className="ql-formats">
                        <button 
                            title={t('Rich Text View')}
                            type="button" 
                            className="ql-active ql-code-block"
                            onClick={() => setShowHtml(false)}
                        >
                            <svg viewBox="0 0 18 18">
                                <path className="ql-stroke" d="M.469,5.023,2.484,3.375,4.5,5.023a.473.473,0,0,0,.7,0L6.9,3.375l2.016,1.648a.473.473,0,0,0,.7,0L11.313,3.375l2.016,1.648a.473.473,0,0,0,.7,0L15.727,3.375l2.016,1.648a.46.46,0,0,0,.7,0L18.9,4.2a.473.473,0,0,0,0-.7L14.43,0,9.961,3.328a.473.473,0,0,0,0,.7L11.664,5.2a.473.473,0,0,0,.7,0L13.91,3.879l1.422,1.164-4.57,3.75L9.281,7.625a.473.473,0,0,0-.7,0L6.8,8.79l-1.4-1.141,4.594-3.75L5.422.523a.473.473,0,0,0-.7,0L3,1.687,1.4,2.828,5.969,6.578a.473.473,0,0,0,0,.7L7.68,8.445a.473.473,0,0,0,.7,0l1.547-1.266,1.422,1.164-4.57,3.75-1.484-1.219a.473.473,0,0,0-.7,0l-1.7,1.391-4.547-3.75,1.4-1.141Z"></path>
                            </svg>
                        </button>
                    </span>
                </div>
                <Textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="min-h-64 rounded-t-none font-mono text-sm"
                    placeholder="<!-- Write your HTML here -->"
                />
            </div>
        ) : (
            <ReactQuill 
                ref={quillRef}
                theme="snow" 
                value={value} 
                onChange={onChange}
                modules={modules}
                formats={formats}
                placeholder={placeholder}
                className="[&_.ql-container]:min-h-64 [&_.ql-container]:rounded-b-md [&_.ql-toolbar]:rounded-t-md [&_.ql-container]:border-input [&_.ql-toolbar]:border-input [&_.ql-container]:relative [&_.ql-editor]:resize-y"
            />
        )}
    </div>
  );
};
