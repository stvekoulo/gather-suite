"use client";
import { WordStudio } from "./word-studio";
import type { DocumentFile } from "@/lib/types";

export function DocumentEditor({ doc, onClose }: { doc?: DocumentFile; onClose: () => void }) {
  return <WordStudio initialDoc={doc} onBack={onClose} />;
}
