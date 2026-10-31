"use client";
import { handOff } from "@/lib/handoff";

import { translate } from "@/lib/i18n/ui-text";
import { BookmarkIcon, DownloadIcon, EyeIcon, FileTextIcon, FolderInputIcon, MoreHorizontalIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuRadioGroup,
  DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubContent,
  DropdownMenuSubTrigger, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { DocCategory, DocumentFile } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { CategoryBadge, DocGlyph, downloadDoc, formatSize, uploadedLabel } from "./doc-utils";

const MENU_ITEM = "max-md:min-h-10";

// Bouton favori pour marquer un document
export function StarButton({ doc, className }: { doc: DocumentFile; className?: string }) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      aria-label={doc.starred ? `Retirer des favoris ${doc.name}` : `Ajouter aux favoris ${doc.name}`}
      aria-pressed={!!doc.starred}
      onClick={(e) => {
        e.stopPropagation();
        updateDocument(doc.id, { starred: !doc.starred });
      }}
      className={cn(doc.starred && "text-warning hover-fine:text-warning", className)}
    >
      <BookmarkIcon className={cn(doc.starred && "fill-current")} />
    </Button>
  );
}

// Menu contextuel d'actions pour chaque document
async function sendToPdfTools(doc: DocumentFile) {
  const blob = await (await fetch(doc.dataUrl!)).blob();
  handOff("pdf", [new File([blob], doc.name, { type: "application/pdf" })]);
  window.dispatchEvent(new CustomEvent("gather-navigate", { detail: "/pdf-tools" }));
}

