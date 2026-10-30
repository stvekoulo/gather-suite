"use client";

import { motion, AnimatePresence } from "motion/react";
import { CheckCircle2Icon, DownloadIcon, Loader2Icon, RefreshCwIcon, AlertCircleIcon, FileCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PdfProcessAnimatorProps {
  busy: boolean;
  progressText: string;
  progressPercent: number;
  stageName: string;
  error?: string;
  resultName?: string;
  onDownload?: () => void;
  onReset: () => void;
  onCancel?: () => void;
}

// Visual real-time process visualizer with fluid animations
export function PdfProcessAnimator({
  busy,
  progressText,
  progressPercent,
  stageName,
  error,
  resultName,
  onDownload,
  onReset,
  onCancel,
}: PdfProcessAnimatorProps) {
  if (!busy && !resultName && !error) return null;

  return (
    <AnimatePresence mode="wait">
      {busy && (
        <motion.div
          key="processing"
          initial={{ opacity: 0, y: 10, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.25 }}
          className="relative overflow-hidden rounded-2xl border border-brand/20 bg-brand-tint/30 p-6 shadow-sm"
        >
          {/* Animated background glow */}
          <div className="pointer-events-none absolute -right-12 -top-12 size-40 rounded-full bg-brand/10 blur-2xl" />

          <div className="relative z-10 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative flex size-10 items-center justify-center rounded-xl bg-brand text-white shadow-xs">
                  <Loader2Icon className="size-5 animate-spin" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-fg">
                    {stageName || "Traitement du document en cours..."}
                  </h4>
                  <p className="text-xs text-fg-2">
                    {progressText || "Opération 100% locale sécurisée"}
                  </p>
                </div>
              </div>
              <span className="font-mono text-sm font-bold text-brand">
                {Math.round(progressPercent)} %
              </span>
            </div>

            {/* Dynamic Animated Progress Bar */}
            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface border border-hairline">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-brand to-brand-hover"
                initial={{ width: "0%" }}
                animate={{ width: `${Math.max(5, progressPercent)}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              />
            </div>

            {/* Live Steps Sequence */}
            <div className="grid grid-cols-3 gap-2 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-brand font-medium">
                <span className="size-1.5 rounded-full bg-brand animate-ping" />
                1. Analyse
              </div>
              <div className={`flex items-center gap-1.5 ${progressPercent > 35 ? "text-brand font-medium" : "text-fg-2"}`}>
                <span className={`size-1.5 rounded-full ${progressPercent > 35 ? "bg-brand" : "bg-hairline"}`} />
                2. Transformation
              </div>
              <div className={`flex items-center gap-1.5 ${progressPercent > 80 ? "text-brand font-medium" : "text-fg-2"}`}>
                <span className={`size-1.5 rounded-full ${progressPercent > 80 ? "bg-brand" : "bg-hairline"}`} />
                3. Exportation
              </div>
            </div>

            {onCancel && (
              <div className="flex justify-end pt-1">
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-xs text-fg-2">
                  Annuler l&apos;opération
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {error && !busy && (
        <motion.div
          key="error"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="flex flex-col gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-xs text-red-600"
        >
          <div className="flex items-center gap-2 font-semibold">
            <AlertCircleIcon className="size-4 shrink-0" />
            <span>Erreur survenue lors du traitement</span>
          </div>
          <p className="leading-relaxed pl-6">{error}</p>
          <div className="flex justify-end">
            <Button size="sm" variant="outline" onClick={onReset} className="gap-1.5 text-xs">
              <RefreshCwIcon className="size-3.5" /> Réessayer
            </Button>
          </div>
        </motion.div>
      )}

      {resultName && !busy && !error && (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 350, damping: 25 }}
          className="flex flex-col gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 shadow-xs"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-xs">
                <CheckCircle2Icon className="size-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-fg">
                  Traitement terminé avec succès !
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-mono mt-0.5">
                  {resultName}
                </p>
              </div>
            </div>
            <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
              Prêt
            </span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-emerald-500/15">
            <Button variant="ghost" size="sm" onClick={onReset} className="text-xs">
              Autre traitement
            </Button>
            {onDownload && (
              <Button variant="brand" size="sm" onClick={onDownload} className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white">
                <DownloadIcon className="size-4" /> Télécharger le fichier
              </Button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
