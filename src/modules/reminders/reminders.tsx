"use client";
import { useEffect } from "react";
import { toKey } from "@/lib/dates";
import { sendDesktopNotification } from "@/lib/notifications";
import { exportSpaces } from "@/modules/spaces/spaces";
import { dueNotes } from "@/modules/notes/note-reminders";
import { useAppStore } from "@/stores/app-store";
import { useBlinkoStore } from "@/stores/blinko-store";
import type { BlinkoNote } from "@/stores/blinko-types";
import type { CalEvent, Invoice } from "@/lib/types";
import type { Task } from "@/modules/productivity/types";

export type Reminder = { key: string; title: string; body: string; href: string };
type SpaceRows = { events?: CalEvent[]; tasks?: Task[]; invoices?: Invoice[]; notes?: BlinkoNote[] };

const EVENT_LEAD_MINUTES = 15;
const STORAGE_KEY = "gather:fired-reminders";
const MAX_REMEMBERED = 2000;

/** What is due now in one space. Keys embed the date, so moving an item re-arms its reminder. */
export function dueReminders({ events = [], tasks = [], invoices = [], notes = [] }: SpaceRows, now: Date): Reminder[] {
  const today = toKey(now), minutes = now.getHours() * 60 + now.getMinutes();
  const list: Reminder[] = [];
  for (const e of events) {
    if (e.allDay || e.date !== today || e.requestId?.startsWith("fin-") || e.requestId?.startsWith("inv-")) continue;
    if (minutes >= e.start - EVENT_LEAD_MINUTES && minutes < e.end) list.push({ key: `event:${e.id}:${e.date}:${e.start}`, title: `Bientôt : ${e.title}`, body: `Aujourd’hui à ${String(Math.floor(e.start / 60)).padStart(2, "0")}:${String(e.start % 60).padStart(2, "0")}`, href: "/time-off" });
  }
  for (const t of tasks) if (t.dueDate && t.dueDate <= today && t.status !== "done") list.push({ key: `task:${t.id}:${t.dueDate}`, title: `Tâche à faire : ${t.title}`, body: t.dueDate === today ? "Échéance aujourd’hui" : `Échéance dépassée (${t.dueDate})`, href: "/tasks" });
  for (const i of invoices) if (i.status === "sent" && i.dueDate && i.dueDate < today) list.push({ key: `invoice:${i.id}:${i.dueDate}`, title: `Facture en retard : ${i.number}`, body: `${i.client}, échue le ${i.dueDate}`, href: "/invoice" });
  for (const n of dueNotes(notes, now.getTime())) list.push({ key: `note:${n.id}:${n.remindAt}`, title: `Rappel : ${n.title ?? "Note"}`, body: n.content.slice(0, 150), href: "/notes" });
  return list;
}

function fired(): string[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as string[]; } catch { return []; }
}

/** Checks every space, so a reminder also arrives while another space is open. */
export function Reminders() {
  useEffect(() => {
    const check = () => {
      const seen = fired();
      const app = useAppStore.getState();
      const now = new Date();
      const catalog = exportSpaces();
      const spaces = catalog ? catalog.workspaces.map((w) => ({ name: w.name, id: w.id, data: catalog.spaces[w.id] })) : [];
      let added = false;
      for (const space of spaces) {
        const rows = { ...space.data?.app, ...space.data?.workspace, ...space.data?.blinko } as SpaceRows;
        const active = space.id === catalog?.activeId;
        for (const reminder of dueReminders(rows, now)) {
          if (seen.includes(reminder.key)) continue;
          seen.push(reminder.key); added = true;
          const title = active ? reminder.title : `[${space.name}] ${reminder.title}`;
          if (reminder.key.startsWith("note:") && active) useBlinkoStore.getState().updateNote(reminder.key.split(":")[1], { reminderFiredAt: reminder.key.split(":").slice(2).join(":") });
          app.notify({ title, body: reminder.body, href: active ? reminder.href : undefined });
          if (app.settings.pushNotifications) void sendDesktopNotification({ title, body: reminder.body });
        }
      }
      if (added) try { localStorage.setItem(STORAGE_KEY, JSON.stringify(seen.slice(-MAX_REMEMBERED))); } catch { /* reminders may repeat */ }
    };
    check();
    const interval = setInterval(check, 30_000);
    window.addEventListener("focus", check);
    return () => { clearInterval(interval); window.removeEventListener("focus", check); };
  }, []);
  return null;
}