export function RowMenu({
  doc,
  onRename,
  onOpenReader,
  onEditDoc,
  className,
}: {
  doc: DocumentFile;
  onRename: (d: DocumentFile) => void;
  onOpenReader?: (d: DocumentFile) => void;
  onEditDoc?: (d: DocumentFile) => void;
  className?: string;
}) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const deleteDocument = useAppStore((s) => s.deleteDocument);
  const getAllCategories = useCategoryStore((s) => s.getAllCategories);
  const categories = getAllCategories();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Plus d'actions pour ${doc.name}`}
          onClick={(e) => e.stopPropagation()}
          className={className}
        >
          <MoreHorizontalIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52" onClick={(e) => e.stopPropagation()}>
        {onEditDoc && (
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => onEditDoc(doc)}>
            <PencilIcon /> {translate("Éditer le document")}
          </DropdownMenuItem>
        )}
        {onOpenReader && (
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => onOpenReader(doc)}>
            <EyeIcon /> {translate("Lire / Aperçu direct")}
          </DropdownMenuItem>
        )}
        {doc.dataUrl && /\.pdf$/i.test(doc.name) && (
          <DropdownMenuItem className={MENU_ITEM} onSelect={() => void sendToPdfTools(doc)}>
            {translate("Ouvrir dans la Suite PDF")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem className={MENU_ITEM} onSelect={() => downloadDoc(doc)}>
          <DownloadIcon />{translate("Download")}
        </DropdownMenuItem>
        <DropdownMenuItem className={MENU_ITEM} onSelect={() => onRename(doc)}>
          <PencilIcon />{translate("Rename")}
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger className={cn("t-14 salt gap-1.5 [&_svg]:text-icon", MENU_ITEM)}>
            <FolderInputIcon className="size-3.5" /> {translate("Déplacer vers")}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent className="w-40">
            <DropdownMenuRadioGroup
              value={doc.category}
              onValueChange={(v) => {
                updateDocument(doc.id, { category: v as DocCategory });
                toast.success(`Déplacé vers ${v}`, { description: doc.name });
              }}
            >
              {categories.map((c) => (
                <DropdownMenuRadioItem key={c} value={c} className={cn("t-14", MENU_ITEM)}>
                  {c}
                </DropdownMenuRadioItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className={MENU_ITEM}
                onSelect={() => {
                  const name = window.prompt("Nom de la nouvelle catégorie :");
                  if (name?.trim()) {
                    useCategoryStore.getState().addCategory(name.trim());
                    updateDocument(doc.id, { category: name.trim() });
                    toast.success(`Déplacé vers ${name.trim()}`);
                  }
                }}
              >
                {translate("+ Créer une catégorie…")}
              </DropdownMenuItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" className={MENU_ITEM} onSelect={() => deleteDocument(doc.id)}>
          <Trash2Icon />{translate("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

type ViewProps = {
  docs: DocumentFile[];
  today: string;
  onRename: (d: DocumentFile) => void;
  onSelectDoc: (d: DocumentFile) => void;
  onEditDoc?: (d: DocumentFile) => void;
};

// Grille de documents style Google Docs avec vignettes façon page A4
export function DocumentGrid({ docs, today, onRename, onSelectDoc, onEditDoc }: ViewProps) {
  return (
    <div className="grid grid-cols-2 gap-4 p-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {docs.map((d) => {
        const isEditable = !!d.editorContent || /\.(docx|doc|txt|md)$/i.test(d.name);
        const ext = d.name.split(".").pop()?.toUpperCase() || "DOC";
        const handleOpen = () => {
          if (isEditable && onEditDoc) onEditDoc(d);
          else onSelectDoc(d);
        };

        return (
          <div
            key={d.id}
            onClick={handleOpen}
            className="group relative flex flex-col overflow-hidden rounded-xl border border-hairline/80 bg-surface shadow-xs transition-all duration-150 hover:border-brand/40 hover:shadow-md cursor-pointer"
          >
            {/* Vignette feuille A4 réaliste */}
            <div className="relative flex h-36 w-full items-center justify-center bg-slate-100 dark:bg-zinc-900/60 p-3 overflow-hidden">
              <div className="relative flex h-full w-24 flex-col justify-between rounded-sm bg-white dark:bg-zinc-800 p-2 shadow-xs border border-hairline/60">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold tracking-wider text-brand">{ext}</span>
                  <div className="h-1 w-4 rounded-full bg-hairline" />
                </div>
                {/* Lignes de texte factices style Google Docs */}
                <div className="flex flex-col gap-1 my-auto">
                  <div className="h-1 w-full rounded-full bg-fg-2/20" />
                  <div className="h-1 w-5/6 rounded-full bg-fg-2/20" />
                  <div className="h-1 w-4/6 rounded-full bg-fg-2/15" />
                  <div className="h-1 w-3/4 rounded-full bg-fg-2/15" />
                </div>
                <div className="h-0.5 w-full bg-hairline/40" />
              </div>

              {/* Actions rapides au survol */}
              <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/40 opacity-0 backdrop-blur-xs transition-opacity duration-150 group-hover:opacity-100">
                {isEditable && onEditDoc && (
                  <Button
                    variant="brand"
                    size="sm"
                    className="h-8 gap-1 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditDoc(d);
                    }}
                  >
                    <PencilIcon className="size-3" /> {translate("Éditer")}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="sm"
                  className="h-8 gap-1 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectDoc(d);
                  }}
                >
                  <EyeIcon className="size-3" /> {translate("Aperçu")}
                </Button>
              </div>
            </div>

            {/* Métadonnées du document */}
            <div className="flex flex-col p-3 gap-1">
              <div className="flex items-start justify-between gap-1">
                <span className="text-xs font-semibold text-fg truncate flex-1 group-hover:text-brand" title={d.name}>
                  {d.name}
                </span>
                <div onClick={(e) => e.stopPropagation()} className="flex items-center -mr-1 -mt-1">
                  <StarButton doc={d} />
                  <RowMenu doc={d} onRename={onRename} onOpenReader={onSelectDoc} onEditDoc={onEditDoc} />
                </div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-fg-2">
                <CategoryBadge category={d.category} />
                <span>·</span>
                <span className="truncate">{uploadedLabel(d.uploadedAt, today)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Vue liste épurée Google Docs / Word sans tableau rigide
export function DocumentList({ docs, today, onRename, onSelectDoc, onEditDoc }: ViewProps) {
  return (
    <div className="divide-y divide-hairline border-b border-hairline bg-surface">
      {docs.map((d) => {
        const isEditable = !!d.editorContent || /\.(docx|doc|txt|md)$/i.test(d.name);
        const handleOpen = () => {
          if (isEditable && onEditDoc) onEditDoc(d);
          else onSelectDoc(d);
        };

        return (
          <div
            key={d.id}
            onClick={handleOpen}
            className="group flex items-center justify-between px-4 py-3 hover:bg-hover/60 transition-colors cursor-pointer"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <DocGlyph name={d.name} className="size-4" />
              </span>
              <div className="flex min-w-0 flex-col">
                <span className="text-xs sm:text-sm font-semibold text-fg truncate group-hover:text-brand">
                  {d.name}
                </span>
                <span className="text-[11px] text-fg-2">
                  {formatSize(d.size)} {translate("· Modifié")} {uploadedLabel(d.uploadedAt, today)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
              <CategoryBadge category={d.category} />
              <StarButton doc={d} />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={() => downloadDoc(d)} aria-label={translate("Télécharger")}>
                    <DownloadIcon className="size-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{translate("Télécharger")}</TooltipContent>
              </Tooltip>
              <RowMenu doc={d} onRename={onRename} onOpenReader={onSelectDoc} onEditDoc={onEditDoc} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DocumentTable(props: ViewProps) {
  return <DocumentList {...props} />;
}
