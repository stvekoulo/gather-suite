"use client";
import { translate } from "@/lib/i18n/ui-text";
import { FilePicker } from "@/components/file-picker";
import { useState } from "react";
import { beginSpaceOperation } from "@/modules/spaces/operations";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useBlinkoStore } from "@/stores/blinko-store";
import { saveFile } from "@/lib/files";

export function NoteTransferControls() {
  const [busy, setBusy] = useState(false);
  return <div className="flex flex-wrap gap-2"><Button size="sm" disabled={busy} onClick={async () => { const finishOperation = beginSpaceOperation(); setBusy(true); try { const { exportNotesZip } = await import("./note-transfer"); await saveFile("notes-et-pieces-jointes.zip", await exportNotesZip(useBlinkoStore.getState().notes)); } catch (error) { toast.error(String(error)); } finally { setBusy(false); finishOperation(); } }}>{translate("Exporter ZIP + Markdown")}</Button><div className="cursor-pointer rounded border border-hairline px-2 py-1 text-xs">{translate("Importer Notes (ZIP / JSON)")}<FilePicker aria-label={translate("Importer des notes")} type="file" accept=".bko,.zip,.json" disabled={busy} className="sr-only" onChange={async (e) => { const file = e.target.files?.[0]; e.target.value = ""; if (!file) return; const finishOperation = beginSpaceOperation(); setBusy(true); try { const { importNoteArchive } = await import("./note-transfer"); const notes = await importNoteArchive(file); if (!window.confirm(`Importer ${notes.length} notes et leurs pièces jointes ?`)) return; const state = useBlinkoStore.getState(); useBlinkoStore.setState({ notes: [...notes, ...state.notes] }); toast.success(`${notes.length} notes importées`); } catch (error) { toast.error(String(error)); } finally { setBusy(false); finishOperation(); } }} /></div></div>;
}
