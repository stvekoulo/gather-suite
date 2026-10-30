"use client";

import { useState } from "react";
import type { Editor } from "@tiptap/react";
import {
  BookOpenIcon,
  CompassIcon,
  DownloadIcon,
  EyeIcon,
  FilePlusIcon,
  FileTextIcon,
  ImageIcon,
  LayoutIcon,
  Link2Icon,
  PenToolIcon,
  PlusSquareIcon,
  PresentationIcon,
  PrinterIcon,
  SaveIcon,
  SearchIcon,
  SlidersIcon,
  TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { DocumentLayout } from "./document-layout";
import { RibbonHomeTab } from "./wordcraft-ribbon-home";
import { TableContextTools } from "./wordcraft-ribbon-tools";
import { cn } from "@/lib/utils";

interface WordcraftRibbonProps {
  editor: Editor | null;
  layout: DocumentLayout;
  onChangeLayout: (patch: Partial<DocumentLayout>) => void;
  onOpenPageSetup: () => void;
  onOpenImageDialog: () => void;
  onOpenStats: () => void;
  onToggleFindReplace: () => void;
  viewMode: "page" | "web";
  onToggleViewMode: (mode: "page" | "web") => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  onSave: () => void;
  onExport: (format: "docx" | "pdf" | "md" | "txt") => void;
  onPrint: () => void;
  onCreateSlides: () => void;
  onNewDoc: () => void;
}

type RibbonTab = "home" | "insert" | "layout" | "view" | "file";

// Ruban principal style Wordcraft avec onglets Accueil, Insertion, Mise en page, Affichage, Fichier
export function WordcraftRibbon({
  editor,
  layout,
  onChangeLayout,
  onOpenPageSetup,
  onOpenImageDialog,
  onOpenStats,
  onToggleFindReplace,
  viewMode,
  onToggleViewMode,
  showRuler,
  onToggleRuler,
  onSave,
  onExport,
  onPrint,
  onCreateSlides,
  onNewDoc,
}: WordcraftRibbonProps) {
  const tr = useTranslate();
  const [activeTab, setActiveTab] = useState<RibbonTab>("home");
  const sheets = useWorkspaceStore((s) => s.sheets);

  if (!editor) return null;

  const handleLink = () => {
    const href = window.prompt("URL (https://…)");
    if (href && /^https?:\/\//i.test(href)) {
      editor.chain().focus().setLink({ href }).run();
    }
  };

  return (
    <div className="flex shrink-0 flex-col border-b border-hairline bg-surface select-none print:hidden">
      {/* En-tête des onglets */}
      <div className="flex items-center gap-1 border-b border-hairline/60 px-3 pt-1">
        {(
          [
            { id: "home", label: tr("Accueil"), icon: FileTextIcon },
            { id: "insert", label: tr("Insertion"), icon: PlusSquareIcon },
            { id: "layout", label: tr("Mise en page"), icon: LayoutIcon },
            { id: "view", label: tr("Affichage"), icon: EyeIcon },
            { id: "file", label: tr("Fichier"), icon: CompassIcon },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-3 py-1.5 text-xs font-medium transition-colors",
              activeTab === tab.id
                ? "border-brand text-brand"
                : "border-transparent text-fg-2 hover:text-fg"
            )}
          >
            <tab.icon className="size-3.5" />
            <span>{tab.label}</span>
          </button>
        ))}

        {editor.isActive("table") && <TableContextTools editor={editor} />}
      </div>

      {/* Barre de commandes */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5 min-h-10 text-xs">
        {activeTab === "home" && <RibbonHomeTab editor={editor} />}

        {activeTab === "insert" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()} className="gap-1.5 h-7 text-xs">
              <TableIcon className="size-3.5" /> {tr("Tableau")}
            </Button>
            <Button variant="outline" size="sm" onClick={onOpenImageDialog} className="gap-1.5 h-7 text-xs">
              <ImageIcon className="size-3.5" /> {tr("Image")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => editor.chain().focus().insertContent({ type: "pageBreak" }).run()} className="gap-1.5 h-7 text-xs">
              <FilePlusIcon className="size-3.5" /> {tr("Saut de page")}
            </Button>
            <Button variant="outline" size="sm" onClick={() => editor.chain().focus().insertContent({ type: "drawingEmbed" }).run()} className="gap-1.5 h-7 text-xs">
              <PenToolIcon className="size-3.5" /> {tr("Schéma tableau blanc")}
            </Button>
            {!!sheets.length && (
              <select
                aria-label={tr("Insérer tableur lié")}
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    editor.chain().focus().insertContent({ type: "sheetEmbed", attrs: { sheetId: e.target.value } }).run();
                    e.target.value = "";
                  }
                }}
                className="h-7 rounded border border-hairline bg-app px-2 text-xs text-fg-2"
              >
                <option value="">{tr("Insérer Tableur…")}</option>
                {sheets.map((s) => (
                  <option key={s.id} value={s.id}>{s.title}</option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleLink} className="gap-1.5 h-7 text-xs">
              <Link2Icon className="size-3.5" /> Lien
            </Button>
            <Button variant="outline" size="sm" onClick={() => editor.chain().focus().setHorizontalRule().run()} className="gap-1.5 h-7 text-xs">
              Ligne
            </Button>
          </div>
        )}

        {activeTab === "layout" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-fg-2 text-[11px]">Format :</span>
              <Button variant={layout.size === "A4" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ size: "A4" })}>
                A4
              </Button>
              <Button variant={layout.size === "LETTER" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ size: "LETTER" })}>
                Lettre
              </Button>
            </div>
            <div className="h-4 w-px bg-hairline" />
            <div className="flex items-center gap-1">
              <span className="text-fg-2 text-[11px]">Orientation :</span>
              <Button variant={layout.orientation === "portrait" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ orientation: "portrait" })}>
                Portrait
              </Button>
              <Button variant={layout.orientation === "landscape" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ orientation: "landscape" })}>
                Paysage
              </Button>
            </div>
            <div className="h-4 w-px bg-hairline" />
            <div className="flex items-center gap-1">
              <span className="text-fg-2 text-[11px]">Marges :</span>
              <Button variant={layout.margin === 20 ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ margin: 20 })}>
                20 mm
              </Button>
              <Button variant={layout.margin === 12.7 ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onChangeLayout({ margin: 12.7 })}>
                12.7 mm
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={onOpenPageSetup} className="h-7 gap-1 text-xs">
              <SlidersIcon className="size-3" /> Options…
            </Button>
          </div>
        )}

        {activeTab === "view" && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Button variant={viewMode === "page" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onToggleViewMode("page")}>
                {tr("Mode Page (A4)")}
              </Button>
              <Button variant={viewMode === "web" ? "default" : "outline"} size="sm" className="h-7 text-xs" onClick={() => onToggleViewMode("web")}>
                {tr("Mode Continu (Web)")}
              </Button>
            </div>
            <div className="h-4 w-px bg-hairline" />
            <Button variant={showRuler ? "secondary" : "outline"} size="sm" className="h-7 text-xs" onClick={onToggleRuler}>
              {tr("Règle")} : {tr(showRuler ? "Visible" : "Masquée")}
            </Button>
            <div className="h-4 w-px bg-hairline" />
            <Button variant="outline" size="sm" onClick={onOpenStats} className="gap-1.5 h-7 text-xs">
              <BookOpenIcon className="size-3.5" /> {tr("Statistiques")}
            </Button>
            <Button variant="outline" size="sm" onClick={onToggleFindReplace} className="gap-1.5 h-7 text-xs">
              <SearchIcon className="size-3.5" /> {tr("Rechercher")}
            </Button>
          </div>
        )}

        {activeTab === "file" && (
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onNewDoc} className="gap-1.5 h-7 text-xs">
              <FilePlusIcon className="size-3.5" /> {tr("Nouveau")}
            </Button>
            <Button variant="default" size="sm" onClick={onSave} className="gap-1.5 h-7 text-xs">
              <SaveIcon className="size-3.5" /> {tr("Enregistrer")}
            </Button>
            <div className="h-4 w-px bg-hairline" />
            <Button variant="outline" size="sm" onClick={() => onExport("docx")} className="gap-1.5 h-7 text-xs">
              <DownloadIcon className="size-3.5" /> Word (.docx)
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport("pdf")} className="gap-1.5 h-7 text-xs">
              <DownloadIcon className="size-3.5" /> PDF (.pdf)
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport("md")} className="gap-1.5 h-7 text-xs">
              Markdown
            </Button>
            <Button variant="outline" size="sm" onClick={() => onExport("txt")} className="gap-1.5 h-7 text-xs">
              {tr("Texte Brut")}
            </Button>
            <div className="h-4 w-px bg-hairline" />
            <Button variant="ghost" size="sm" onClick={onPrint} className="gap-1.5 h-7 text-xs">
              <PrinterIcon className="size-3.5" /> {tr("Imprimer")}
            </Button>
            <Button variant="ghost" size="sm" onClick={onCreateSlides} className="gap-1.5 h-7 text-xs">
              <PresentationIcon className="size-3.5" /> {tr("Créer un diaporama")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
