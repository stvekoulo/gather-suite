"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import {
  ArrowLeftIcon,
  CloudIcon,
  DownloadIcon,
  FilePlusIcon,
  FileTextIcon,
  PresentationIcon,
  PrinterIcon,
  SaveIcon,
  SlidersIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DocumentFile } from "@/lib/types";

// En-tête Google Docs / Word Studio avec barre de menus et titre direct
export function WordStudioHeader({
  currentDoc,
  documents,
  title,
  dirty,
  busy,
  canCreateSlides,
  onBack,
  onSwitchDoc,
  onChangeTitle,
  onSave,
  onExport,
  onOpenPageSetup,
  onPrint,
  onCreateSlides,
}: {
  currentDoc?: DocumentFile;
  documents: DocumentFile[];
  title: string;
  dirty: boolean;
  busy: boolean;
  canCreateSlides: boolean;
  onBack: () => void;
  onSwitchDoc: (id: string) => void;
  onChangeTitle: (title: string) => void;
  onSave: () => void;
  onExport: (format: "docx" | "pdf") => void;
  onOpenPageSetup: () => void;
  onPrint: () => void;
  onCreateSlides: () => void;
}) {
  return (
    <header className="flex shrink-0 flex-col border-b border-hairline bg-surface select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="gap-1.5 rounded-lg px-2 text-fg-2 hover:bg-hover hover:text-fg"
            title={translate("Revenir à l'accueil Documents")}
          >
            <ArrowLeftIcon className="size-4" />
            <span className="hidden sm:inline font-medium text-xs">{translate("Accueil Docs")}</span>
          </Button>

          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
            <FileTextIcon className="size-4.5" />
          </span>

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Input
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder={translate("Document sans titre")}
                aria-label={translate("Titre du document")}
                className="h-7 w-48 sm:w-64 border-transparent bg-transparent px-1.5 text-sm font-semibold text-fg hover:border-hairline focus:border-brand focus:bg-surface"
              />
              <span className="hidden md:flex items-center gap-1 text-[11px] text-fg-2">
                {dirty ? (
                  <span className="text-amber-500 font-medium">{translate("Modifié")}</span>
                ) : (
                  <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <CloudIcon className="size-3" /> {translate("Enregistré")}
                  </span>
                )}
              </span>
            </div>

            {/* Barre de menu classique Google Docs */}
            <div className="hidden sm:flex items-center gap-0.5 text-xs text-fg-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded px-2 py-0.5 hover:bg-hover hover:text-fg">{translate("Fichier")}</button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56">
                  <DropdownMenuItem onSelect={() => onSwitchDoc("new")}>
                    <FilePlusIcon className="size-3.5" /> {translate("Nouveau document")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onSave}>
                    <SaveIcon className="size-3.5" /> {translate("Enregistrer les modifications")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={() => onExport("docx")}>
                    <DownloadIcon className="size-3.5" /> {translate("Télécharger en Word (.docx)")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => onExport("pdf")}>
                    <DownloadIcon className="size-3.5" /> {translate("Télécharger en PDF (.pdf)")}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={onOpenPageSetup}>
                    <SlidersIcon className="size-3.5" /> {translate("Mise en page...")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={onPrint}>
                    <PrinterIcon className="size-3.5" /> {translate("Imprimer")}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button onClick={onOpenPageSetup} className="rounded px-2 py-0.5 hover:bg-hover hover:text-fg">
                {translate("Mise en page")}
              </button>
            </div>
          </div>
        </div>

        {/* Côté droit : Sélecteur de document et actions */}
        <div className="flex items-center gap-2">
          <Select value={currentDoc?.id ?? "new"} onValueChange={onSwitchDoc}>
            <SelectTrigger className="h-8 w-44 sm:w-52 text-xs font-medium" aria-label={translate("Choisir un document")}>
              <SelectValue placeholder={translate("Changer de document")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new" className="font-semibold text-brand">
                {translate("+ Nouveau document vierge")}
              </SelectItem>
              {documents.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="sm"
            disabled={busy || !canCreateSlides}
            onClick={onCreateSlides}
            className="hidden md:flex text-xs"
          >
            <PresentationIcon className="size-3.5" /> {translate("Diaporama")}
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="brand" size="sm" className="gap-1.5 text-xs">
                <DownloadIcon className="size-3.5" /> {translate("Exporter")}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => onExport("docx")}>
                <DownloadIcon className="size-3.5" /> Microsoft Word (.docx)
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => onExport("pdf")}>
                <DownloadIcon className="size-3.5" /> {translate("Document PDF (.pdf)")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
