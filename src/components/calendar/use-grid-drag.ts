"use client";

import { useEffect, useRef, useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { openOverlay } from "@/stores/overlay-store";
import { clamp, MIN_EVENT_MINUTES, pxToMinutes, snap, SNAP_MINUTES } from "./layout";

const DRAG_THRESHOLD = 4;
const LONG_PRESS_MS = 350;
const SWIPE_DISTANCE = 64;

export type Drag =
  | { type: "create"; dayIndex: number; anchor: number; current: number; moved: boolean }
  | {
      type: "move" | "resize";
      eventId: string;
      dayIndex: number;
      start: number;
      end: number;
      grabOffset: number;
      moved: boolean;
      locked: boolean;
    };

type TouchState = {
  x: number;
  y: number;
  t: number;
  timer: ReturnType<typeof setTimeout> | null;
  eventEl: HTMLElement | null;
  lifted: boolean;
};

type Refs = {
  bodyRef: React.RefObject<HTMLDivElement | null>;
  scrollRef: React.RefObject<HTMLDivElement | null>;
};

// Pointer, long-press and swipe handling for creating, moving and resizing events.
export function useGridDrag(days: string[], { bodyRef, scrollRef }: Refs) {
  const events = useAppStore((s) => s.events);
  const moveEvent = useAppStore((s) => s.moveEvent);
  const openPopover = useCalendarStore((s) => s.openPopover);
  const step = useCalendarStore((s) => s.step);

  const pointerStart = useRef<{ x: number; y: number; target: Element | null } | null>(null);
  const touch = useRef<TouchState | null>(null);
  const dragActive = useRef(false);
  const [drag, setDrag] = useState<Drag | null>(null);

  // Block native scrolling only while a long-pressed event is being dragged.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onTouchMove = (e: TouchEvent) => {
      if (dragActive.current && e.cancelable) e.preventDefault();
    };
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    return () => el.removeEventListener("touchmove", onTouchMove);
  }, [scrollRef]);

  function pointToSlot(clientX: number, clientY: number) {
    const rect = bodyRef.current!.getBoundingClientRect();
    const colWidth = rect.width / days.length;
    return {
      dayIndex: clamp(Math.floor((clientX - rect.left) / colWidth), 0, days.length - 1),
      minutes: clamp(pxToMinutes(clientY - rect.top), 0, 1440),
    };
  }

  function startDrag(eventEl: HTMLElement, minutes: number, resizing: boolean) {
    const ev = events.find((x) => x.id === eventEl.dataset.eventId);
    if (!ev) return;
    setDrag({
      type: resizing ? "resize" : "move",
      eventId: ev.id,
      dayIndex: days.indexOf(ev.date),
      start: ev.start,
      end: ev.end,
      grabOffset: minutes - ev.start,
      moved: false,
      locked: Boolean(ev.requestId),
    });
  }

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    if (e.button !== 0) return;
    const target = e.target as Element;
    const eventEl = target.closest<HTMLElement>("[data-event-id]");
    const { dayIndex, minutes } = pointToSlot(e.clientX, e.clientY);
    pointerStart.current = { x: e.clientX, y: e.clientY, target: eventEl };

    if (e.pointerType === "touch") {
      const state: TouchState = { x: e.clientX, y: e.clientY, t: e.timeStamp, timer: null, eventEl, lifted: false };
      if (eventEl && !eventEl.dataset.locked) {
        state.timer = setTimeout(() => {
          state.lifted = true;
          dragActive.current = true;
          navigator.vibrate?.(8);
          startDrag(eventEl, minutes, false);
        }, LONG_PRESS_MS);
      }
      touch.current = state;
      return;
    }

    e.currentTarget.setPointerCapture(e.pointerId);
    if (eventEl) startDrag(eventEl, minutes, Boolean(target.closest("[data-resize]")));
    else {
      const m = snap(minutes - SNAP_MINUTES / 2);
      setDrag({ type: "create", dayIndex, anchor: m, current: m, moved: false });
    }
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const t = touch.current;
    if (t && !t.lifted && t.timer && Math.hypot(e.clientX - t.x, e.clientY - t.y) > 8) {
      clearTimeout(t.timer);
      t.timer = null;
    }
    if (!drag || !pointerStart.current) return;
    const dist = Math.hypot(e.clientX - pointerStart.current.x, e.clientY - pointerStart.current.y);
    const moved = drag.moved || dist > DRAG_THRESHOLD;
    if (!moved) return;
    const { dayIndex, minutes } = pointToSlot(e.clientX, e.clientY);

    if (drag.type === "create") setDrag({ ...drag, moved, current: snap(minutes) });
    else if (drag.locked) setDrag({ ...drag, moved });
    else if (drag.type === "move") {
      const length = drag.end - drag.start;
      const start = clamp(snap(minutes - drag.grabOffset), 0, 1440 - length);
      setDrag({ ...drag, moved, dayIndex, start, end: start + length });
    } else {
      const end = clamp(snap(minutes), drag.start + MIN_EVENT_MINUTES, 1440);
      setDrag({ ...drag, moved, end });
    }
  }

  function endTouch(e: React.PointerEvent<HTMLDivElement>): boolean {
    const t = touch.current;
    if (!t) return false;
    touch.current = null;
    if (t.timer) clearTimeout(t.timer);
    if (t.lifted) return false;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    const swipe = days.length <= 3 && Math.abs(dx) > SWIPE_DISTANCE && Math.abs(dy) < Math.abs(dx) * 0.6;
    if (swipe && e.timeStamp - t.t < 600) {
      step(dx < 0 ? 1 : -1);
    } else if (Math.hypot(dx, dy) < 8) {
      if (t.eventEl) openPopover("event", t.eventEl.dataset.eventId!, t.eventEl);
      else {
        const { dayIndex, minutes } = pointToSlot(t.x, t.y);
        const s = clamp(Math.floor(minutes / 30) * 30, 0, 1380);
        openOverlay({ kind: "event", date: days[dayIndex], start: s, end: s + 60 });
      }
    }
    return true;
  }

  function onPointerUp(e: React.PointerEvent<HTMLDivElement>) {
    dragActive.current = false;
    if (endTouch(e)) return;
    const d = drag;
    const start = pointerStart.current;
    setDrag(null);
    pointerStart.current = null;
    if (!d) return;

    if (d.type === "create") {
      const day = days[d.dayIndex];
      if (!d.moved) {
        const s = clamp(Math.floor(d.anchor / 30) * 30, 0, 1380);
        openOverlay({ kind: "event", date: day, start: s, end: s + 60 });
      } else {
        const s = Math.min(d.anchor, d.current);
        const en = Math.max(d.anchor, d.current, s + MIN_EVENT_MINUTES);
        openOverlay({ kind: "event", date: day, start: s, end: en });
      }
      return;
    }
    if (!d.moved || d.locked) {
      if (start?.target) openPopover("event", d.eventId, start.target);
      return;
    }
    const ev = events.find((x) => x.id === d.eventId);
    const date = days[d.dayIndex];
    if (ev && (ev.date !== date || ev.start !== d.start || ev.end !== d.end)) {
      moveEvent(d.eventId, { date, start: d.start, end: d.end });
    }
  }

  function onPointerCancel() {
    if (touch.current?.timer) clearTimeout(touch.current.timer);
    touch.current = null;
    dragActive.current = false;
    setDrag(null);
  }

  return { drag, onPointerDown, onPointerMove, onPointerUp, onPointerCancel };
}

export function createGhostFor(drag: Drag | null) {
  if (drag?.type !== "create") return null;
  const lo = Math.min(drag.anchor, drag.current);
  const slot = clamp(Math.floor(drag.anchor / 30) * 30, 0, 1380);
  return {
    dayIndex: drag.dayIndex,
    start: drag.moved ? lo : slot,
    end: drag.moved ? Math.max(drag.anchor, drag.current, lo + MIN_EVENT_MINUTES) : slot + 60,
  };
}
