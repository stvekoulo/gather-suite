import { toast } from "sonner";
import { scheduleTask } from "./schedule-task";
import { HOUR_HEIGHT } from "@/components/calendar/layout";
export function dropCalendarTask(event: React.DragEvent<HTMLDivElement>, days: string[]) {
  const id = event.dataTransfer.getData("application/x-gather-task") || event.dataTransfer.getData("application/x-kargul-task");
  if (!id) return;
  event.preventDefault();
  const rect = event.currentTarget.getBoundingClientRect();
  const index = Math.min(days.length - 1, Math.max(0, Math.floor((event.clientX - rect.left) / (rect.width / days.length))));
  const start = Math.max(0, Math.min(1380, Math.round(((event.clientY - rect.top) / HOUR_HEIGHT * 60) / 15) * 15));
  try { scheduleTask(id, days[index], start); toast.success("Tâche planifiée"); } catch (error) { toast.error(String(error)); }
}
