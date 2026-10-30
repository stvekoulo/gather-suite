"use client";

import {
  ArchiveIcon,
  DownloadIcon,
  RotateCcwIcon,
  TagIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { toast } from "sonner";
import { OverflowActions, type OverflowActionItem } from "@/components/beui/overflow-actions";
import { Button } from "@/components/ui/button";
import { saveFile } from "@/lib/files";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useBlinkoStore } from "@/stores/blinko-store";
import { exportNotesZip } from "./note-transfer";

// Barre d'actions groupées animée beUI pour les notes sélectionnées
export function NoteBatch({ ids, onClear }: { ids: string[]; onClear: () => void }) {
  const tr = useTranslate();
  const notes = useBlinkoStore((s) => s.notes);
  const selected = notes.filter((n) => ids.includes(n.id));

  if (!selected.length) return null;

  const handleArchive = () => {
    selected.forEach((n) => useBlinkoStore.getState().updateNote(n.id, { isArchived: !n.isArchived }));
    toast.success(`${selected.length} ${tr("note(s) archivée(s)")}`);
    onClear();
  };

  const handleAddTag = () => {
    const tag = window.prompt(tr("Nom du tag à associer :"))?.trim().replace(/^#/, "");
    if (tag) {
      selected.forEach((n) =>
        useBlinkoStore.getState().updateNote(n.id, { tags: [...new Set([...n.tags, tag])] })
      );
      toast.success(`Tag #${tag} appliqué`);
    }
  };

  const handleTrash = () => {
    if (!window.confirm(`${tr("Mettre")} ${selected.length} ${tr("note(s) à la corbeille ?")}`)) return;
    selected.forEach((n) => useBlinkoStore.getState().moveToTrash(n.id));
    toast.success(`${selected.length} ${tr("note(s) déplacée(s) vers la corbeille")}`);
    onClear();
  };

  const handleRestore = () => {
    selected.forEach((n) => useBlinkoStore.getState().restoreFromTrash(n.id));
    toast.success(`${selected.length} ${tr("note(s) restaurée(s)")}`);
    onClear();
  };

  const handleExportZip = async () => {
    try {
      await saveFile("gather-notes-selection.zip", await exportNotesZip(selected), "application/zip");
      toast.success(tr("Archive ZIP téléchargée"));
    } catch (error) {
      toast.error(String(error));
    }
  };

  const primaryActions: OverflowActionItem[] = [
    {
      id: "archive",
      label: tr("Archiver"),
      icon: <ArchiveIcon className="size-3.5" />,
      onClick: handleArchive,
    },
    {
      id: "tag",
      label: tr("Tag"),
      icon: <TagIcon className="size-3.5" />,
      onClick: handleAddTag,
    },
    {
      id: "export",
      label: tr("Export ZIP"),
      icon: <DownloadIcon className="size-3.5" />,
      onClick: handleExportZip,
    },
  ];

  const overflowActions: OverflowActionItem[] = [
    {
      id: "restore",
      label: tr("Restaurer"),
      icon: <RotateCcwIcon className="size-3.5" />,
      onClick: handleRestore,
    },
    {
      id: "trash",
      label: tr("Corbeille"),
      icon: <Trash2Icon className="size-3.5 text-danger" />,
      onClick: handleTrash,
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-2 font-medium text-fg">
        <span className="rounded-full bg-brand/15 px-2 py-0.5 text-xs font-semibold text-brand font-mono">
          {selected.length}
        </span>
        <span>{tr(selected.length > 1 ? "sélectionnées" : "sélectionnée")}</span>
      </div>

      <div className="flex items-center gap-2">
        <OverflowActions
          primaryActions={primaryActions}
          overflowActions={overflowActions}
          size="sm"
          openLabel={tr("Plus d'actions")}
          closeLabel={tr("Moins")}
        />
        <Button size="sm" variant="ghost" onClick={onClear} className="h-7 text-xs gap-1 px-2 text-fg-2 hover:text-fg">
          <XIcon className="size-3.5" />
          {tr("Annuler")}
        </Button>
      </div>
    </div>
  );
}
