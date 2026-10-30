"use client";
import { useWorkspaceStore } from "@/stores/workspace-store";
export function CalendarTaskTray() {
  const tasks = useWorkspaceStore((s) => s.tasks);
  if (!tasks.some((t) => t.status !== "done")) return null;
  return <details className="shrink-0 border-b border-hairline px-3 py-2 text-xs"><summary className="cursor-pointer">Tâches à planifier — glissez une tâche sur le calendrier</summary><div className="mt-2 flex gap-2 overflow-auto pb-1">{tasks.filter((t) => t.status !== "done").map((t) => <div key={t.id} draggable onDragStart={(e) => { e.dataTransfer.setData("application/x-gather-task", t.id); e.dataTransfer.setData("application/x-kargul-task", t.id); e.dataTransfer.effectAllowed = "copy"; }} className="cursor-grab whitespace-nowrap rounded border border-hairline bg-surface-2 p-2">{t.title}</div>)}</div></details>;
}
