"use client";

import { toast } from "sonner";
import { safeFilename, saveFile } from "@/lib/files";
import { createPptx } from "@/modules/presentations/export-pptx";
import type { PresentationDeck, SlideElement, SlideItem } from "@/stores/workspace-types";

// Opérations de manipulation des diapositives et éléments Deckcraft
export function usePresentationOps(
  activeDeck: PresentationDeck | undefined,
  activeSlideIndex: number,
  setActiveSlideIndex: (i: number | ((prev: number) => number)) => void,
  currentSlide: SlideItem | undefined,
  updateDeck: (id: string, patch: Partial<PresentationDeck>) => void,
  updateSlide: (deckId: string, slideId: string, patch: Partial<SlideItem>) => void,
  addSlide: (deckId: string, slide: SlideItem) => void,
  deleteSlide: (deckId: string, slideId: string) => void,
  setSelectedElementId: (id: string | null) => void
) {
  const handleAddSlide = (layout: SlideItem["layout"] = "title") => {
    if (!activeDeck) return;
    const newSlide: SlideItem = {
      id: `slide-${crypto.randomUUID()}`,
      layout,
      title: layout === "blank" ? "" : layout === "title" ? "Nouvelle diapositive" : "Titre de section",
      subtitle: layout === "title" ? "Sous-titre" : undefined,
      background: activeDeck.theme === "dark" ? "#09090b" : "#ffffff",
      elements: [],
    };
    addSlide(activeDeck.id, newSlide);
    setActiveSlideIndex(activeDeck.slides.length);
  };

  const handleDuplicateSlide = (index: number) => {
    if (!activeDeck) return;
    const orig = activeDeck.slides[index];
    const clone: SlideItem = { ...orig, id: `slide-${crypto.randomUUID()}` };
    const nextSlides = [...activeDeck.slides];
    nextSlides.splice(index + 1, 0, clone);
    updateDeck(activeDeck.id, { slides: nextSlides });
    setActiveSlideIndex(index + 1);
  };

  const handleDeleteSlide = (index: number) => {
    if (!activeDeck || activeDeck.slides.length <= 1) return;
    deleteSlide(activeDeck.id, activeDeck.slides[index].id);
    setActiveSlideIndex(Math.max(0, index - 1));
  };

  const handleMoveSlide = (from: number, to: number) => {
    if (!activeDeck || to < 0 || to >= activeDeck.slides.length) return;
    const nextSlides = [...activeDeck.slides];
    const [moved] = nextSlides.splice(from, 1);
    nextSlides.splice(to, 0, moved);
    updateDeck(activeDeck.id, { slides: nextSlides });
    setActiveSlideIndex(to);
  };

  const handleExportPptx = async () => {
    if (!activeDeck) return;
    try {
      const bytes = await createPptx(activeDeck);
      await saveFile(`${safeFilename(activeDeck.title)}.pptx`, bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      toast.success("Présentation PPTX exportée");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const handleAddElement = (type: SlideElement["type"]) => {
    if (!activeDeck || !currentSlide) return;
    const newEl: SlideElement = {
      id: crypto.randomUUID(), type, x: 340, y: 220,
      width: type === "text" ? 400 : type === "arrow" ? 240 : type === "star" ? 180 : 200,
      height: type === "text" ? 80 : type === "arrow" ? 120 : type === "star" ? 180 : 150,
      text: type === "text" ? "Nouveau texte" : undefined,
      color: "#f97316", fill: type === "text" ? "transparent" : "#fed7aa", fontSize: 24,
    };
    const nextElements = [...(currentSlide.elements ?? []), newEl];
    updateSlide(activeDeck.id, currentSlide.id, { elements: nextElements });
    setSelectedElementId(newEl.id);
  };

  const handleInsertImage = (dataUrl: string) => {
    if (!activeDeck || !currentSlide) return;
    const imgEl: SlideElement = {
      id: crypto.randomUUID(), type: "image", x: 280, y: 160,
      width: 480, height: 320, dataUrl,
      color: "#000000", fill: "transparent", fontSize: 18,
    };
    const nextElements = [...(currentSlide.elements ?? []), imgEl];
    updateSlide(activeDeck.id, currentSlide.id, { elements: nextElements });
    setSelectedElementId(imgEl.id);
  };

  return {
    handleAddSlide,
    handleDuplicateSlide,
    handleDeleteSlide,
    handleMoveSlide,
    handleExportPptx,
    handleAddElement,
    handleInsertImage,
  };
}
