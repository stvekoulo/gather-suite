"use client";

import { ShieldCheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Dialogue d'information À propos de Gather autonome, spacieux et sans mentions externes
export function AboutDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const lang = useAppStore((s) => s.settings.language);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="w-full max-w-5xl sm:max-w-5xl max-h-[85vh] overflow-y-auto p-6 sm:p-8 gap-6 scroll-thin">
        <DialogHeader className="gap-2">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Gather Suite Logo"
              className="size-12 rounded-xl object-contain drop-shadow-sm select-none"
            />
            <div>
              <DialogTitle className="text-xl font-bold tracking-tight text-fg">Gather Suite</DialogTitle>
              <p className="text-xs text-fg-3 font-mono">Version 0.3.0 · {translate("Plateforme de productivité locale autonome", lang)}</p>
            </div>
          </div>
          <DialogDescription className="text-xs text-fg-2 leading-relaxed pt-1 max-w-2xl">
            {translate("Gather centralise l'ensemble de vos espaces de travail (documents, feuilles de calcul, diaporamas, notes, finances et PDF) dans un environnement rapide, privé et sécurisé. Vos données restent exclusivement sur votre machine.", lang)}
          </DialogDescription>
        </DialogHeader>

        {/* Modules du système */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Documents", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Traitement de texte paginé au format A4 avec gestion des marges, styles typographiques, tableaux et extraction directe du texte des fichiers PDF et DOCX.", lang)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Tableur", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Feuilles de calcul réactives avec formules complètes, recopie incrémentale, graphiques intégrés et import/export direct de classeurs Excel (.xlsx) et CSV.", lang)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-orange-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Présentations", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Diaporamas 16:9 et 4:3 avec mises en page prédéfinies, formes vectorielles, mode Présentateur double écran avec chronomètre et export PPTX.", lang)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-purple-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Notes & Wiki", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Prise de notes instantanée, mémos, Markdown, tags hiérarchiques, listes de tâches et archivage local instantané.", lang)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-cyan-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Outils PDF & Canvas", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Visualisation, fusion, découpe et signature certifiée de PDF, complétés par un tableau blanc vectoriel infini pour vos schémas.", lang)}
            </p>
          </div>

          <div className="flex flex-col gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-4 shadow-2xs">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber-600" />
              <h4 className="text-xs font-semibold text-fg">{translate("Facturation & Trésorerie", lang)}</h4>
            </div>
            <p className="text-[11px] text-fg-2 leading-relaxed">
              {translate("Émission de factures professionnelles, suivi des revenus, dépenses, flux de trésorerie et synchronisation avec l'agenda.", lang)}
            </p>
          </div>
        </div>

        {/* Garanties techniques et auteur */}
        <div className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface p-4 text-xs text-fg-2 shadow-2xs">
          <div className="flex items-center gap-2 text-fg font-medium">
            <ShieldCheckIcon className="size-4 text-emerald-600" />
            {translate("Stockage Local Sécurisé & Confidentialité Totale", lang)}
          </div>
          <p className="text-[11px] leading-relaxed">
            {translate("Aucun compte externe obligatoire, aucune télémétrie commerciale. Tous les documents, calculs et bases de données résident uniquement dans le stockage local de votre poste de travail.", lang)}
          </p>
          <div className="flex items-center justify-between pt-2 border-t border-hairline/60 text-[11px]">
            <span>{translate("Conçu & développé par", lang)} <strong className="text-fg">Steven KOULO</strong></span>
            <span className="text-placeholder font-mono">Gather Suite · {lang === "en" ? "Desktop" : "Bureau"}</span>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:justify-end">
          <Button type="button" variant="brand" size="sm" onClick={onClose} className="text-xs px-4">
            {translate("Fermer", lang)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
