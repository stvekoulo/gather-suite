"use client";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "@/modules/documents/editor.css";

export function NoteMarkdown({ content, onReference }: { content: string; onReference?: (target: string) => void }) {
  const markdown = content.replace(/\[\[([^\]]+)\]\]/g, (_, target: string) => `[${target}](#note-${encodeURIComponent(target.trim())})`);
  return <div className="gather-editor break-words text-sm leading-relaxed"><Markdown remarkPlugins={[remarkGfm]} components={{
    a: ({ href, children }) => href?.startsWith("#note-") ? <button className="text-brand underline" onClick={() => onReference?.(decodeURIComponent(href.slice(6)))}>{children}</button> : <a href={href} target="_blank" rel="noopener noreferrer" className="text-brand underline">{children}</a>,
    table: ({ children }) => <div className="overflow-auto"><table>{children}</table></div>,
  }}>{markdown}</Markdown></div>;
}
