"use client";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { SlideItem } from "@/stores/workspace-types";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function SlideFields({ deckId, slide }: { deckId: string; slide: SlideItem }) {
  const update = (patch: Partial<SlideItem>) => useWorkspaceStore.getState().updateSlide(deckId, slide.id, patch);
  return <div className="flex flex-col gap-3">
    {slide.layout === "split" && <label>Contenu<Textarea value={slide.body ?? ""} onChange={(e) => update({ body: e.target.value })} /></label>}
    {(slide.layout === "bullets" || slide.layout === "metrics") && <label>Points (un par ligne)<Textarea value={(slide.bullets ?? []).join("\n")} onChange={(e) => update({ bullets: e.target.value.split("\n") })} /></label>}
    {slide.layout === "metrics" && <div className="flex gap-2"><label>Valeur<Input value={slide.metricNumber ?? ""} onChange={(e) => update({ metricNumber: e.target.value })} /></label><label>Libellé<Input value={slide.metricLabel ?? ""} onChange={(e) => update({ metricLabel: e.target.value })} /></label></div>}
    <label>Notes d’orateur<Textarea value={slide.notes ?? ""} onChange={(e) => update({ notes: e.target.value })} /></label>
  </div>;
}
