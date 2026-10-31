"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
export function dueNotes(notes: BlinkoNote[], now: number) {
  return notes.filter((note) => !note.isRecycle && !note.isArchived && note.remindAt && Number.isFinite(Date.parse(note.remindAt)) && Date.parse(note.remindAt) <= now && note.reminderFiredAt !== note.remindAt);
}
export function NoteReminderControl({ note }: { note: BlinkoNote }) {
  const value = note.remindAt ? new Date(Date.parse(note.remindAt) - new Date(note.remindAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  return <label className="block text-sm">{translate("Rappel local")}<input className="ml-2 rounded border border-hairline bg-surface p-2" aria-label={translate("Rappel de la note")} type="datetime-local" value={value} onChange={(e) => useBlinkoStore.getState().updateNote(note.id, { remindAt: e.target.value ? new Date(e.target.value).toISOString() : undefined, reminderFiredAt: undefined })} /><small className="block text-fg-2">{translate("Déclenché quand Gather et cet espace sont ouverts ; rappel en retard affiché au retour.")}</small></label>;
}
