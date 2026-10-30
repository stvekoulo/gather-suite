"use client";

import { FileIcon, FileImageIcon, FileSpreadsheetIcon, FileTextIcon } from "lucide-react";
import { toast } from "sonner";
import { formatLong, formatShort } from "@/lib/dates";
import type { DocCategory, DocumentFile } from "@/lib/types";
import { saveFile } from "@/lib/files";
import { DEFAULT_CATEGORIES } from "@/stores/doc-categories-store";

export const CATEGORIES: string[] = DEFAULT_CATEGORIES;

const PALETTE = ["purple", "blue", "green", "pink", "orange", "yellow", "cyan"];

export function categoryColor(cat: string): string {
  let hash = 0;
  for (let i = 0; i < cat.length; i++) hash = cat.charCodeAt(i) + ((hash << 5) - hash);
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export type Filter = "all" | "starred" | string;
export type Sort = "newest" | "oldest" | "name" | "size";

export const SORTS: { value: Sort; label: string }[] = [
  { value: "newest", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "name", label: "Nom" },
  { value: "size", label: "Taille" },
];

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function splitName(name: string): [string, string] {
  const i = name.lastIndexOf(".");
  return i > 0 ? [name.slice(0, i), name.slice(i)] : [name, ""];
}

export function guessCategory(name: string, fallback: string): string {
  const n = name.toLowerCase();
  if (/bulletin|paie|salary|wage|payslip/.test(n)) return "Fiche de paie";
  if (/contrat|agreement|offer|nda|contract/.test(n)) return "Contrat";
  if (/politique|reglement|policy|handbook|guideline/.test(n)) return "Politique";
  if (/medical|sante|arret|doctor|certificat/.test(n)) return "Médical";
  if (/impot|tax|fiscal|tva|invoice|facture/.test(n)) return "Fiscal";
  return fallback;
}

export function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function downloadDoc(doc: DocumentFile) {
  try {
    if (doc.editorContent) {
      const { createDocx } = await import("@/modules/documents/document-format");
      const fileName = doc.name.endsWith(".docx") ? doc.name : `${doc.name.replace(/\.[^.]+$/, "")}.docx`;
      const bytes = await createDocx(fileName, doc.editorContent, doc.pageSetup);
      await saveFile(fileName, bytes, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
      return;
    }
    if (!doc.dataUrl) {
      toast("Fichier de démonstration", {
        description: `« ${doc.name} » n'a pas de contenu binaire attaché.`,
      });
      return;
    }
    const response = await fetch(doc.dataUrl);
    await saveFile(doc.name, await response.blob());
  } catch (error) {
    toast.error("Téléchargement impossible", { description: String(error) });
  }
}

export function uploadedLabel(iso: string, today: string) {
  const day = iso.slice(0, 10);
  if (day === today) return "Aujourd’hui";
  return day.slice(0, 4) === today.slice(0, 4) ? formatShort(day) : formatLong(day);
}

export function DocGlyph({ name, className }: { name: string; className?: string }) {
  const ext = splitName(name)[1].toLowerCase();
  const Icon = [".png", ".jpg", ".jpeg", ".gif", ".webp", ".heic", ".svg"].includes(ext)
    ? FileImageIcon
    : [".xls", ".xlsx", ".csv", ".numbers"].includes(ext)
      ? FileSpreadsheetIcon
      : [".pdf", ".doc", ".docx", ".txt", ".md", ".rtf", ".pages"].includes(ext)
        ? FileTextIcon
        : FileIcon;
  return <Icon className={className} />;
}

export function CategoryBadge({ category }: { category: string }) {
  const color = categoryColor(category);
  return (
    <span
      className="t-12-tight salt inline-flex h-[22px] w-fit items-center rounded-[6px] px-2 text-[11px] font-medium whitespace-nowrap"
      style={{
        background: `var(--category-${color}-tint, rgba(59, 130, 246, 0.1))`,
        color: `var(--event-${color}-fg, #2563eb)`,
      }}
    >
      {category}
    </span>
  );
}
