"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo } from "react";
import type { Editor } from "@tiptap/react";
import {
  BookOpenIcon,
  ClockIcon,
  FileTextIcon,
  HashIcon,
  MicIcon,
  PilcrowIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DocumentStatsDialogProps {
  open: boolean;
  onClose: () => void;
  editor: Editor | null;
}

// Inspecteur et statistiques détaillées du document style Wordcraft
export function DocumentStatsDialog({ open, onClose, editor }: DocumentStatsDialogProps) {
  const stats = useMemo(() => {
    if (!editor) {
      return { words: 0, charsWithSpaces: 0, charsNoSpaces: 0, paragraphs: 0, sentences: 0, pages: 1, readTimeMin: 0, speechTimeMin: 0 };
    }
    const text = editor.getText();
    const cleanText = text.trim();
    const words = cleanText ? cleanText.split(/\s+/).length : 0;
    const charsWithSpaces = text.length;
    const charsNoSpaces = text.replace(/\s/g, "").length;
    const paragraphs = cleanText ? text.split(/\n+/).filter((p) => p.trim().length > 0).length : 0;
    const sentences = cleanText ? (text.match(/[^.!?]+[.!?]+/g) || []).length || (cleanText ? 1 : 0) : 0;
    const pages = Math.max(1, Math.ceil(words / 300));
    const readTimeMin = Math.max(1, Math.ceil(words / 200));
    const speechTimeMin = Math.max(1, Math.ceil(words / 130));

    return { words, charsWithSpaces, charsNoSpaces, paragraphs, sentences, pages, readTimeMin, speechTimeMin };
  }, [editor, open]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-semibold text-fg">
            <FileTextIcon className="size-4 text-brand" />
            {translate("Statistiques du document")}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-3 py-2">
          <div className="rounded-lg border border-hairline/80 bg-surface-2/40 p-3">
            <div className="flex items-center gap-2 text-xs text-fg-2">
              <HashIcon className="size-3.5 text-blue-500" />
              <span>{translate("Mots")}</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-fg">{stats.words.toLocaleString("fr-FR")}</p>
          </div>

          <div className="rounded-lg border border-hairline/80 bg-surface-2/40 p-3">
            <div className="flex items-center gap-2 text-xs text-fg-2">
              <BookOpenIcon className="size-3.5 text-emerald-500" />
              <span>{translate("Pages estimées")}</span>
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-fg">{stats.pages}</p>
          </div>

          <div className="rounded-lg border border-hairline/80 bg-surface-2/40 p-3">
            <div className="flex items-center gap-2 text-xs text-fg-2">
              <PilcrowIcon className="size-3.5 text-purple-500" />
              <span>{translate("Paragraphes")}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-fg">{stats.paragraphs.toLocaleString("fr-FR")}</p>
          </div>

          <div className="rounded-lg border border-hairline/80 bg-surface-2/40 p-3">
            <div className="flex items-center gap-2 text-xs text-fg-2">
              <FileTextIcon className="size-3.5 text-amber-500" />
              <span>{translate("Phrases")}</span>
            </div>
            <p className="mt-1 text-xl font-semibold text-fg">{stats.sentences.toLocaleString("fr-FR")}</p>
          </div>
        </div>

        <div className="divide-y divide-hairline rounded-lg border border-hairline bg-surface-1/30 px-3 text-xs">
          <div className="flex justify-between py-2 text-fg-2">
            <span>{translate("Caractères (avec espaces)")}</span>
            <span className="font-mono font-medium text-fg">{stats.charsWithSpaces.toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex justify-between py-2 text-fg-2">
            <span>{translate("Caractères (sans espaces)")}</span>
            <span className="font-mono font-medium text-fg">{stats.charsNoSpaces.toLocaleString("fr-FR")}</span>
          </div>
          <div className="flex items-center justify-between py-2 text-fg-2">
            <span className="flex items-center gap-1.5">
              <ClockIcon className="size-3 text-fg-3" /> {translate("Temps de lecture")}
            </span>
            <span className="font-medium text-fg">~{stats.readTimeMin} min</span>
          </div>
          <div className="flex items-center justify-between py-2 text-fg-2">
            <span className="flex items-center gap-1.5">
              <MicIcon className="size-3 text-fg-3" /> {translate("Temps d'élocution")}
            </span>
            <span className="font-medium text-fg">~{stats.speechTimeMin} min</span>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            {translate("Fermer")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
