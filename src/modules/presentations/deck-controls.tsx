"use client";
import { useState } from "react";
import { toast } from "sonner";
import type { PresentationDeck } from "@/stores/workspace-types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveFile, safeFilename } from "@/lib/files";

export function DeckControls({ deck }: { deck: PresentationDeck }) {
  const [busy, setBusy] = useState(false);
  const update = useWorkspaceStore((s) => s.updateDeck);
  return <div className="flex flex-wrap items-center gap-2 border-b border-hairline p-3">
    <Input aria-label="Titre de la présentation" value={deck.title} onChange={(e) => update(deck.id, { title: e.target.value })} className="max-w-64" />
    <select aria-label="Thème de la présentation" value={deck.theme} onChange={(e) => update(deck.id, { theme: e.target.value as PresentationDeck["theme"] })} className="rounded border border-hairline bg-surface p-2 text-fg">{["light", "dark", "gradient", "minimal"].map((theme) => <option key={theme}>{theme}</option>)}</select>
    <Button disabled={busy} onClick={async () => { setBusy(true); try { const { createPptx } = await import("./export-pptx"); await saveFile(`${safeFilename(deck.title)}.pptx`, await createPptx(deck)); } catch (error) { toast.error(String(error)); } finally { setBusy(false); } }}>{busy ? "Export…" : "Exporter PPTX"}</Button>
    <Button variant="ghost" onClick={() => { if (window.confirm(`Supprimer la présentation « ${deck.title} » ?`)) useWorkspaceStore.getState().deleteDeck(deck.id); }}>Supprimer</Button>
  </div>;
}
