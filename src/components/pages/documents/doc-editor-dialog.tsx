"use client";
import { WordStudio } from "@/modules/documents/word-studio";
import type { DocumentFile } from "@/lib/types";

export function DocEditorDialog({ open, onClose, doc }: { open: boolean; onClose: () => void; doc?: DocumentFile }) {
  return open ? <WordStudio key={doc?.id ?? "new"} initialDoc={doc} onBack={onClose} /> : null;
}
