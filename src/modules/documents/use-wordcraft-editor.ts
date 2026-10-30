"use client";

import { useEffect } from "react";
import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import { toast } from "sonner";
import type { DocumentFile } from "@/lib/types";
import { PageBreak } from "./editing-tools";
import { DrawingEmbed, SheetEmbed } from "./live-embeds";
import { extractDocumentHtml } from "./doc-extract";
import { readAsDataUrl } from "@/components/pages/documents/doc-utils";

interface UseWordcraftEditorProps {
  initialDoc?: DocumentFile;
  initialContent?: string;
  onUpdate: () => void;
}

// Hook d'initialisation de l'éditeur TipTap configuré pour Wordcraft
export function useWordcraftEditor({
  initialDoc,
  initialContent,
  onUpdate,
}: UseWordcraftEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      TextStyleKit,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Underline,
      Link.configure({ openOnClick: false }),
      PageBreak,
      DrawingEmbed,
      SheetEmbed,
      Image.configure({ allowBase64: true }),
      TableKit.configure({ table: { resizable: true } }),
      Placeholder.configure({ placeholder: "Rédigez votre document…" }),
    ],
    content: initialDoc?.editorContent ?? initialContent ?? "<p></p>",
    onUpdate,
    editorProps: {
      attributes: {
        class: "gather-editor min-h-[400px] outline-none text-[15px] leading-relaxed text-zinc-900 dark:text-zinc-100",
        "aria-label": "Contenu du document Word",
      },
      handlePaste: (_view, event) => {
        const items = Array.from(event.clipboardData?.items || []);
        for (const item of items) {
          if (item.type.startsWith("image/")) {
            event.preventDefault();
            const file = item.getAsFile();
            if (file) {
              void readAsDataUrl(file).then((src) => {
                editor?.chain().focus().setImage({ src }).run();
                toast.success("Image insérée");
              });
              return true;
            }
          }
        }
        return false;
      },
      handleDrop: (_view, event, _slice, moved) => {
        if (!moved && event.dataTransfer?.files?.length) {
          const file = event.dataTransfer.files[0];
          if (file.type.startsWith("image/")) {
            event.preventDefault();
            void readAsDataUrl(file).then((src) => {
              editor?.chain().focus().setImage({ src }).run();
              toast.success("Image déposée");
            });
            return true;
          }
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (!initialDoc?.editorContent && initialDoc?.dataUrl && (!initialContent || initialContent === "<p></p>")) {
      void extractDocumentHtml(initialDoc).then((html) => {
        if (html && html !== "<p></p>") editor.commands.setContent(html);
      });
    }
  }, [editor, initialDoc, initialContent]);

  return editor;
}
