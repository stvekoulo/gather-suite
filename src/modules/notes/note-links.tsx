"use client";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useBlinkoStore } from "@/stores/blinko-store";
import { Button } from "@/components/ui/button";

export function resolveNote(notes: BlinkoNote[], target: string) {
  return notes.find((n) => !n.isRecycle && (n.id === target || n.title?.toLocaleLowerCase() === target.toLocaleLowerCase()));
}
export function NoteLinks({ note, onOpen }: { note: BlinkoNote; onOpen: (note: BlinkoNote) => void }) {
  const notes = useBlinkoStore((s) => s.notes);
  const backlinks = notes.filter((n) => !n.isRecycle && n.id !== note.id && n.references.some((ref) => resolveNote(notes, ref)?.id === note.id));
  return <div className="space-y-2 border-t border-hairline pt-3 text-sm"><h3>Liens sortants</h3><div className="flex flex-wrap gap-2">{note.references.length ? note.references.map((ref) => { const target = resolveNote(notes, ref); return <Button size="sm" key={ref} disabled={!target} onClick={() => target && onOpen(target)}>{target?.title ?? ref}{!target && " (introuvable)"}</Button>; }) : "Aucun"}</div><h3>Rétroliens ({backlinks.length})</h3><div className="flex flex-wrap gap-2">{backlinks.map((n) => <Button size="sm" key={n.id} onClick={() => onOpen(n)}>{n.title ?? n.content.slice(0, 40)}</Button>)}</div></div>;
}
