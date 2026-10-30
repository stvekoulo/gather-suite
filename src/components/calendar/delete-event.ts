"use client";

import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";

// Suppression d'un événement du calendrier
export function deleteCalendarEvent(id: string) {
  const event = useAppStore.getState().events.find((e) => e.id === id);
  if (!event) return;
  useCalendarStore.getState().closePopover();
  useAppStore.getState().deleteEvent(id);
}
