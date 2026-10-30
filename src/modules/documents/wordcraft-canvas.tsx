"use client";

import type { Editor } from "@tiptap/react";
import { EditorContent } from "@tiptap/react";
import type { DocumentLayout } from "./document-layout";
import { WordcraftRuler } from "./wordcraft-ruler";

interface WordcraftCanvasProps {
  editor: Editor | null;
  layout: DocumentLayout;
  title: string;
  zoom: number;
  showRuler: boolean;
  viewMode: "page" | "web";
}

// Zone de rendu A4 paginée style Wordcraft garantissant l'absence de débordement
export function WordcraftCanvas({
  editor,
  layout,
  title,
  zoom,
  showRuler,
  viewMode,
}: WordcraftCanvasProps) {
  const isLandscape = layout.orientation === "landscape";
  const pageWidth = isLandscape ? "297mm" : "210mm";
  const pageMinHeight = isLandscape ? "210mm" : "297mm";

  return (
    <main
      className="flex flex-col items-center min-h-0 flex-1 overflow-y-auto bg-slate-200/75 dark:bg-zinc-950 py-8 px-4 sm:px-6 md:px-8 scroll-thin print:bg-white print:p-0"
      id="gather-word-canvas"
    >
      {/* Règle graduée Wordcraft */}
      {showRuler && viewMode === "page" && (
        <div className="w-full flex justify-center print:hidden">
          <WordcraftRuler orientation={layout.orientation} marginMm={layout.margin} />
        </div>
      )}

      {/* Conteneur d'échelle Zoom */}
      <div
        className="w-full flex flex-col items-center transition-transform duration-100 ease-out origin-top"
        style={{ transform: zoom !== 100 ? `scale(${zoom / 100})` : undefined }}
      >
        {viewMode === "page" ? (
          <div
            className="w-full h-auto flex flex-col box-border bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 rounded-xs shadow-[0_4px_24px_rgba(0,0,0,0.12),0_1px_4px_rgba(0,0,0,0.06)] dark:shadow-[0_4px_30px_rgba(0,0,0,0.8)] border border-hairline/60 print:shadow-none print:border-none print:m-0"
            style={{
              maxWidth: pageWidth,
              minHeight: pageMinHeight,
              padding: `${layout.margin}mm`,
            }}
          >
            {/* En-tête de page discret */}
            <div className="mb-4 flex items-center justify-between border-b border-hairline/40 pb-2 text-[10px] text-fg-3 select-none print:hidden">
              <span className="font-medium truncate max-w-[50%]">{title || "Sans titre"}</span>
              <span>Gather Documents</span>
            </div>

            {/* Contenu principal TipTap */}
            <div className="w-full h-auto flex-1">
              {editor && <EditorContent editor={editor} />}
            </div>

            {/* Pied de page discret */}
            <div className="mt-8 flex items-center justify-between border-t border-hairline/40 pt-3 text-[10px] text-fg-3 select-none print:hidden">
              <span>Format {layout.size} ({isLandscape ? "Paysage" : "Portrait"})</span>
              <span>Page 1</span>
            </div>
          </div>
        ) : (
          <div className="w-full max-w-4xl h-auto min-h-[700px] rounded-lg bg-white dark:bg-zinc-900 p-8 sm:p-14 shadow-sm border border-hairline/60">
            {editor && <EditorContent editor={editor} />}
          </div>
        )}
      </div>
    </main>
  );
}
