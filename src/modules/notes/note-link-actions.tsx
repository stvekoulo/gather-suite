"use client";
import { translate } from "@/lib/i18n/ui-text";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { handOff } from "@/lib/handoff";
import { noteToEvent, noteToTask } from "@/lib/links";
import { useAppStore } from "@/stores/app-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import { useCalendarStore } from "@/stores/calendar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function NoteLinkActions({ note }: { note: BlinkoNote }) {
  const router = useRouter();
  const tasks = useWorkspaceStore((s) => s.tasks.filter((t) => t.noteId === note.id).length);
  const firstTask = useWorkspaceStore((s) => s.tasks.find((t) => t.noteId === note.id)?.title);
  const event = useAppStore((s) => s.events.find((e) => e.id === note.linkedEventId));
  const openEvent = (id: string, date: string) => { useCalendarStore.getState().focusEvent(id, date); router.push("/time-off"); };
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      {tasks > 0 && firstTask
        ? <Button size="sm" variant="secondary" onClick={() => { handOff("task", firstTask); router.push("/tasks"); }}>{translate("Voir la tâche liée")}</Button>
        : <Button size="sm" variant="secondary" onClick={() => { noteToTask(note); toast.success(translate("Tâche créée depuis la note")); }}>{translate("Créer une tâche")}</Button>}
      {event
        ? <Button size="sm" variant="secondary" onClick={() => openEvent(event.id, event.date)}>{translate("Voir l’événement lié")}</Button>
        : <Button size="sm" variant="secondary" onClick={() => { const created = noteToEvent(note); openEvent(created.id, created.date); }}>{translate("Planifier au calendrier")}</Button>}
    </div>
  );
}
