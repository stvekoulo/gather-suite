"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toKey } from "@/lib/dates";
import { createTask } from "@/lib/links";
import { isDesktop } from "@/lib/storage/database";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { openOverlay, useOverlayStore } from "@/stores/overlay-store";

type Kind = "note" | "task" | "event";
const KINDS: [Kind, string][] = [["note", "Note"], ["task", "Tâche"], ["event", "Événement"]];

/** One dialog to catch anything, from anywhere: Ctrl+Shift+N, or the system-wide shortcut on desktop. */
export function QuickCapture() {
  const open = useOverlayStore((s) => s.overlay.kind === "capture");
  const close = useOverlayStore((s) => s.close);
  const [kind, setKind] = useState<Kind>("note");
  const [text, setText] = useState("");
  const [date, setDate] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === "n") { e.preventDefault(); openOverlay({ kind: "capture" }); }
    };
    window.addEventListener("keydown", onKey);
    if (!isDesktop()) return () => window.removeEventListener("keydown", onKey);
    let unlisten: (() => void) | undefined, disposed = false;
    void import("@tauri-apps/api/event").then(({ listen }) => listen("quick-capture", () => openOverlay({ kind: "capture" }))).then((fn) => { if (disposed) fn(); else unlisten = fn; });
    return () => { disposed = true; unlisten?.(); window.removeEventListener("keydown", onKey); };
  }, []);

  const save = () => {
    const content = text.trim();
    if (!content) return;
    const title = content.split("\n")[0].slice(0, 120);
    if (kind === "note") useBlinkoStore.getState().createNote({ type: "memo", content });
    else if (kind === "task") createTask(title, { dueDate: date || undefined });
    else useAppStore.getState().saveEvent({ title, date: date || toKey(new Date()), start: 540, end: 600, allDay: !date, color: "blue", note: content === title ? undefined : content });
    toast.success(`${KINDS.find(([k]) => k === kind)![1]} enregistrée`, { description: title });
    setText(""); setDate(""); close();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent className="sm:max-w-md">
        <DialogTitle>{translate("Capture rapide")}</DialogTitle>
        <DialogDescription>{translate("Ctrl+Entrée pour enregistrer.")}</DialogDescription>
        <div role="tablist" className="flex gap-1">
          {KINDS.map(([id, label]) => (
            <Button key={id} role="tab" aria-selected={kind === id} size="sm" variant={kind === id ? "brand" : "secondary"} onClick={() => setKind(id)}>{label}</Button>
          ))}
        </div>
        <Textarea autoFocus aria-label={translate("Contenu à capturer")} rows={4} value={text} onChange={(e) => setText(e.target.value)} placeholder={translate("Qu’avez-vous en tête ?")} onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); save(); } }} />
        {kind !== "note" && <Input aria-label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />}
        <Button variant="brand" disabled={!text.trim()} onClick={save}>{translate("Enregistrer")}</Button>
      </DialogContent>
    </Dialog>
  );
}
