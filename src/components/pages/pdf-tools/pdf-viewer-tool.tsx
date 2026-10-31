"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useRef, useState } from "react";
import type { PDFDocumentProxy, PDFDocumentLoadingTask, RenderTask } from "pdfjs-dist";
import { ChevronLeftIcon, ChevronRightIcon, FileUpIcon, RotateCwIcon, ZoomInIcon, ZoomOutIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { pdfEngine } from "@/modules/pdf/pdfjs";

// Lecteur PDF fluide et épuré avec contrôles uniques sans doublons
export function PdfViewerTool() {
  const [file, setFile] = useState<File | null>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [page, setPage] = useState(1);
  const [zoom, setZoom] = useState(1.2);
  const [rotation, setRotation] = useState(0);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!file) return;
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | undefined;
    Promise.all([pdfEngine(), file.arrayBuffer()])
      .then(async ([engine, data]) => {
        if (cancelled) return;
        loadingTask = engine.getDocument({
          data: new Uint8Array(data),
          cMapUrl: "/pdf-cmaps/",
          cMapPacked: true,
          standardFontDataUrl: "/pdf-fonts/",
        });
        const document = await loadingTask.promise;
        if (cancelled) return;
        setDoc(document);
        setPage(1);
        setError("");
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
      void loadingTask?.destroy();
    };
  }, [file]);

  useEffect(() => {
    if (!doc || !canvasRef.current) return;
    let cancelled = false;
    let task: RenderTask | undefined;
    doc
      .getPage(page)
      .then((pdfPage) => {
        if (cancelled || !canvasRef.current) return;
        const viewport = pdfPage.getViewport({
          scale: zoom,
          rotation: (pdfPage.rotate + rotation) % 360,
        });
        canvasRef.current.width = viewport.width;
        canvasRef.current.height = viewport.height;
        task = pdfPage.render({ canvas: canvasRef.current, viewport });
        return task.promise;
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(String(err));
      });
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, zoom, rotation]);

  const handleSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = e.target.files?.[0];
    if (picked) {
      setDoc(null);
      setFile(picked);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden bg-surface">
      <input
        ref={fileInputRef}
        type="file"
        aria-label={translate("Ouvrir un PDF")}
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleSelectFile}
      />

      {/* Barre d'outils visible UNIQUEMENT quand un PDF est ouvert (zéro doublon) */}
      {doc && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline px-6 py-2.5 bg-surface shrink-0">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 text-xs font-medium"
            >
              <FileUpIcon className="size-3.5" />
              {translate("Changer de fichier")}
            </Button>
            {file && (
              <span className="max-w-64 truncate text-xs font-semibold text-fg">
                {file.name}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-2 p-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((n) => Math.max(1, n - 1))}
                className="size-7 p-0"
              >
                <ChevronLeftIcon className="size-4" />
              </Button>
              <span className="px-2 text-xs font-medium text-fg">
                {page} / {doc.numPages}
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={page >= doc.numPages}
                onClick={() => setPage((n) => Math.min(doc.numPages, n + 1))}
                className="size-7 p-0"
              >
                <ChevronRightIcon className="size-4" />
              </Button>
            </div>

            <div className="flex items-center gap-1 rounded-lg border border-hairline bg-surface-2 p-1">
              <Button
                variant="ghost"
                size="sm"
                disabled={zoom <= 0.5}
                onClick={() => setZoom((n) => Math.max(0.5, n - 0.25))}
                className="size-7 p-0"
              >
                <ZoomOutIcon className="size-3.5" />
              </Button>
              <span className="w-12 text-center text-xs font-medium text-fg">
                {Math.round(zoom * 100)} %
              </span>
              <Button
                variant="ghost"
                size="sm"
                disabled={zoom >= 3}
                onClick={() => setZoom((n) => Math.min(3, n + 0.25))}
                className="size-7 p-0"
              >
                <ZoomInIcon className="size-3.5" />
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setRotation((n) => (n + 90) % 360)}
              className="gap-1.5 text-xs"
            >
              <RotateCwIcon className="size-3.5" />
              {translate("Rotation")}
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="border-b border-red-500/20 bg-red-500/10 px-6 py-2 text-xs text-red-600">
          {error}
        </div>
      )}

      {/* Surface de visualisation ou état d'accueil unique */}
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const dropped = Array.from(e.dataTransfer.files).find(
            (f) => f.name.toLowerCase().endsWith(".pdf") || f.type === "application/pdf"
          );
          if (dropped) {
            setDoc(null);
            setFile(dropped);
          }
        }}
        className="flex-1 overflow-auto bg-surface-2/60 p-6 flex items-center justify-center"
      >
        {doc ? (
          <canvas
            ref={canvasRef}
            aria-label={translate("Page PDF")}
            className="mx-auto rounded-lg bg-white shadow-xl border border-hairline"
          />
        ) : (
          <div className="flex max-w-sm flex-col items-center gap-3 text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-tint text-brand">
              <FileTextIcon className="size-7" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-fg">
                {translate("Lecteur de document PDF")}
              </h3>
              <p className="mt-1 text-xs text-fg-2 leading-relaxed">
                {translate("Visualisez vos documents en haute définition avec zoom et rotation.")}
              </p>
            </div>
            <Button
              variant="brand"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2 mt-2"
            >
              <FileUpIcon className="size-4" />
              {translate("Sélectionner un fichier PDF")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
