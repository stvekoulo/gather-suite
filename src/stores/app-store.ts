"use client";

import { toast } from "sonner";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { formatShort } from "@/lib/dates";
import { translate } from "@/lib/i18n/ui-text";
import { durationLabel, WORKDAY_MINUTES, workingDays } from "@/lib/leave";
import { createSeed, STATE_VERSION } from "@/lib/seed";
import type { AppState, CalEvent, LeaveRequest } from "@/lib/types";
import {
  eventsForRequest,
  performRedo,
  performUndo,
  pushHistory,
  TRACKED,
  uid,
} from "./app-history";
import type { AppStore } from "./app-store-types";
import { createWorkSlice } from "./app-work-slice";
import { workspaceStorage } from "@/lib/storage/workspace-storage";

export { uid };
export type { Actions, AppStore, RequestInput } from "./app-store-types";

const bySubmitted = (a: LeaveRequest, b: LeaveRequest) => b.submittedAt.localeCompare(a.submittedAt);
const whenLabel = (from: string, to: string) =>
  from === to ? formatShort(from) : `${formatShort(from)} – ${formatShort(to)}`;

// Reverts or re-applies the last recorded user change.
export const undo = () => performUndo(useAppStore.getState, useAppStore.setState);
export const redo = () => performRedo(useAppStore.getState, useAppStore.setState);

