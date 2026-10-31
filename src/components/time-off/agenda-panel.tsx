"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useMemo, useState } from "react";
import {
  CalendarDaysIcon,
  CalendarIcon,
  CheckCircle2Icon,
  ClockIcon,
  CreditCardIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { useWorkspaceStore } from "@/stores/workspace-store";
import { useToday } from "@/hooks/use-today";
import { toast } from "sonner";

interface AgendaPanelProps {
  onAddEvent: () => void;
}

// Panneau latéral d'agenda personnel et échéances interconnectées Gather
export function AgendaPanel({ onAddEvent }: AgendaPanelProps) {
  const today = useToday();
  const selectedDate = useCalendarStore((s) => s.date);
  const events = useAppStore((s) => s.events);
  const deleteEvent = useAppStore((s) => s.deleteEvent);
  const tasks = useWorkspaceStore((s) => s.tasks);

  const [panelTab, setPanelTab] = useState<"day" | "deadlines">("day");

  // Événements pour le jour sélectionné ou aujourd'hui
  const dayEvents = useMemo(() => {
    return events
      .filter((e) => e.date === selectedDate || e.date === today)
      .sort((a, b) => a.start - b.start);
  }, [events, selectedDate, today]);

  // Échéances financières et abonnements synchronisés
  const upcomingDeadlines = useMemo(() => {
    return events
      .filter((e) => e.requestId?.startsWith("fin-") || e.requestId?.startsWith("inv-") || e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 15);
  }, [events, today]);

  // Tâches actives interconnectées
  const pendingTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== "done").slice(0, 5);
  }, [tasks]);

  // Total d'heures prévues cette semaine
  const weeklyHours = useMemo(() => {
    const totalMinutes = events.reduce((sum, e) => sum + (e.end - e.start), 0);
    return Math.round((totalMinutes / 60) * 10) / 10;
  }, [events]);

  const formatTime = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  };

  return (
    <aside className="flex h-full w-full shrink-0 flex-col border-t border-hairline bg-surface xl:w-88 xl:border-t-0 xl:border-l overflow-hidden">
      {/* En-tête et onglets du panneau */}
      <div className="flex items-center justify-between border-b border-hairline p-3 shrink-0">
        <div className="flex items-center rounded-xl border border-hairline bg-surface-2/40 p-1">
          <button
            type="button"
            onClick={() => setPanelTab("day")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              panelTab === "day" ? "bg-surface text-fg shadow-xs" : "text-fg-2 hover:text-fg"
            }`}
          >
            {translate("Agenda du jour")}
          </button>
          <button
            type="button"
            onClick={() => setPanelTab("deadlines")}
            className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
              panelTab === "deadlines" ? "bg-surface text-fg shadow-xs" : "text-fg-2 hover:text-fg"
            }`}
          >
            {translate("Échéances (")}{upcomingDeadlines.length})
          </button>
        </div>

        <Button variant="brand" size="sm" onClick={onAddEvent} className="h-7 gap-1 text-xs px-2.5 font-semibold">
          <PlusIcon className="size-3.5 stroke-[2.5]" /> {translate("Événement")}
        </Button>
      </div>

      {/* Contenu défilant */}
      <div className="flex-1 overflow-y-auto scroll-thin p-4 flex flex-col gap-4 min-h-0">
        {/* Indicateurs clés */}
        <div className="grid grid-cols-2 gap-2 shrink-0">
          <div className="flex flex-col rounded-xl border border-hairline bg-surface-2/30 p-2.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-fg-2">
              <ClockIcon className="size-3 text-brand" /> {translate("Heures prévues")}
            </span>
            <span className="mt-1 font-mono text-lg font-bold text-fg">{weeklyHours} h</span>
            <span className="text-[10px] text-fg-2">{translate("cette semaine")}</span>
          </div>

          <div className="flex flex-col rounded-xl border border-hairline bg-surface-2/30 p-2.5">
            <span className="flex items-center gap-1 text-[11px] font-medium text-fg-2">
              <CalendarIcon className="size-3 text-emerald-600" /> {translate("Rendez-vous")}
            </span>
            <span className="mt-1 font-mono text-lg font-bold text-fg">{dayEvents.length}</span>
            <span className="text-[10px] text-fg-2">{translate("aujourd'hui")}</span>
          </div>
        </div>

        {panelTab === "day" ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-2">
                {translate("Événements (")}{dayEvents.length})
              </h4>
              <span className="text-[11px] text-fg-2 font-mono">{selectedDate}</span>
            </div>

            {dayEvents.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline p-6 text-center text-xs text-fg-2">
                <CalendarDaysIcon className="size-8 text-fg-3 stroke-1 mb-2" />
                <p className="font-medium text-fg">{translate("Aucun rendez-vous prévu")}</p>
                <p className="mt-1 text-[11px]">{translate("Cliquez sur « + Événement » pour planifier un créneau.")}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {dayEvents.map((e) => (
                  <div
                    key={e.id}
                    className="group flex items-center justify-between rounded-xl border border-hairline bg-surface p-2.5 shadow-2xs hover:border-brand/40 transition-colors"
                    style={{ borderLeft: `4px solid var(--event-${e.color}-fg)` }}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-fg truncate">{e.title}</p>
                      <p className="text-[11px] text-fg-2 mt-0.5 font-mono">
                        {e.allDay ? "Journée entière" : `${formatTime(e.start)} – ${formatTime(e.end)}`}
                      </p>
                      {e.note && <p className="text-[10px] text-fg-2 truncate mt-0.5">{e.note}</p>}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        deleteEvent(e.id);
                        toast.success(translate("Événement supprimé"));
                      }}
                      className="size-7 p-0 text-red-600 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      title={translate("Supprimer")}
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          /* Onglet Échéances interconnectées (Finances, Factures, Abonnements) */
          <div className="flex flex-col gap-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fg-2">
              {translate("Abonnements & Factures synchronisés")}
            </h4>

            {upcomingDeadlines.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-hairline p-6 text-center text-xs text-fg-2">
                <CreditCardIcon className="size-8 text-fg-3 stroke-1 mb-2" />
                <p className="font-medium text-fg">{translate("Aucune échéance enregistrée")}</p>
                <p className="mt-1 text-[11px]">
                  {translate("Ajoutez un abonnement ou une facture dans le module Finances pour le synchroniser ici.")}
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {upcomingDeadlines.map((e) => (
                  <div
                    key={e.id}
                    className="flex items-start justify-between rounded-xl border border-hairline bg-surface-2/20 p-2.5 shadow-2xs hover:bg-surface-2/40 transition-colors"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {e.requestId?.startsWith("fin-") ? (
                          <CreditCardIcon className="size-3.5 text-orange-600 shrink-0" />
                        ) : (
                          <FileTextIcon className="size-3.5 text-purple-600 shrink-0" />
                        )}
                        <span className="text-xs font-semibold text-fg truncate">{e.title}</span>
                      </div>
                      <p className="text-[10px] text-fg-2 font-mono mt-1">{translate("Date prévue :")} {e.date}</p>
                      {e.note && <p className="text-[10px] text-fg-2 truncate mt-0.5">{e.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Tâches Kanban planifiées */}
            {pendingTasks.length > 0 && (
              <div className="mt-3 flex flex-col gap-2 border-t border-hairline pt-3">
                <h5 className="text-[11px] font-semibold text-fg-2 uppercase tracking-wider">
                  {translate("Tâches Kanban à planifier")}
                </h5>
                {pendingTasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 rounded-lg bg-surface border border-hairline p-2 text-xs">
                    <CheckCircle2Icon className="size-3.5 text-brand shrink-0" />
                    <span className="truncate flex-1 font-medium text-fg">{t.title}</span>
                    {t.priority && (
                      <span className="text-[10px] rounded bg-surface-2 px-1 py-0.2 text-fg-2 uppercase">
                        {t.priority}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  );
}
