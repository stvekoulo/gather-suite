"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { DocumentFile } from "@/lib/types";
import { flushStorage } from "@/lib/storage/workspace-storage";
import { useUnsavedChanges } from "@/hooks/use-unsaved-changes";
import { documentToSlides } from "./document-format";
import { defaultLayout, type DocumentLayout } from "./document-layout";
import { WordStudioHeader } from "./word-studio-header";
import { WordStudioFooter } from "./word-studio-footer";
import { WordcraftRibbon } from "./wordcraft-ribbon";
import { WordcraftCanvas } from "./wordcraft-canvas";
import { PageSetupDialog } from "./page-setup-dialog";
import { ImageInsertDialog } from "./image-insert-dialog";
import { DocumentStatsDialog } from "./document-stats-dialog";
import { FindReplaceBar } from "./find-replace-bar";
import { exportWordDocument } from "./word-studio-io";
import { useWordcraftEditor } from "./use-wordcraft-editor";
import { saveWordStudioDoc } from "./word-studio-save";
import { extractDocumentHtml } from "./doc-extract";
import { toast } from "sonner";
import "./editor.css";

// Espace d'édition Word Studio pour Gather inspiré de Wordcraft
export function WordStudio({
  initialDoc,
  initialContent,
  onBack,
}: {
  initialDoc?: DocumentFile;
  initialContent?: string;
  onBack: () => void;
}) {
  const router = useRouter();
  const documents = useAppStore((s) => s.documents);
  const [currentDoc, setCurrentDoc] = useState<DocumentFile | undefined>(initialDoc);
  const [title, setTitle] = useState(initialDoc?.name.replace(/\.[^.]+$/, "") ?? "Sans titre");
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [layout, setLayout] = useState<DocumentLayout>(initialDoc?.pageSetup ?? defaultLayout);
  const [pageSetupOpen, setPageSetupOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [statsDialogOpen, setStatsDialogOpen] = useState(false);
  const [findReplaceOpen, setFindReplaceOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"page" | "web">("page");
  const [showRuler, setShowRuler] = useState(true);
  const [zoom, setZoom] = useState(100);

  useUnsavedChanges(dirty);

  useEffect(() => {
    if (currentDoc?.id) {
      try { localStorage.setItem("gather:active-doc-id", currentDoc.id); } catch {}
    }
  }, [currentDoc?.id]);

  const editor = useWordcraftEditor({
    initialDoc,
    initialContent,
    onUpdate: () => setDirty(true),
  });

  // Sauvegarde automatique transparente des modifications en cours
  useEffect(() => {
    if (!dirty || !editor || !currentDoc?.id) return;
    const t = setTimeout(() => {
      const json = editor.getJSON();
      useAppStore.getState().updateDocument(currentDoc.id, { editorContent: json, pageSetup: layout });
      setDirty(false);
    }, 1500);
    return () => clearTimeout(t);
  }, [dirty, editor, currentDoc?.id, layout]);

  const wordCount = useMemo(() => {
    if (!editor) return 0;
    const text = editor.getText().trim();
    return text ? text.split(/\s+/).length : 0;
  }, [editor, dirty]);

  function switchDocument(docId: string) {
    if (dirty && !window.confirm("Changer de document sans enregistrer ?")) return;
    if (docId === "new") {
      try { localStorage.removeItem("gather:active-doc-id"); } catch {}
      setCurrentDoc(undefined);
      setTitle("Sans titre");
      setLayout(defaultLayout);
      editor?.commands.setContent("<p></p>");
      setDirty(false);
      return;
    }
    const target = documents.find((d) => d.id === docId);
    if (!target) return;
    try { localStorage.setItem("gather:active-doc-id", target.id); } catch {}
    setCurrentDoc(target);
    setTitle(target.name.replace(/\.[^.]+$/, ""));
    setLayout(target.pageSetup ?? defaultLayout);
    if (target.editorContent) {
      editor?.commands.setContent(target.editorContent);
    } else if (target.dataUrl) {
      void extractDocumentHtml(target).then((html) => editor?.commands.setContent(html));
    }
    setDirty(false);
  }

  async function handleSave() {
    if (!editor) return;
    setBusy(true);
    const updated = await saveWordStudioDoc({ title, content: editor.getJSON(), layout, currentDoc });
    if (updated) {
      setCurrentDoc(updated);
      setDirty(false);
    }
    setBusy(false);
  }

  const handleExport = async (format: "docx" | "pdf" | "md" | "txt") => {
    if (!editor) return;
    setBusy(true);
    await exportWordDocument(title, editor.getJSON(), layout, format);
    setBusy(false);
  };

  const handleCreateSlides = async () => {
    if (!editor) return;
    useWorkspaceStore.getState().addDeck({
      title,
      description: "Générée depuis un document Gather",
      theme: "light",
      slides: documentToSlides(title, editor.getJSON()),
    });
    await flushStorage();
    toast.success("Présentation créée");
    router.push("/presentations");
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface">
      <WordStudioHeader
        currentDoc={currentDoc}
        documents={documents}
        title={title}
        dirty={dirty}
        busy={busy}
        canCreateSlides={!!editor}
        onBack={() => {
          if (dirty && !window.confirm("Quitter sans enregistrer ?")) return;
          onBack();
        }}
        onSwitchDoc={switchDocument}
        onChangeTitle={(t) => {
          setTitle(t);
          setDirty(true);
        }}
        onSave={() => void handleSave()}
        onExport={(f) => void handleExport(f)}
        onOpenPageSetup={() => setPageSetupOpen(true)}
        onPrint={() => window.print()}
        onCreateSlides={() => void handleCreateSlides()}
      />

      <WordcraftRibbon
        editor={editor}
        layout={layout}
        onChangeLayout={(patch) => {
          setLayout((prev) => ({ ...prev, ...patch }));
          setDirty(true);
        }}
        onOpenPageSetup={() => setPageSetupOpen(true)}
        onOpenImageDialog={() => setImageDialogOpen(true)}
        onOpenStats={() => setStatsDialogOpen(true)}
        onToggleFindReplace={() => setFindReplaceOpen((v) => !v)}
        viewMode={viewMode}
        onToggleViewMode={setViewMode}
        showRuler={showRuler}
        onToggleRuler={() => setShowRuler((v) => !v)}
        onSave={() => void handleSave()}
        onExport={(f) => void handleExport(f)}
        onPrint={() => window.print()}
        onCreateSlides={() => void handleCreateSlides()}
        onNewDoc={() => switchDocument("new")}
      />

      <FindReplaceBar editor={editor} open={findReplaceOpen} onClose={() => setFindReplaceOpen(false)} />

      <WordcraftCanvas
        editor={editor}
        layout={layout}
        title={title}
        zoom={zoom}
        showRuler={showRuler}
        viewMode={viewMode}
      />

      <WordStudioFooter
        wordCount={wordCount}
        layout={layout}
        dirty={dirty}
        viewMode={viewMode}
        zoom={zoom}
        onOpenPageSetup={() => setPageSetupOpen(true)}
        onOpenStats={() => setStatsDialogOpen(true)}
        onToggleViewMode={setViewMode}
        onChangeZoom={setZoom}
      />

      <PageSetupDialog
        open={pageSetupOpen}
        onClose={() => setPageSetupOpen(false)}
        layout={layout}
        onChange={(patch) => {
          setLayout((prev) => ({ ...prev, ...patch }));
          setDirty(true);
        }}
      />

      <ImageInsertDialog
        open={imageDialogOpen}
        onClose={() => setImageDialogOpen(false)}
        onInsert={(data) => {
          editor?.chain().focus().setImage({ src: data.src, alt: data.alt }).setTextAlign(data.align ?? "center").run();
        }}
      />

      <DocumentStatsDialog
        open={statsDialogOpen}
        onClose={() => setStatsDialogOpen(false)}
        editor={editor}
      />
    </div>
  );
}
