"use client";
import { translate } from "@/lib/i18n/ui-text";
import Link from "next/link";
import { BellIcon, CalendarCheckIcon, FileTextIcon, ListTodoIcon, ReceiptIcon, StickyNoteIcon, TimerIcon } from "lucide-react";
import { Card, CardHeader } from "@/components/pages/shared/page-chrome";
import { handOff } from "@/lib/handoff";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import { useWorkspaceStore } from "@/stores/workspace-store";

type Row = { key: string; icon: React.ReactNode; label: string; hint?: string; href: string; onClick?: () => void; urgent?: boolean };

// Point d'entrée quotidien : ce qui demande de l'attention dans tous les modules
export function TodayCard() {
  const today = useToday();
  const tasks = useWorkspaceStore((s) => s.tasks);
  const invoices = useAppStore((s) => s.invoices);
  const documents = useAppStore((s) => s.documents);
  const timer = useAppStore((s) => s.timer);
  const notes = useBlinkoStore((s) => s.notes);

  const rows: Row[] = [];
  if (timer.running) rows.push({ key: "timer", icon: <TimerIcon />, label: `Chronomètre en cours : ${timer.task || timer.project || "sans titre"}`, href: "/time-tracking" });
  for (const t of tasks.filter((x) => x.dueDate && x.dueDate <= today && x.status !== "done")) {
    rows.push({ key: `t${t.id}`, icon: <ListTodoIcon />, label: t.title, hint: t.dueDate === today ? "Aujourd’hui" : `En retard · ${t.dueDate}`, href: "/tasks", onClick: () => handOff("task", t.title), urgent: t.dueDate !== today });
  }
  for (const i of invoices.filter((x) => x.status === "sent" && x.dueDate && x.dueDate < today)) {
    rows.push({ key: `i${i.id}`, icon: <ReceiptIcon />, label: `${i.number} · ${i.client}`, hint: "Facture en retard", href: `/invoice?open=${i.id}`, urgent: true });
  }
  for (const n of notes.filter((x) => !x.isRecycle && !x.isArchived && x.remindAt?.slice(0, 10) === today)) {
    rows.push({ key: `n${n.id}`, icon: <BellIcon />, label: n.title || n.content.slice(0, 60), hint: "Rappel du jour", href: "/notes", onClick: () => handOff("note", n.id) });
  }
  const recent: Row[] = [
    ...notes.filter((n) => !n.isRecycle).map((n) => ({ when: n.updatedAt, row: { key: `rn${n.id}`, icon: <StickyNoteIcon />, label: n.title || n.content.slice(0, 60), href: "/notes", onClick: () => handOff("note", n.id) } })),
    ...documents.map((d) => ({ when: d.uploadedAt, row: { key: `rd${d.id}`, icon: <FileTextIcon />, label: d.name, href: "/documents", onClick: () => handOff("document", d.id) } })),
  ].sort((a, b) => b.when.localeCompare(a.when)).slice(0, 4).map((x) => x.row);

  const list = (items: Row[]) => (
    <ul className="grid">
      {items.map((r) => (
        <li key={r.key}>
          <Link href={r.href} onClick={r.onClick} className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 hover-fine:bg-hover [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-fg-2">
            {r.icon}
            <span className="t-14 min-w-0 flex-1 truncate">{r.label}</span>
            {r.hint && <span className={`t-12 shrink-0 ${r.urgent ? "text-danger" : "text-fg-2"}`}>{r.hint}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <Card>
      <CardHeader title={translate("Aujourd’hui")} description={translate("Ce qui demande votre attention, tous modules confondus")} />
      <div className="grid gap-2 p-1.5">
        {rows.length ? list(rows) : <p className="t-14 flex items-center gap-2 px-2.5 py-2 text-fg-2"><CalendarCheckIcon className="size-4" /> {translate("Rien d’urgent aujourd’hui.")}</p>}
        {recent.length > 0 && <><p className="t-12 px-2.5 pt-1 text-fg-2">{translate("Récemment")}</p>{list(recent)}</>}
      </div>
    </Card>
  );
}
