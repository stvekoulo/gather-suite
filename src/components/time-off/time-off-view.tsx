"use client";

import { useState } from "react";
import { Calendar } from "@/components/calendar/calendar";
import { useCalendarStore } from "@/stores/calendar-store";
import { AgendaPanel } from "./agenda-panel";
import { AddEventDialog } from "./add-event-dialog";

// Vue Calendrier & Agenda Gather hautement responsive et interconnectée
export function TimeOffView() {
  const [addEventOpen, setAddEventOpen] = useState(false);

  return (
    <div
      data-page-scroll
      onScroll={() => useCalendarStore.getState().popover && useCalendarStore.getState().closePopover()}
      className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden bg-surface"
    >
      {/* Grille responsive : Calendrier principal à gauche, Agenda & Échéances à droite */}
      <div className="flex h-full min-h-0 w-full flex-1 flex-col xl:flex-row overflow-hidden">
        {/* Calendrier interactif plein écran */}
        <div className="flex min-h-[460px] min-w-0 flex-1 flex-col overflow-hidden md:min-h-[540px] xl:h-full">
          <Calendar />
        </div>

        {/* Panneau latéral Agenda & Échéances */}
        <AgendaPanel onAddEvent={() => setAddEventOpen(true)} />
      </div>

      {/* Boîte de dialogue d'ajout d'événement */}
      <AddEventDialog open={addEventOpen} onClose={() => setAddEventOpen(false)} />
    </div>
  );
}