export const useAppStore = create<AppStore>()(
  persist(
    (rawSet, get) => {
      const set = ((partial: unknown, replace?: boolean) => {
        const state = get();
        const next = (typeof partial === "function" ? partial(state) : partial) as Partial<AppState> | null;
        const changed = TRACKED.filter((k) => next && k in next && next[k] !== state[k]);
        pushHistory(state, changed);
        (rawSet as (p: unknown, r?: boolean) => void)(next, replace);
      }) as typeof rawSet;

      return {
        ...createSeed(),

        switchWorkspace: (id) => { void import("@/modules/spaces/spaces").then((m) => m.switchSpace(id)).catch((error: unknown) => toast.error(String(error))); },
        addWorkspace: (name) => {
          void import("@/modules/spaces/spaces").then((m) => m.createSpace(name)).catch((error: unknown) => toast.error(String(error)));
        },

        saveEvent: (event) => {
          const saved: CalEvent = { ...event, id: event.id ?? uid("ev") };
          set((s) => ({
            events: s.events.some((e) => e.id === saved.id)
              ? s.events.map((e) => (e.id === saved.id ? saved : e))
              : [...s.events, saved],
          }));
          return saved;
        },
        moveEvent: (id, patch) => set((s) => ({ events: s.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) })),
        deleteEvent: (id) => {
          const removed = get().events.find((e) => e.id === id);
          if (!removed) return;
          const lang = get().settings?.language || "fr";
          set((s) => ({ events: s.events.filter((e) => e.id !== id) }));
          toast(translate("Événement supprimé", lang), {
            description: removed.title,
            action: { label: translate("Undo", lang), onClick: () => set((s) => ({ events: [...s.events, removed] })) },
          });
        },
        duplicateEvent: (id) => {
          const ev = get().events.find((e) => e.id === id);
          if (!ev) return;
          const lang = get().settings?.language || "fr";
          const copy = { ...ev, id: uid("ev"), title: `${ev.title} (copy)`, requestId: undefined };
          set((s) => ({ events: [...s.events, copy] }));
          toast.success(translate("Événement dupliqué", lang), { description: copy.title });
        },

        measureRequest: (input) => {
          if (!input.allDay) {
            const minutes = Math.max(0, input.end - input.start);
            const hours = Math.round((minutes / 60) * 10) / 10;
            return { days: minutes / WORKDAY_MINUTES, label: durationLabel(0, hours) };
          }
          const n = workingDays(input.from, input.to, get().holidays).length;
          return { days: n, label: durationLabel(n, 0) };
        },
        submitRequest: (input, existingId) => {
          const m = get().measureRequest(input);
          const req: LeaveRequest = {
            id: existingId ?? uid("rq"),
            status: "pending",
            type: input.type,
            duration: m.label,
            days: m.days,
            from: input.from,
            to: input.allDay ? input.to : input.from,
            allDay: input.allDay,
            start: input.allDay ? undefined : input.start,
            end: input.allDay ? undefined : input.end,
            notes: input.notes.trim() || input.type,
            submittedAt: new Date().toISOString(),
          };
          set((s) => ({
            requests: existingId ? s.requests.map((r) => (r.id === existingId ? req : r)) : [req, ...s.requests],
            events: [...s.events.filter((e) => e.requestId !== req.id), ...eventsForRequest(req)],
          }));
          const when = whenLabel(req.from, req.to);
          const lang = get().settings?.language || "fr";
          toast.success(translate(existingId ? "Request updated" : "Request submitted", lang), {
            description: `${req.type} · ${when}`,
          });
          get().notify({
            title: `${req.type} request submitted`,
            body: `${when} · ${req.duration}. Your manager has been notified.`,
            href: "/time-off",
          });
          return req;
        },
        setRequestStatus: (id, status) => {
          const req = get().requests.find((r) => r.id === id);
          if (!req) return;
          set((s) => {
            const keep = status === "approved" || status === "pending";
            const note = status === "approved" ? "Approved" : "Pending";
            return {
              requests: s.requests.map((r) => (r.id === id ? { ...r, status } : r)),
              events: keep
                ? [...s.events.filter((e) => e.requestId !== id), ...eventsForRequest({ ...req, status }).map((e) => ({ ...e, note }))]
                : s.events.filter((e) => e.requestId !== id),
            };
          });
          const verb = { approved: "approved", declined: "declined", cancelled: "cancelled", pending: "reopened" }[status];
          const message = `Request ${verb}`;
          const description = `${req.type} · ${formatShort(req.from)}`;
          if (status === "approved") toast.success(message, { description });
          else if (status === "declined") toast.error(message, { description });
          else toast(message, { description });
          if (status === "approved" || status === "declined") {
            get().notify({
              title: `${req.type} ${verb}`,
              body: `Your request for ${whenLabel(req.from, req.to)} was ${verb}.`,
              href: "/time-off",
            });
          }
        },
        deleteRequest: (id) => {
          const s0 = get();
          const req = s0.requests.find((r) => r.id === id);
          if (!req) return;
          const lang = s0.settings?.language || "fr";
          const events = s0.events.filter((e) => e.requestId === id);
          set((s) => ({
            requests: s.requests.filter((r) => r.id !== id),
            events: s.events.filter((e) => e.requestId !== id),
          }));
          toast(translate("Demande supprimée", lang), {
            description: req.notes,
            action: {
              label: translate("Undo", lang),
              onClick: () =>
                set((s) => ({ requests: [...s.requests, req].sort(bySubmitted), events: [...s.events, ...events] })),
            },
          });
        },
        addHoliday: (date, name) => {
          const lang = get().settings?.language || "fr";
          set((s) => ({
            holidays: [...s.holidays, { id: uid("ho"), date, name }].sort((a, b) => a.date.localeCompare(b.date)),
          }));
          toast.success(translate("Jour férié ajouté", lang), { description: `${name} · ${formatShort(date)}` });
        },
        removeHoliday: (id) => set((s) => ({ holidays: s.holidays.filter((h) => h.id !== id) })),

        notify: (n) =>
          set((s) => ({
            notifications: [{ ...n, id: uid("no"), createdAt: new Date().toISOString(), read: false }, ...s.notifications],
          })),
        markNotificationRead: (id) =>
          set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
        markAllNotificationsRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
        clearNotifications: () => set({ notifications: [] }),

        updateProfile: (patch) => set((s) => ({ profile: { ...s.profile, ...patch } })),
        updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),

        ...createWorkSlice(set, get),

        resetDemoData: () => {
          const { workspaceId, workspaces } = get();
          set({ ...createSeed(), workspaceId, workspaces });
          const lang = get().settings?.language || "fr";
          toast.success(translate("Données de démo restaurées", lang));
        },
      };
    },
    {
      name: "calendar-app:state",
      version: STATE_VERSION,
      storage: createJSONStorage(() => workspaceStorage),
      skipHydration: true,
      migrate: (persisted, version) => {
        const s = persisted as AppState;
        if (version < 3) {
          s.workspaces = s.workspaces.map((w) =>
            w.id === "ws-main" && (w.name === "Workspace" || w.name === "Kargul") ? { ...w, name: "Gather Workspace" } : w,
          );
        }
        return { ...s, version: STATE_VERSION };
      },
      partialize: (s) => {
        const data: Partial<AppStore> = {};
        for (const [k, v] of Object.entries(s)) if (typeof v !== "function") (data as Record<string, unknown>)[k] = v;
        return data as AppState;
      },
    },
  ),
);

export const selectWorkspaceName = (s: AppStore) =>
  s.workspaces.find((w) => w.id === s.workspaceId)?.name ?? "Gather Workspace";
