"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useEffect, useMemo, useRef, useState } from "react";
import { UploadIcon } from "lucide-react";
import { toast } from "sonner";
import type { DocCategory, DocumentFile } from "@/lib/types";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { useCategoryStore } from "@/stores/doc-categories-store";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { guessCategory, readAsDataUrl, type Filter } from "./doc-utils";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { TemplateBanner } from "./template-banner";
import { DocumentsToolbar } from "./documents-toolbar";
import { DocumentsContent } from "./documents-content";
import { DocReader } from "./doc-reader";
import { RenameDialog } from "./rename-dialog";
import { CategoryDialog } from "./category-dialog";
import { WordStudio } from "@/modules/documents/word-studio";
import { useHandoff } from "@/lib/handoff";
import { extractDocumentHtml } from "@/modules/documents/doc-extract";
import type { DocTemplate } from "@/modules/documents/templates-data";

// ponytail: files live in memory while the app runs; raise this once they are read on demand.
const MAX_IMPORT_BYTES = 200 * 1024 * 1024;

// Page principale Documents avec interface Google Docs & Word Studio
export function DocumentsPage() {
  const today = useToday();
  const documents = useAppStore((s) => s.documents);
  const addDocument = useAppStore((s) => s.addDocument);
  const getAllCategories = useCategoryStore((s) => s.getAllCategories);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allCategories = useMemo(() => getAllCategories(documents), [getAllCategories, documents, customCategories]);

  const [mode, setMode] = useState<"library" | "studio">("library");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [view, setView] = useState<"list" | "grid">("grid");
  const [renaming, setRenaming] = useState<DocumentFile | null>(null);
  const [readingDoc, setReadingDoc] = useState<DocumentFile | null>(() => {
    try { return useAppStore.getState().documents.find((d) => d.id === localStorage.getItem("gather:reading-doc-id")) ?? null; } catch { return null; }
  });
  const [editingDoc, setEditingDoc] = useState<DocumentFile | undefined>();
  const [initialContent, setInitialContent] = useState<string | undefined>();
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [_importDialogOpen, setImportDialogOpen] = useState(false);

  const handleEditDoc = async (d: DocumentFile) => {
    try { localStorage.setItem("gather:active-doc-id", d.id); } catch {}
    if (!d.editorContent && d.dataUrl) {
      toast.loading(`Extraction du contenu de « ${d.name} » pour l'éditeur…`, { id: "edit-prep" });
      try {
        const content = await extractDocumentHtml(d);
        toast.dismiss("edit-prep");
        setEditingDoc(d);
        setInitialContent(content);
        setMode("studio");
        return;
      } catch {
        toast.dismiss("edit-prep");
      }
    }
    setEditingDoc(d);
    setInitialContent(undefined);
    setMode("studio");
  };

  useEffect(() => {
    try {
      const activeId = localStorage.getItem("gather:active-doc-id");
      if (activeId) {
        const doc = useAppStore.getState().documents.find((d) => d.id === activeId);
        // eslint-disable-next-line react-hooks/set-state-in-effect -- reopens the document left open at the last launch
        if (doc) { void handleEditDoc(doc); return; }
      }
    } catch {}
  }, []);

  useEffect(() => {
    const open = (event: Event) => {
      const doc = useAppStore.getState().documents.find((d) => d.id === (event as CustomEvent<string>).detail);
      if (doc) void handleEditDoc(doc);
    };
    window.addEventListener("open-workspace-document", open);
    return () => window.removeEventListener("open-workspace-document", open);
  }, []);

  useHandoff("document", (id) => {
    const doc = useAppStore.getState().documents.find((d) => d.id === id);
    if (!doc) return;
    if (doc.editorContent || /\.(docx|txt|md)$/i.test(doc.name)) void handleEditDoc(doc);
    else setReadingDoc(doc);
  });

  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const dragDepth = useRef(0);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: documents.length, starred: documents.filter((d) => d.starred).length };
    for (const cat of allCategories) c[cat] = documents.filter((d) => d.category === cat).length;
    return c;
  }, [documents, allCategories]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = documents.filter(
      (d) =>
        (filter === "all" || (filter === "starred" ? d.starred : d.category === filter)) &&
        (!q || d.name.toLowerCase().includes(q) || d.category.toLowerCase().includes(q))
    );
    return [...list].sort((a, b) => b.uploadedAt.localeCompare(a.uploadedAt));
  }, [documents, filter, query]);

  async function upload(files: FileList | File[], forcedCategory?: DocCategory) {
    const list = Array.from(files);
    if (!list.length) return;
    const fallback: DocCategory = forcedCategory || (filter !== "all" && filter !== "starred" ? filter : "Autre");
    let uploaded = 0;
    const finishOperation = beginSpaceOperation();
    toast.loading(list.length === 1 ? `Importation de « ${list[0].name} »…` : `Importation de ${list.length} documents…`, { id: "import-doc" });
    try {
      for (const file of list) {
        const category = guessCategory(file.name, fallback);
        if (file.size > MAX_IMPORT_BYTES) { toast.error(`« ${file.name} » dépasse la limite de 200 Mo.`); continue; }
        try {
          const dataUrl = await readAsDataUrl(file);
          addDocument({ name: file.name, category, size: file.size, dataUrl, starred: false });
          uploaded++;
        } catch (error) {
          toast.error(`Import impossible : ${file.name}`, { description: String(error) });
        }
      }
      if (uploaded) {
        toast.success(uploaded === 1 ? "Document importé avec succès" : `${uploaded} documents importés avec succès`, { id: "import-doc" });
      } else {
        toast.dismiss("import-doc");
      }
      setQuery("");
      if (filter === "starred") setFilter("all");
    } finally {
      finishOperation();
    }
  }

  const handleSelectTemplate = (tmpl: DocTemplate) => {
    setEditingDoc(undefined);
    setInitialContent(tmpl.content);
    setMode("studio");
  };

  const handleNewDoc = () => {
    setEditingDoc(undefined);
    setInitialContent("<p></p>");
    setMode("studio");
  };

  if (mode === "studio") {
    return (
      <WordStudio
        initialDoc={editingDoc}
        initialContent={initialContent}
        onBack={() => {
          try { localStorage.removeItem("gather:active-doc-id"); } catch {}
          setMode("library");
          setEditingDoc(undefined);
          setInitialContent(undefined);
        }}
      />
    );
  }

  return (
    <PageRoot
      className="relative bg-surface select-none"
      onDragEnter={(e) => {
        if (!e.dataTransfer.types.includes("Files")) return;
        dragDepth.current += 1;
        setDragging(true);
      }}
      onDragOver={(e) => {
        if (e.dataTransfer.types.includes("Files")) e.preventDefault();
      }}
      onDragLeave={() => {
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (!dragDepth.current) setDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        dragDepth.current = 0;
        setDragging(false);
        if (e.dataTransfer.files.length) void upload(e.dataTransfer.files);
      }}
    >
      <input
        ref={fileInput}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) void upload(e.target.files);
          e.target.value = "";
        }}
      />

      <PageHeader
        title="Gather Documents"
        description={`${documents.length} document${documents.length > 1 ? "s" : ""} · Stockage local sécurisé`}
      />

      <TemplateBanner onSelectTemplate={handleSelectTemplate} />

      <DocumentsToolbar
        filter={filter}
        setFilter={setFilter}
        categories={allCategories}
        counts={counts}
        query={query}
        setQuery={setQuery}
        view={view}
        setView={setView}
        onOpenCategoryDialog={() => setCategoryDialogOpen(true)}
        onOpenImportDialog={() => setImportDialogOpen(true)}
      />

      <DocumentsContent
        docs={visible}
        totalCount={documents.length}
        today={today}
        hasFilters={query.trim() !== "" || filter !== "all"}
        filter={filter}
        query={query}
        view={view}
        onResetFilters={() => {
          setQuery("");
          setFilter("all");
        }}
        onOpenFilePicker={() => fileInput.current?.click()}
        onNewDoc={handleNewDoc}
        onRename={setRenaming}
        onSelectDoc={(d) => {
          try { localStorage.setItem("gather:reading-doc-id", d.id); } catch {}
          setReadingDoc(d);
        }}
        onEditDoc={handleEditDoc}
      />

      {dragging && (
        <div className="pointer-events-none absolute inset-2 z-20 flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-brand bg-surface/90 duration-150 animate-in fade-in-0">
          <UploadIcon className="size-6 text-brand" />
          <p className="text-sm font-semibold text-fg">{translate("Déposez vos fichiers pour les importer")}</p>
          <p className="text-xs text-fg-2">{translate("Les fichiers restent entièrement sur cet ordinateur")}</p>
        </div>
      )}

      <RenameDialog doc={renaming} onClose={() => setRenaming(null)} />
      <CategoryDialog open={categoryDialogOpen} onClose={() => setCategoryDialogOpen(false)} />

      {readingDoc && (
        <DocReader
          doc={readingDoc}
          onClose={() => {
            try { localStorage.removeItem("gather:reading-doc-id"); } catch {}
            setReadingDoc(null);
          }}
          onEditInStudio={handleEditDoc}
        />
      )}
    </PageRoot>
  );
}
