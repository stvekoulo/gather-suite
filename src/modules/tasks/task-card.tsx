"use client";

import { CalendarPlusIcon, PlayIcon, Trash2Icon, XIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { WheelTimePicker } from "@/components/beui/wheel-time-picker";
import { Checkbox } from "@/components/beui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleIndicator,
  CollapsibleTrigger,
} from "@/components/beui/collapsible";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/beui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Task } from "@/modules/productivity/types";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { scheduleTask } from "./schedule-task";

// Carte de tâche interactive avec contrôles beUI et gestion des sous-tâches
export function TaskCard({ task }: { task: Task }) {
  const router = useRouter();
  const [subtask, setSubtask] = useState("");
  const [scheduleDate, setScheduleDate] = useState(() => task.dueDate || new Date().toISOString().slice(0, 10));
  const [scheduleTime, setScheduleTime] = useState("09:00");
  const [scheduleDuration, setScheduleDuration] = useState("60");

  const patch = (p: Partial<Task>) => {
    const state = useWorkspaceStore.getState();
    state.setTasks(state.tasks.map((t) => (t.id === task.id ? { ...t, ...p } : t)));
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

  return (
    <article
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("application/x-gather-task", task.id);
        e.dataTransfer.setData("application/x-kargul-task", task.id);
      }}
      className="space-y-2.5 rounded-xl border border-hairline bg-surface p-3 text-xs shadow-2xs"
    >
      <Input
        aria-label="Titre de la tâche"
        value={task.title}
        onChange={(e) => patch({ title: e.target.value })}
        className="h-8 font-medium text-fg"
      />
      <Input
        aria-label="Projet de la tâche"
        placeholder="Projet / client"
        value={task.project}
        onChange={(e) => patch({ project: e.target.value })}
        className="h-7 text-xs text-fg-2"
      />

      <div className="grid grid-cols-2 gap-2">
        <Select value={task.priority} onValueChange={(p) => patch({ priority: p as Task["priority"] })}>
          <SelectTrigger className="h-7 text-xs">
            <SelectValue placeholder="Priorité" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Basse</SelectItem>
            <SelectItem value="normal">Normale</SelectItem>
            <SelectItem value="high">Haute</SelectItem>
          </SelectContent>
        </Select>

        <WheelDatePicker
          aria-label="Échéance"
          value={task.dueDate ?? ""}
          onChange={(d) => patch({ dueDate: d })}
          className="h-7 text-xs"
        />
      </div>

      <Select value={task.status} onValueChange={(s) => patch({ status: s as Task["status"] })}>
        <SelectTrigger className="h-7 text-xs">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="todo">À faire</SelectItem>
          <SelectItem value="progress">En cours</SelectItem>
          <SelectItem value="review">En revue</SelectItem>
          <SelectItem value="done">Terminé</SelectItem>
        </SelectContent>
      </Select>

      {/* Sous-tâches avec case à cocher beUI */}
      {task.subtasks.length > 0 && (
        <div className="space-y-1.5 pt-1">
          {task.subtasks.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-lg bg-surface-2/40 px-2 py-1">
              <Checkbox
                checked={s.done}
                onCheckedChange={(c) =>
                  patch({
                    subtasks: task.subtasks.map((item) => (item.id === s.id ? { ...item, done: c } : item)),
                  })
                }
                label={s.title}
                className={s.done ? "line-through opacity-60" : ""}
              />
              <button
                type="button"
                aria-label={`Supprimer ${s.title}`}
                onClick={() => patch({ subtasks: task.subtasks.filter((item) => item.id !== s.id) })}
                className="text-icon hover:text-danger"
              >
                <XIcon className="size-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Ajout de sous-tâche */}
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          if (!subtask.trim()) return;
          patch({
            subtasks: [...task.subtasks, { id: crypto.randomUUID(), title: subtask.trim(), done: false }],
          });
          setSubtask("");
        }}
      >
        <Input
          aria-label="Sous-tâche"
          placeholder="Ajouter une sous-tâche..."
          value={subtask}
          onChange={(e) => setSubtask(e.target.value)}
          className="h-7 text-xs"
        />
        <Button type="submit" size="sm" variant="outline" className="h-7 px-2.5 text-xs">
          +
        </Button>
      </form>

      {/* Planification calendrier beUI Collapsible */}
      <Collapsible className="rounded-lg border border-hairline bg-surface-2/30 p-2">
        <CollapsibleTrigger className="flex w-full items-center justify-between text-[11px] font-medium text-fg-2 hover:text-fg">
          <span className="flex items-center gap-1.5">
            <CalendarPlusIcon className="size-3 text-brand" />
            Planifier dans l&apos;agenda
          </span>
          <CollapsibleIndicator />
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-2">
          <form className="space-y-2" onSubmit={handleSchedule}>
            <WheelDatePicker
              aria-label="Date du créneau"
              value={scheduleDate}
              onChange={setScheduleDate}
              className="w-full h-8 text-xs"
            />
            <div className="grid grid-cols-2 gap-2">
              <WheelTimePicker
                aria-label="Heure du créneau"
                value={scheduleTime}
                onChange={setScheduleTime}
                className="h-8 text-xs"
              />
              <Input
                aria-label="Durée en minutes"
                type="number"
                min="15"
                max="1440"
                value={scheduleDuration}
                onChange={(e) => setScheduleDuration(e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <Button size="sm" variant="brand" type="submit" className="w-full h-8 text-xs">
              Confirmer le créneau
            </Button>
          </form>
        </CollapsibleContent>
      </Collapsible>

      {/* Actions rapides */}
      <div className="flex items-center gap-1.5 pt-1 border-t border-hairline/60">
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            const app = useAppStore.getState();
            if (app.timer.running) {
              toast.info("Un chronomètre est déjà en cours");
              return;
            }
            app.startTimer(task.project, task.title);
            toast.success("Chronomètre démarré");
          }}
          className="h-7 gap-1 px-2 text-[11px]"
        >
          <PlayIcon className="size-3 text-brand" />
          Chronométrer
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            const s = useWorkspaceStore.getState();
            s.setTasks(s.tasks.filter((t) => t.id !== task.id));
          }}
          className="ml-auto h-7 px-2 text-[11px] text-danger hover:bg-danger/10"
        >
          <Trash2Icon className="size-3" />
        </Button>
      </div>
    </article>
  );
}
