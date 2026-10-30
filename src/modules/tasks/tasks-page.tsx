"use client";
import { useState } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";
import type { TaskStatus } from "@/modules/productivity/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { TaskCard } from "./task-card";
const columns: [TaskStatus, string][] = [["todo", "À faire"], ["progress", "En cours"], ["review", "En revue"], ["done", "Terminé"]];
export function TasksPage() {
  const tasks = useWorkspaceStore((s) => s.tasks);
  const setTasks = useWorkspaceStore((s) => s.setTasks);
  const [query, setQuery] = useState("");
  return <PageRoot><PageHeader title="Tâches & Kanban" description="Projets, sous-tâches et planification dans le calendrier" actions={<Button onClick={() => setTasks([{ id: crypto.randomUUID(), title: "Nouvelle tâche", project: "", priority: "normal", status: "todo", subtasks: [] }, ...tasks])}>Nouvelle tâche</Button>} /><div className="p-4"><Input aria-label="Rechercher les tâches" placeholder="Rechercher un titre ou un projet" value={query} onChange={(e) => setQuery(e.target.value)} /></div><div className="grid min-h-0 flex-1 grid-cols-4 gap-4 overflow-auto p-4">{columns.map(([status, title]) => <section key={status} aria-label={title} className="min-w-60 space-y-3 rounded-xl bg-surface-2 p-3" onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-gather-task") || e.dataTransfer.types.includes("application/x-kargul-task")) e.preventDefault(); }} onDrop={(e) => { const id = e.dataTransfer.getData("application/x-gather-task") || e.dataTransfer.getData("application/x-kargul-task"); if (id) setTasks(tasks.map((t) => t.id === id ? { ...t, status } : t)); }}><h2 className="font-semibold">{title} ({tasks.filter((t) => t.status === status).length})</h2>{tasks.filter((t) => t.status === status && `${t.title} ${t.project}`.toLowerCase().includes(query.toLowerCase())).map((task) => <TaskCard key={task.id} task={task} />)}</section>)}</div></PageRoot>;
}
