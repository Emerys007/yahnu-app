"use client"

import * as React from "react"
import { Bold, Code2, Heading2, Italic, Link2, List, ListOrdered, Quote, RemoveFormatting, Underline } from "lucide-react"

import { sanitizeRichText } from "@/components/ui/safe-rich-text"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface RichTextEditorProps {
  value?: string
  onChange: (value: string) => void
  className?: string
  placeholder?: string
}

export function RichTextEditor({ value = "", onChange, className, placeholder = "Rédigez votre contenu…" }: RichTextEditorProps) {
  const editorRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const editor = editorRef.current
    if (!editor || document.activeElement === editor) return

    const nextHtml = sanitizeRichText(value || "")
    if (editor.innerHTML !== nextHtml) editor.innerHTML = nextHtml
  }, [value])

  const commit = React.useCallback(() => {
    const editor = editorRef.current
    if (!editor) return

    const cleanHtml = sanitizeRichText(editor.innerHTML)
    if (editor.innerHTML !== cleanHtml) editor.innerHTML = cleanHtml
    onChange(cleanHtml)
  }, [onChange])

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus()
    document.execCommand(command, false, commandValue)
    commit()
  }

  const addLink = () => {
    const href = window.prompt("Saisissez une adresse sécurisée (https, http, mailto, / ou #)")?.trim()
    if (!href || !/^(?:(?:https?|mailto):|\/|#)/i.test(href)) return
    runCommand("createLink", href)
  }

  return (
    <div className={cn("overflow-hidden rounded-md border border-input bg-background", className)}>
      <div className="flex flex-wrap gap-1 border-b border-input bg-muted/30 p-1.5" role="toolbar" aria-label="Mise en forme du texte">
        <Button type="button" variant="ghost" size="xs" aria-label="Titre" title="Titre" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("formatBlock", "h2")}><Heading2 /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Gras" title="Gras" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("bold")}><Bold /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Italique" title="Italique" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("italic")}><Italic /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Souligné" title="Souligné" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("underline")}><Underline /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Liste à puces" title="Liste à puces" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertUnorderedList")}><List /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Liste numérotée" title="Liste numérotée" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("insertOrderedList")}><ListOrdered /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Citation" title="Citation" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("formatBlock", "blockquote")}><Quote /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Bloc de code" title="Bloc de code" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("formatBlock", "pre")}><Code2 /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Ajouter un lien" title="Ajouter un lien" onMouseDown={(event) => event.preventDefault()} onClick={addLink}><Link2 /></Button>
        <Button type="button" variant="ghost" size="xs" aria-label="Effacer la mise en forme" title="Effacer la mise en forme" onMouseDown={(event) => event.preventDefault()} onClick={() => runCommand("removeFormat")}><RemoveFormatting /></Button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        role="textbox"
        aria-multiline="true"
        suppressContentEditableWarning
        data-placeholder={placeholder}
        className="min-h-64 px-3 py-2 text-sm leading-6 outline-none empty:before:pointer-events-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground focus:ring-2 focus:ring-inset focus:ring-ring"
        onInput={commit}
        onBlur={commit}
        onPaste={(event) => {
          event.preventDefault()
          document.execCommand("insertText", false, event.clipboardData.getData("text/plain"))
          commit()
        }}
      />
    </div>
  )
}
