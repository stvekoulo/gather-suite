"use client";
import { translate } from "@/lib/i18n/ui-text";

import { CalendarCheckIcon, CalendarIcon, CalendarPlusIcon, ChevronDownIcon, ListChecksIcon, PlayIcon, StickyNoteIcon, Trash2Icon, XIcon } from "lucide-react";
import { handOff } from "@/lib/handoff";
import { taskNote } from "@/lib/links";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/beui/dropdown";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { WheelTimePicker } from "@/components/beui/wheel-time-picker";
import { Checkbox } from "@/components/beui/checkbox";
import { Collapsible, CollapsibleContent, CollapsibleIndicator, CollapsibleTrigger } from "@/components/beui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatShort, toKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import type { Task } from "@/modules/productivity/types";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { scheduleTask } from "./schedule-task";

const PRIORITY_DOT: Record<Task["priority"], string> = { low: "bg-fg-2/30", normal: "bg-blue-500", high: "bg-red-500" };

// Carte compacte : l'essentiel est toujours visible, le reste s'ouvre à la demande
export function TaskCard({ task, today }: { task: Task; today: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [subtask, setSubtask] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => task.dueDate || toKey(new Date()));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDuration, setScheduleDuration] = useState("60");

  const patch = (p: Partial<Task>) => {
    const state = useWorkspaceStore.getState();
    state.setTasks(state.tasks.map((t) => (t.id === task.id ? { ...t, ...p } : t)));
    if (p.title !== undefined && task.eventId) useAppStore.setState((app) => ({ events: app.events.map((ev) => (ev.id === task.eventId ? { ...ev, title: p.title! } : ev)) }));
  };

  const handleSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    const [h, m] = scheduleTime.split(":").map(Number);
    try {
      const ev = scheduleTask(task.id, scheduleDate, h * 60 + m, Number(scheduleDuration) || 60);
      useCalendarStore.getState().focusEvent(ev.id, ev.date);
      router.push("/time-off");
    } catch (error) {
      toast.error(String(error));
    }
  };

  const doneCount = task.subtasks.filter((s) => s.done).length;
  const late = !!task.dueDate && task.dueDate < today && task.status !== "done";
  const iconButton = "size-7 text-fg-2";

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-gather-task", task.id);
        e.dataTransfer.setData("application/x-kargul-task", task.id);
      }}
      className={cn("group rounded-xl border border-hairline bg-surface p-2.5 shadow-2xs transition-shadow hover-fine:shadow-xs", task.status === "done" && "opacity-70")}
    >
      <div className="flex items-start gap-2">
        <span className={cn("mt-2.5 size-2 shrink-0 rounded-full", PRIORITY_DOT[task.priority])} title={translate("Priorité")} aria-hidden />
        <div className="min-w-0 flex-1">
          <input
            aria-label={translate("Titre de la tâche")}
            value={task.title}
            onChange={(e) => patch({ title: e.target.value })}
            className={cn("t-14 w-full truncate rounded-md bg-transparent px-1 py-1 font-medium text-fg outline-none hover-fine:bg-hover focus:bg-hover", task.status === "done" && "line-through")}
          />
          <input
            aria-label={translate("Projet de la tâche")}
            placeholder={translate("Projet / client")}
            list="known-clients"
            value={task.project}
            onChange={(e) => patch({ project: e.target.value })}
            className="t-12 w-full truncate rounded-md bg-transparent px-1 py-0.5 text-fg-2 outline-none placeholder:text-placeholder hover-fine:bg-hover focus:bg-hover"
          />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-4">
        {task.dueDate && (
          <span className={cn("t-12 inline-flex items-center gap-1 rounded-md bg-app px-1.5 py-0.5 text-fg-2", late && "bg-danger/10 text-danger")}>
            <CalendarIcon className="size-3" /> {formatShort(task.dueDate)}
          </span>
        )}
        {task.subtasks.length > 0 && (
          <span className="t-12 inline-flex items-center gap-1 rounded-md bg-app px-1.5 py-0.5 text-fg-2 tabular-nums"><ListChecksIcon className="size-3" /> {doneCount}/{task.subtasks.length}</span>
        )}
        {task.eventId && <span className="inline-flex rounded-md bg-app p-1 text-fg-2" title={translate("Planifiée")}><CalendarCheckIcon className="size-3" /></span>}
        <button type="button" aria-expanded={open} onClick={() => setOpen(!open)} className="t-12 ml-auto inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-fg-2 hover-fine:bg-hover">
          {translate("Détails")} <ChevronDownIcon className={cn("size-3 transition-transform", open && "rotate-180")} />
        </button>
      </div>

      {open && (
        <div className="mt-2.5 space-y-2.5 border-t border-hairline pt-2.5 text-xs">
          <div className="grid grid-cols-2 gap-2">
            <Dropdown aria-label={translate("Priorité")} triggerClassName="h-8" value={task.priority} onChange={(p) => patch({ priority: p as Task["priority"] })} options={[{ value: "low", label: translate("Basse") }, { value: "normal", label: translate("Normale") }, { value: "high", label: translate("Haute") }]} />
            <Dropdown aria-label={translate("Statut")} triggerClassName="h-8" value={task.status} onChange={(s) => patch({ status: s as Task["status"] })} options={[{ value: "todo", label: translate("À faire") }, { value: "progress", label: translate("En cours") }, { value: "review", label: translate("En revue") }, { value: "done", label: translate("Terminé") }]} />
          </div>
          <WheelDatePicker aria-label={translate("Échéance")} value={task.dueDate ?? ""} onChange={(d) => patch({ dueDate: d })} className="h-8 w-full text-xs" />

          {task.subtasks.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2">
              <Checkbox checked={s.done} onCheckedChange={(c) => patch({ subtasks: task.subtasks.map((item) => (item.id === s.id ? { ...item, done: c } : item)) })} label={s.title} className={s.done ? "line-through opacity-60" : ""} />
              <button type="button" aria-label={`${translate("Supprimer")} ${s.title}`} onClick={() => patch({ subtasks: task.subtasks.filter((item) => item.id !== s.id) })} className="text-icon hover:text-danger"><XIcon className="size-3" /></button>
            </div>
          ))}
          <form className="flex gap-1.5" onSubmit={(e) => {
            e.preventDefault();
            if (!subtask.trim()) return;
            patch({ subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: subtask.trim(), done: false }] });
            setSubtask("");
          }}>
            <Input aria-label={translate("Sous-tâche")} placeholder={translate("Ajouter une sous-tâche...")} value={subtask} onChange={(e) => setSubtask(e.target.value)} className="h-8 text-xs" />
            <Button type="submit" size="sm" variant="outline" className="h-8 px-2.5 text-xs">+</Button>
          </form>

          <Collapsible className="rounded-lg border border-hairline p-2">
            <CollapsibleTrigger className="flex w-full items-center justify-between text-xs font-medium text-fg-2 hover:text-fg">
              <span className="flex items-center gap-1.5"><CalendarPlusIcon className="size-3 text-brand" />{translate("Planifier dans l'agenda")}</span>
              <CollapsibleIndicator />
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <form className="space-y-2" onSubmit={handleSchedule}>
                <WheelDatePicker aria-label={translate("Date du créneau")} value={scheduleDate} onChange={setScheduleDate} className="h-8 w-full text-xs" />
                <div className="grid grid-cols-2 gap-2">
                  <WheelTimePicker aria-label={translate("Heure du créneau")} value={scheduleTime} onChange={setScheduleTime} className="h-8 text-xs" />
                  <Input aria-label={translate("Durée en minutes")} type="number" min="15" max="1440" value={scheduleDuration} onChange={(e) => setScheduleDuration(e.target.value)} className="h-8 text-xs" />
                </div>
                <Button size="sm" variant="brand" type="submit" className="h-8 w-full text-xs">{translate("Confirmer le créneau")}</Button>
              </form>
            </CollapsibleContent>
          </Collapsible>

          <div className="flex items-center gap-1">
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => {
              const app = useAppStore.getState();
              if (app.timer.running) { toast.info(translate("Un chronomètre est déjà en cours")); return; }
              app.startTimer(task.project, task.title);
              toast.success(translate("Chronomètre démarré"));
            }}><PlayIcon className="size-3 text-brand" />{translate("Chronométrer")}</Button>
            <Button size="sm" variant="ghost" className="h-7 gap-1 px-2 text-xs" onClick={() => { handOff("note", taskNote(task)); router.push("/notes"); }}><StickyNoteIcon className="size-3" />{translate("Note")}</Button>
            <Button size="icon" variant="ghost" aria-label={translate("Supprimer")} className={cn(iconButton, "ml-auto hover:text-danger")} onClick={() => {
              const s = useWorkspaceStore.getState();
              s.setTasks(s.tasks.filter((t) => t.id !== task.id));
              if (task.eventId) useAppStore.setState((app) => ({ events: app.events.filter((ev) => ev.id !== task.eventId) }));
            }}><Trash2Icon className="size-3.5" /></Button>
          </div>
        </div>
      )}
    </article>
  );
}
