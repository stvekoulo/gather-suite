"use client";
import { translate } from "@/lib/i18n/ui-text";

import { FileTextIcon, FolderOpenIcon, SearchXIcon, UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocumentFile } from "@/lib/types";
import type { Filter } from "./doc-utils";
import { EmptyState } from "@/components/pages/shared/page-chrome";
import { DocumentGrid, DocumentList } from "./doc-views";

// Contenu central de la bibliothèque Google Docs / Word
export function DocumentsContent({
  docs,
  totalCount,
  today,
  hasFilters,
  filter,
  query,
  view,
  onResetFilters,
  onOpenFilePicker,
  onNewDoc,
  onRename,
  onSelectDoc,
  onEditDoc,
}: {
  docs: DocumentFile[];
  totalCount: number;
  today: string;
  hasFilters: boolean;
  filter: Filter;
  query: string;
  view: "list" | "grid";
  onResetFilters: () => void;
  onOpenFilePicker: () => void;
  onNewDoc: () => void;
  onRename: (d: DocumentFile) => void;
  onSelectDoc: (d: DocumentFile) => void;
  onEditDoc: (d: DocumentFile) => void;
}) {
  if (totalCount === 0) {
    return (
      <EmptyState
        className="flex-1 py-12"
        icon={<FolderOpenIcon />}
        title={translate("Aucun document pour le moment")}
        hint={translate("Démarrez avec l'un des modèles ci-dessus ou importez vos contrats, fiches de paie et fichiers existants.")}
        action={
          <div className="flex items-center gap-3">
            <Button variant="brand" size="sm" onClick={onOpenFilePicker}>
              <UploadIcon className="size-3.5" /> {translate("Importer des fichiers")}
            </Button>
            <Button variant="outline" size="sm" onClick={onNewDoc}>
              <FileTextIcon className="size-3.5" /> {translate("Document vierge")}
            </Button>
          </div>
        }
      />
    );
  }

  if (docs.length === 0) {
    return (
      <EmptyState
        className="flex-1 py-12"
        icon={<SearchXIcon />}
        title={filter === "starred" && !query ? "Aucun document favori" : "Aucun document correspondant"}
        hint={
          filter === "starred" && !query
            ? "Cliquez sur l'étoile d'un document pour l'épingler dans vos favoris."
            : "Modifiez votre recherche ou sélectionnez une autre catégorie."
        }
        action={hasFilters ? <Button size="sm" onClick={onResetFilters}>{translate("Effacer les filtres")}</Button> : null}
      />
    );
  }

  if (view === "list") {
    return (
      <DocumentList
        docs={docs}
        today={today}
        onRename={onRename}
        onSelectDoc={onSelectDoc}
        onEditDoc={onEditDoc}
      />
    );
  }

  return (
    <DocumentGrid
      docs={docs}
      today={today}
      onRename={onRename}
      onSelectDoc={onSelectDoc}
      onEditDoc={onEditDoc}
    />
  );
}
