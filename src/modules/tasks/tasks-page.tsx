"use client";
import { PlusIcon, SearchIcon } from "lucide-react";
import { useState } from "react";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToday } from "@/hooks/use-today";
import { useHandoff } from "@/lib/handoff";
import { translate } from "@/lib/i18n/ui-text";
import { createTask } from "@/lib/links";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/modules/productivity/types";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { TaskCard } from "./task-card";

const COLUMNS: { status: TaskStatus; title: string; dot: string }[] = [
  { status: "todo", title: "À faire", dot: "bg-fg-2/40" },
  { status: "progress", title: "En cours", dot: "bg-blue-500" },
  { status: "review", title: "En revue", dot: "bg-amber-500" },
  { status: "done", title: "Terminé", dot: "bg-emerald-500" },
];
const TASK_TYPES = ["application/x-gather-task", "application/x-kargul-task"];

export function TasksPage() {
  const today = useToday();
  const tasks = useWorkspaceStore((s) => s.tasks);
  const setTasks = useWorkspaceStore((s) => s.setTasks);
  const [query, setQuery] = useState("");
  const [dropTarget, setDropTarget] = useState<TaskStatus | null>(null);
  useHandoff("task", setQuery);

  const q = query.trim().toLowerCase();
  const visible = tasks.filter((t) => `${t.title} ${t.project}`.toLowerCase().includes(q));
  const done = tasks.filter((t) => t.status === "done").length;
  const late = tasks.filter((t) => t.dueDate && t.dueDate < today && t.status !== "done").length;

  return (
    <PageRoot>
      <PageHeader
        title={translate("Tâches & Kanban")}
        description={tasks.length ? `${done}/${tasks.length} ${translate("terminées")}${late ? ` · ${late} ${translate("en retard")}` : ""}` : translate("Projets, sous-tâches et planification dans le calendrier")}
        actions={<Button variant="brand" onClick={() => createTask(translate("Nouvelle tâche"))}><PlusIcon />{translate("Nouvelle tâche")}</Button>}
      />
      <div className="relative mx-4 mt-3 max-w-md">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-icon" />
        <Input aria-label={translate("Rechercher les tâches")} placeholder={translate("Rechercher un titre ou un projet")} className="pl-8" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>
      {/* Swipe between columns on small windows; all four side by side when they fit. */}
      <div className="flex min-h-0 flex-1 snap-x snap-mandatory items-start gap-3 overflow-x-auto scroll-thin p-4 xl:grid xl:grid-cols-4 xl:overflow-x-visible">
        {COLUMNS.map(({ status, title, dot }) => {
          const list = visible.filter((t) => t.status === status);
          return (
            <section
              key={status}
              aria-label={translate(title)}
              className={cn(
                "flex w-[85%] max-w-[340px] shrink-0 snap-center flex-col gap-2 rounded-2xl border border-transparent bg-surface-2/60 p-2 transition-colors sm:w-[300px] xl:w-auto xl:max-w-none",
                dropTarget === status && "border-brand/50 bg-brand-tint",
              )}
              onDragOver={(e) => { if (TASK_TYPES.some((type) => e.dataTransfer.types.includes(type))) { e.preventDefault(); setDropTarget(status); } }}
              onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropTarget(null); }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const id = TASK_TYPES.map((type) => e.dataTransfer.getData(type)).find(Boolean);
                if (id) setTasks(tasks.map((t) => (t.id === id ? { ...t, status } : t)));
              }}
            >
              <div className="flex items-center gap-2 px-1.5 pt-1">
                <span className={cn("size-2 rounded-full", dot)} aria-hidden />
                <h2 className="t-14 font-medium text-fg">{translate(title)}</h2>
                <span className="t-12 rounded-full bg-surface px-1.5 text-fg-2 tabular-nums">{list.length}</span>
                <Button size="icon" variant="ghost" className="ml-auto size-7" aria-label={`${translate("Ajouter une tâche")} : ${translate(title)}`} onClick={() => createTask(translate("Nouvelle tâche"), { status })}>
                  <PlusIcon className="size-3.5" />
                </Button>
              </div>
              {list.map((task) => <TaskCard key={task.id} task={task} today={today} />)}
              {!list.length && <p className="t-12 rounded-xl border border-dashed border-hairline px-3 py-6 text-center text-fg-2">{translate(q ? "Aucun résultat." : "Glissez une tâche ici")}</p>}
            </section>
          );
        })}
      </div>
    </PageRoot>
  );
}
