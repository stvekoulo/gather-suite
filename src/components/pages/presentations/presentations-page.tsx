"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useHandoff } from "@/lib/handoff";

import { useEffect, useMemo, useRef, useState } from "react";
import { useWorkspaceUndo } from "@/modules/spaces/use-workspace-undo";
import { FileUpIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { PresentationDeck, SlideItem } from "@/stores/workspace-types";
import { DeckcraftRibbon } from "@/modules/presentations/deckcraft-ribbon";
import { DeckcraftFooter } from "@/modules/presentations/deckcraft-footer";
import { SlideFilmstrip } from "@/modules/presentations/slide-filmstrip";
import { WysiwygSlideCanvas } from "@/modules/presentations/wysiwyg-slide-canvas";
import { SpeakerNotes } from "@/modules/presentations/speaker-notes";
import { SlidePresenter } from "./slide-presenter";
import { PresenterViewDialog } from "@/modules/presentations/presenter-view-dialog";
import { SlideImageDialog } from "@/modules/presentations/slide-image-dialog";
import { DeckTemplateBanner } from "@/modules/presentations/deck-template-banner";
import { RecentDecksGrid } from "@/modules/presentations/recent-decks-grid";
import type { DeckTemplate } from "@/modules/presentations/presentation-templates";
import { usePresentationOps } from "@/modules/presentations/use-presentation-ops";
import { beginSpaceOperation } from "@/modules/spaces/operations";

// Studio PowerPoint Gather complet style Deckcraft avec ruban 7 onglets, Presenter View et diaporama F5
export function PresentationsPage() {
  const decks = useWorkspaceStore((s) => s.decks);
  const activeDeckId = useWorkspaceStore((s) => s.activeDeckId);
  const setActiveDeckId = useWorkspaceStore((s) => s.setActiveDeckId);
  const addDeck = useWorkspaceStore((s) => s.addDeck);
  const updateDeck = useWorkspaceStore((s) => s.updateDeck);
  const deleteDeck = useWorkspaceStore((s) => s.deleteDeck);
  const addSlide = useWorkspaceStore((s) => s.addSlide);
  const updateSlide = useWorkspaceStore((s) => s.updateSlide);
  const deleteSlide = useWorkspaceStore((s) => s.deleteSlide);

  const activeDeck = useMemo(() => decks.find((d) => d.id === activeDeckId) ?? decks[0], [decks, activeDeckId]);
  // Restaure le mode éditeur si l'utilisateur était en train d'éditer
  const [mode, setMode] = useState<"home" | "editor">(() => {
    try { return localStorage.getItem("gather:active-deck-mode") === "editor" && activeDeck ? "editor" : "home"; } catch { return "home"; }
  });
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [isPresenterView, setIsPresenterView] = useState(false);
  const [presentationStartIdx, setPresentationStartIdx] = useState(0);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [isImageDialogOpen, setIsImageDialogOpen] = useState(false);
  const [showFilmstrip, setShowFilmstrip] = useState(true);
  const [showNotes, setShowNotes] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [zoom, setZoom] = useState(100);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentSlide = activeDeck?.slides[activeSlideIndex] ?? activeDeck?.slides[0];

  const {
    handleAddSlide,
    handleDuplicateSlide,
    handleDeleteSlide,
    handleMoveSlide,
    handleExportPptx,
    handleAddElement,
    handleInsertImage,
  } = usePresentationOps(
    activeDeck,
    activeSlideIndex,
    setActiveSlideIndex,
    currentSlide,
    updateDeck,
    updateSlide,
    addSlide,
    deleteSlide,
    setSelectedElementId
  );

  // Raccourcis clavier F5 (début) et Shift+F5 (courante)
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "F5" && activeDeck && mode === "editor") {
        e.preventDefault();
        setPresentationStartIdx(e.shiftKey ? activeSlideIndex : 0);
        setIsPresenting(true);
      }
      if ((e.ctrlKey || e.metaKey) && !e.altKey && activeDeck && mode === "editor" && !(e.target instanceof HTMLElement && (e.target.isContentEditable || ["INPUT", "TEXTAREA"].includes(e.target.tagName)))) {
        const k = e.key.toLowerCase();
        if (k === "m") { e.preventDefault(); handleAddSlide(); }
        else if (k === "d") { e.preventDefault(); handleDuplicateSlide(activeSlideIndex); }
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the handlers follow these values
  }, [activeDeck, activeSlideIndex, mode]);
  useWorkspaceUndo("decks");

  const handleOpenDeck = (d: PresentationDeck) => {
    try { localStorage.setItem("gather:active-deck-mode", "editor"); } catch {}
    setActiveDeckId(d.id);
    setActiveSlideIndex(0);
    setMode("editor");
  };

  useHandoff("deck", (id) => { const d = decks.find((x) => x.id === id); if (d) handleOpenDeck(d); });

  const handleSelectTemplate = (tmpl: DeckTemplate) => {
    const created = addDeck({
      title: tmpl.name,
      description: tmpl.description,
      theme: tmpl.theme,
      ratio: "16:9",
      slides: tmpl.slides.map((s) => ({ ...s, id: `slide-${crypto.randomUUID()}` })),
    });
    handleOpenDeck(created);
    toast.success(`Présentation « ${tmpl.name} » créée`);
  };

  const handleImportPptx = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    const finishOperation = beginSpaceOperation();
    setIsImporting(true);
    toast.loading(`Import de « ${file.name} » en cours…`, { id: "import-pptx" });
    try {
      const { importPptx } = await import("@/modules/presentations/import-pptx");
      const result = await importPptx(file);
      const created = addDeck(result.deck);
      handleOpenDeck(created);
      toast.success(translate("Présentation PPTX importée avec succès"), { id: "import-pptx" });
    } catch (error) {
      toast.error(`Erreur d’importation : ${String(error)}`, { id: "import-pptx" });
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
      setIsImporting(false);
      finishOperation();
    }
  };

  if (mode === "home" || !activeDeck) {
    return (
      <PageRoot className="relative select-none bg-surface">
        <input ref={fileInputRef} type="file" accept=".pptx" className="hidden" onClick={(e) => { (e.target as HTMLInputElement).value = ""; }} onChange={handleImportPptx} />
        <PageHeader
          title={translate("Gather PowerPoint Studio")}
          description={`${decks.length} présentation${decks.length > 1 ? "s" : ""} · Support PPTX & diaporama`}
          actions={
            <Button variant="outline" size="sm" disabled={isImporting} onClick={() => fileInputRef.current?.click()} className="gap-2 text-xs">
              {isImporting ? <><Loader2Icon className="size-3.5 animate-spin text-orange-600" /><span>{translate("Importation en cours…")}</span></> : <><FileUpIcon className="size-3.5 text-orange-600" /><span>{translate("Importer un fichier PPTX")}</span></>}
            </Button>
          }
        />
        <DeckTemplateBanner onSelectTemplate={handleSelectTemplate} />
        <RecentDecksGrid decks={decks} onOpenDeck={handleOpenDeck} onDeleteDeck={(id) => deleteDeck(id)} />
      </PageRoot>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-surface select-none">
      <DeckcraftRibbon
        deck={activeDeck}
        currentSlide={currentSlide}
        activeSlideIndex={activeSlideIndex}
        onBack={() => {
          try { localStorage.removeItem("gather:active-deck-mode"); } catch {}
          setMode("home");
        }}
        onChangeTitle={(t) => updateDeck(activeDeck.id, { title: t })}
        onAddSlide={handleAddSlide}
        onChangeLayout={(layout) => currentSlide && updateSlide(activeDeck.id, currentSlide.id, { layout })}
        onDuplicateSlide={() => handleDuplicateSlide(activeSlideIndex)}
        onDeleteSlide={() => handleDeleteSlide(activeSlideIndex)}
        onChangeTheme={(theme) => updateDeck(activeDeck.id, { theme })}
        onChangeRatio={(ratio) => updateDeck(activeDeck.id, { ratio })}
        onChangeTransition={(transition) => updateDeck(activeDeck.id, { transition })}
        onChangeSlideBg={(bg) => currentSlide && updateSlide(activeDeck.id, currentSlide.id, { background: bg })}
        onPlayFromStart={() => { setPresentationStartIdx(0); setIsPresenting(true); }}
        onPlayFromCurrent={() => { setPresentationStartIdx(activeSlideIndex); setIsPresenting(true); }}
        onOpenPresenterView={() => setIsPresenterView(true)}
        onExportPptx={() => void handleExportPptx()}
        onExportPdf={() => window.print()}
        onPrint={() => window.print()}
        onAddElement={handleAddElement}
        onOpenImageDialog={() => setIsImageDialogOpen(true)}
        showFilmstrip={showFilmstrip}
        onToggleFilmstrip={() => setShowFilmstrip((v) => !v)}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((v) => !v)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        zoom={zoom}
        onChangeZoom={setZoom}
        onNewDeck={() => handleSelectTemplate({ id: "blank", name: "Présentation vierge", description: "Diapositives épurées", theme: "light", slides: [{ layout: "title", title: "Titre de la présentation", subtitle: "Sous-titre" }] })}
        onTriggerImport={() => fileInputRef.current?.click()}
      />

      <div className="min-h-0 flex-1 flex flex-col md:flex-row overflow-hidden">
        {showFilmstrip && (
          <SlideFilmstrip
            slides={activeDeck.slides}
            activeIndex={activeSlideIndex}
            theme={activeDeck.theme}
            onSelectSlide={setActiveSlideIndex}
            onAddSlide={() => handleAddSlide("title")}
            onDuplicateSlide={handleDuplicateSlide}
            onDeleteSlide={handleDeleteSlide}
            onMoveSlide={handleMoveSlide}
          />
        )}

        <main className="min-h-0 min-w-0 flex-1 flex flex-col overflow-y-auto bg-slate-100/90 dark:bg-zinc-950 p-4 sm:p-8 items-center gap-4 scroll-thin">
          {currentSlide && (
            <>
              <WysiwygSlideCanvas
                slide={currentSlide}
                theme={activeDeck.theme}
                ratio={activeDeck.ratio}
                showGrid={showGrid}
                zoom={zoom}
                selectedElementId={selectedElementId}
                onSelectElement={setSelectedElementId}
                onUpdateSlide={(patch) => updateSlide(activeDeck.id, currentSlide.id, patch)}
              />

              {showNotes && (
                <SpeakerNotes
                  notes={currentSlide.notes}
                  onChangeNotes={(notes) => updateSlide(activeDeck.id, currentSlide.id, { notes })}
                />
              )}
            </>
          )}
        </main>
      </div>

      <DeckcraftFooter
        deck={activeDeck}
        activeSlideIndex={activeSlideIndex}
        totalSlides={activeDeck.slides.length}
        showNotes={showNotes}
        onToggleNotes={() => setShowNotes((v) => !v)}
        showGrid={showGrid}
        onToggleGrid={() => setShowGrid((v) => !v)}
        zoom={zoom}
        onChangeZoom={setZoom}
        onPlayFromStart={() => { setPresentationStartIdx(0); setIsPresenting(true); }}
        onOpenPresenterView={() => setIsPresenterView(true)}
      />

      {isPresenting && (
        <SlidePresenter deck={activeDeck} initialIndex={presentationStartIdx} onClose={() => setIsPresenting(false)} />
      )}

      {isPresenterView && (
        <PresenterViewDialog deck={activeDeck} initialIndex={activeSlideIndex} onClose={() => setIsPresenterView(false)} />
      )}

      <SlideImageDialog
        open={isImageDialogOpen}
        onClose={() => setIsImageDialogOpen(false)}
        onInsertImage={handleInsertImage}
      />
    </div>
  );
}
