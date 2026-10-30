"use client";
import { useEffect } from "react";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useAppStore } from "@/stores/app-store";
import { sendDesktopNotification } from "@/lib/notifications";
import type { BlinkoNote } from "@/stores/blinko-types";
export function dueNotes(notes: BlinkoNote[], now: number) {
  return notes.filter((note) => !note.isRecycle && !note.isArchived && note.remindAt && Number.isFinite(Date.parse(note.remindAt)) && Date.parse(note.remindAt) <= now && note.reminderFiredAt !== note.remindAt);
}
export function NoteReminders() {
  useEffect(() => {
    const check = () => {
      for (const note of dueNotes(useBlinkoStore.getState().notes, Date.now())) {
        useBlinkoStore.getState().updateNote(note.id, { reminderFiredAt: note.remindAt });
        const title = `Rappel : ${note.title ?? "Note"}`, body = note.content.slice(0, 150);
        useAppStore.getState().notify({ title, body, href: "/notes" });
        if (useAppStore.getState().settings.pushNotifications) void sendDesktopNotification({ title, body });
      }
    };
    check(); const interval = setInterval(check, 15_000); window.addEventListener("focus", check);
    return () => { clearInterval(interval); window.removeEventListener("focus", check); };
  }, []);
  return null;
}
export function NoteReminderControl({ note }: { note: BlinkoNote }) {
  const value = note.remindAt ? new Date(Date.parse(note.remindAt) - new Date(note.remindAt).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : "";
  return <label className="block text-sm">Rappel local<input className="ml-2 rounded border border-hairline bg-surface p-2" aria-label="Rappel de la note" type="datetime-local" value={value} onChange={(e) => useBlinkoStore.getState().updateNote(note.id, { remindAt: e.target.value ? new Date(e.target.value).toISOString() : undefined, reminderFiredAt: undefined })} /><small className="block text-fg-2">Déclenché quand Gather et cet espace sont ouverts ; rappel en retard affiché au retour.</small></label>;
}
