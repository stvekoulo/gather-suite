import { useAppStore } from "@/stores/app-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

export function scheduleTask(id: string, date: string, start: number, duration = 60) {
  const workspace = useWorkspaceStore.getState();
  const task = workspace.tasks.find((t) => t.id === id);
  if (!task) throw new Error("Tâche introuvable.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(start) || !Number.isFinite(duration) || duration <= 0 || start < 0 || start + duration > 1440) throw new Error("Créneau invalide.");
  const app = useAppStore.getState();
  const event = app.saveEvent({ id: app.events.some((e) => e.id === task.eventId) ? task.eventId : undefined, title: task.title, date, start, end: start + duration, allDay: false, color: "blue", note: task.project });
  workspace.setTasks(workspace.tasks.map((t) => t.id === id ? { ...t, eventId: event.id } : t));
  return event;
}
