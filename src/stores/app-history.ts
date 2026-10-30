"use client";

import { toast } from "sonner";
import { translate } from "@/lib/i18n/ui-text";
import { rangeKeys } from "@/lib/dates";
import { LEAVE_COLORS } from "@/lib/leave";
import type { AppState, CalEvent, LeaveRequest } from "@/lib/types";

export function uid(prefix = "id"): string {
  return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
}

export function eventsForRequest(req: LeaveRequest): CalEvent[] {
  const color = LEAVE_COLORS[req.type];
  const note = req.status === "approved" ? "Approved" : "Pending";
  if (!req.allDay) {
    return [
      {
        id: uid("ev"),
        title: req.type,
        date: req.from,
        start: req.start ?? 540,
        end: req.end ?? 1020,
        allDay: false,
        color,
        note,
        requestId: req.id,
      },
    ];
  }
  return rangeKeys(req.from, req.to).map((date) => ({
    id: uid("ev"),
    title: req.type,
    date,
    start: 0,
    end: 1440,
    allDay: true,
    color,
    requestId: req.id,
  }));
}

// Keep the app working in memory if localStorage hits its quota.
let warnedQuota = false;
export const safeLocalStorage = {
  getItem: (name: string) => localStorage.getItem(name),
  removeItem: (name: string) => localStorage.removeItem(name),
  setItem: (name: string, value: string) => {
    try {
      localStorage.setItem(name, value);
      warnedQuota = false;
    } catch {
      if (warnedQuota) return;
      warnedQuota = true;
      toast.error(translate("Browser storage is full"), {
        description: translate("Your latest changes won't survive a reload. Remove some uploaded documents to free space."),
      });
    }
  },
};

export const TRACKED = [
  "workspaceId",
  "workspaces",
  "events",
  "requests",
  "holidays",
  "profile",
  "settings",
  "documents",
  "timeEntries",
  "invoices",
  "withdrawalMethods",
  "benefits",
  "financeTransactions",
] as const satisfies readonly (keyof AppState)[];

export type TrackedKey = (typeof TRACKED)[number];
export type Snapshot = Pick<AppState, TrackedKey>;
type HistoryEntry = { snapshot: Snapshot; label: string };

const HISTORY_LIMIT = 100;
const past: HistoryEntry[] = [];
let future: HistoryEntry[] = [];
export function clearHistory() { past.length = 0; future = []; }

const KEY_LABELS: Record<TrackedKey, string> = {
  workspaceId: "Workspace",
  workspaces: "Workspace",
  events: "Calendar",
  requests: "Leave request",
  holidays: "Holidays",
  profile: "Profile",
  settings: "Settings",
  documents: "Documents",
  timeEntries: "Time tracking",
  invoices: "Invoices",
  withdrawalMethods: "Payout methods",
  benefits: "Benefits",
  financeTransactions: "Finances",
};

export function snapshotOf(state: AppState): Snapshot {
  const snap = {} as Record<TrackedKey, unknown>;
  for (const key of TRACKED) snap[key] = state[key];
  return snap as Snapshot;
}

export function labelFor(keys: TrackedKey[]): string {
  if (keys.includes("requests")) return KEY_LABELS.requests;
  return [...new Set(keys.map((k) => KEY_LABELS[k]))].join(" & ");
}

export function pushHistory(state: AppState, changed: TrackedKey[]) {
  if (!changed.length) return;
  past.push({ snapshot: snapshotOf(state), label: labelFor(changed) });
  if (past.length > HISTORY_LIMIT) past.shift();
  future = [];
}

export function performUndo(
  getState: () => AppState,
  setState: (snap: Snapshot) => void,
): string | null {
  const entry = past.pop();
  if (!entry) return null;
  future.push({ snapshot: snapshotOf(getState()), label: entry.label });
  setState(entry.snapshot);
  return entry.label;
}

export function performRedo(
  getState: () => AppState,
  setState: (snap: Snapshot) => void,
): string | null {
  const entry = future.pop();
  if (!entry) return null;
  past.push({ snapshot: snapshotOf(getState()), label: entry.label });
  setState(entry.snapshot);
  return entry.label;
}
