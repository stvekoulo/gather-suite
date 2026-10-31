"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo, useState } from "react";
import {
  ArrowLeftIcon,
  DownloadIcon,
  EyeIcon,
  FileTextIcon,
  Maximize2Icon,
  PencilIcon,
  BookmarkIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentFile } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { CategoryBadge, DocGlyph, downloadDoc, formatSize } from "./doc-utils";

function decodeBase64Text(dataUrl?: string): string | null {
  if (!dataUrl) return null;
  try {
    const commaIndex = dataUrl.indexOf(",");
    if (commaIndex === -1) return null;
    return decodeURIComponent(escape(atob(dataUrl.slice(commaIndex + 1))));
  } catch {
    return null;
  }
}

// Lecteur direct spacieux et immersif pour PDF, images et textes
export function DocReader({
  doc,
  onClose,
  onEditInStudio,
}: {
  doc: DocumentFile;
  onClose: () => void;
  onEditInStudio: (doc: DocumentFile) => void;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const [starred, setStarred] = useState(!!doc.starred);
  const [zoom, setZoom] = useState(100);

  const isPdf = doc.name.toLowerCase().endsWith(".pdf") || doc.dataUrl?.startsWith("data:application/pdf");
  const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.name) || doc.dataUrl?.startsWith("data:image/");
  const isText = /\.(txt|md|json|csv|js|ts|html|xml)$/i.test(doc.name) || doc.dataUrl?.startsWith("data:text/");
  const isWord = !!doc.editorContent || /\.(docx|doc|rtf|odt)$/i.test(doc.name);

  const textContent = useMemo(() => (isText && doc.dataUrl ? decodeBase64Text(doc.dataUrl) : null), [isText, doc.dataUrl]);

  const toggleStar = () => {
    const next = !starred;
    setStarred(next);
    updateDocument(doc.id, { starred: next });
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-900/40 backdrop-blur-md animate-in fade-in-0 duration-150">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-hairline bg-surface px-4 md:px-6 shadow-xs select-none">
        <div className="flex min-w-0 items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onClose} className="gap-1.5 text-xs text-fg-2 hover:text-fg">
            <ArrowLeftIcon className="size-4" /> {translate("Revenir aux documents")}
          </Button>

          <div className="h-4 w-px bg-hairline" />

          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-app text-icon">
            <DocGlyph name={doc.name} className="size-4.5" />
          </span>

          <div className="flex min-w-0 flex-col">
            <span className="text-xs sm:text-sm font-semibold text-fg truncate max-w-xs md:max-w-md" title={doc.name}>
              {doc.name}
            </span>
            <div className="flex items-center gap-2 text-[11px] text-fg-2">
              <CategoryBadge category={doc.category} />
              <span>·</span>
              <span>{formatSize(doc.size)}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isImage && (
            <div className="flex items-center gap-1 rounded-lg border border-hairline bg-app px-1.5 py-0.5 text-xs">
              <button
                onClick={() => setZoom((z) => Math.max(50, z - 25))}
                className="p-1 hover:text-fg text-fg-2"
                title={translate("Dézoomer")}
              >
                <ZoomOutIcon className="size-3.5" />
              </button>
              <span className="tabular-nums font-mono text-[11px] px-1">{zoom}%</span>
              <button
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                className="p-1 hover:text-fg text-fg-2"
                title={translate("Zoomer")}
              >
                <ZoomInIcon className="size-3.5" />
              </button>
            </div>
          )}

          {isWord && (
            <Button variant="brand" size="sm" onClick={() => onEditInStudio(doc)} className="text-xs gap-1.5">
              <PencilIcon className="size-3.5" /> {translate("Éditer le document")}
            </Button>
          )}

          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleStar}
            aria-label={starred ? "Retirer des favoris" : "Ajouter aux favoris"}
            className={starred ? "text-warning hover-fine:text-warning" : ""}
          >
            <BookmarkIcon className={starred ? "size-4 fill-current text-warning" : "size-4"} />
          </Button>

          <Button variant="outline" size="sm" onClick={() => downloadDoc(doc)} className="text-xs gap-1">
            <DownloadIcon className="size-3.5" /> {translate("Télécharger")}
          </Button>
        </div>
      </header>

      {/* Surface de lecture vaste et épurée */}
      <main className="min-h-0 flex-1 overflow-auto bg-slate-100/90 dark:bg-zinc-950 p-4 sm:p-8 flex items-center justify-center">
        {isPdf && doc.dataUrl ? (
          <iframe
            src={doc.dataUrl}
            title={doc.name}
            className="size-full max-w-6xl rounded-xl border border-hairline bg-white shadow-2xl"
          />
        ) : isImage && doc.dataUrl ? (
          <div className="flex max-h-full max-w-5xl items-center justify-center overflow-auto rounded-xl border border-hairline bg-surface p-4 shadow-xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={doc.dataUrl}
              alt={doc.name}
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: "center" }}
              className="max-h-[80vh] max-w-full rounded-lg object-contain transition-transform"
            />
          </div>
        ) : isText && textContent !== null ? (
          <div className="size-full max-w-4xl overflow-auto rounded-sm border border-hairline bg-white dark:bg-zinc-900 p-8 sm:p-12 shadow-xl">
            <pre className="font-mono text-sm leading-relaxed text-zinc-900 dark:text-zinc-100 whitespace-pre-wrap">
              {textContent}
            </pre>
          </div>
        ) : isWord ? (
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-8 text-center shadow-xl">
            <span className="flex size-14 items-center justify-center rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <FileTextIcon className="size-7" />
            </span>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-fg">{translate("Document prêt pour l'édition")}</h3>
              <p className="text-xs text-fg-2">
                {translate("Ce fichier DOCX peut être ouvert et édité directement dans Gather Documents.")}
              </p>
            </div>
            <Button variant="brand" className="w-full text-xs" onClick={() => onEditInStudio(doc)}>
              <PencilIcon className="size-3.5" /> {translate("Éditer le document")}
            </Button>
          </div>
        ) : (
          <div className="flex max-w-md flex-col items-center gap-4 rounded-2xl border border-hairline bg-surface p-8 text-center shadow-xl">
            <DocGlyph name={doc.name} className="size-12 text-icon" />
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base font-semibold text-fg">{doc.name}</h3>
              <p className="text-xs text-fg-2">{translate("Aperçu direct non disponible pour ce type de fichier binaire.")}</p>
            </div>
            <Button variant="brand" onClick={() => downloadDoc(doc)} className="text-xs">
              <DownloadIcon className="size-3.5" /> {translate("Télécharger (")}{formatSize(doc.size)})
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
