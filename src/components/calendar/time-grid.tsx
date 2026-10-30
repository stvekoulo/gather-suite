"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { formatTime, formatTimeRange, fromKey } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { useNow, useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { AllDayRow } from "./all-day-row";
import { DayHeaders, WeekStrip } from "./day-headers";
import { EventBlock } from "./event-block";
import { HOUR_HEIGHT, layoutDay, minutesToPx } from "./layout";
import { createGhostFor, useGridDrag } from "./use-grid-drag";
import { dropCalendarTask } from "@/modules/tasks/calendar-task-drop";

export { DayHeaders };

const HOURS = Array.from({ length: 23 }, (_, i) => i + 1);
const MIN_COLUMN = 96;

export function TimeGrid({ days, strip }: { days: string[]; strip?: string[] }) {
  const events = useAppStore((s) => s.events);
  const timeFormat = useAppStore((s) => s.settings.timeFormat);
  const dayStartHour = useAppStore((s) => s.settings.dayStartHour);
  const focusEventId = useCalendarStore((s) => s.focusEventId);
  const clearFocus = useCalendarStore((s) => s.clearFocus);
  const openPopover = useCalendarStore((s) => s.openPopover);
  const selectedEventId = useCalendarStore((s) => (s.popover?.kind === "event" ? s.popover.id : null));
  const selectedDate = useCalendarStore((s) => s.date);
  const today = useToday();
  const now = useNow();

  const scrollRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const didScrollX = useRef(false);
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const { drag, onPointerDown, onPointerMove, onPointerUp, onPointerCancel } = useGridDrag(days, {
    bodyRef,
    scrollRef,
  });

  useLayoutEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = dayStartHour * HOUR_HEIGHT;
  }, [dayStartHour]);

  // Narrow screens scroll horizontally; keep the selected day's column in view.
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || el.scrollWidth <= el.clientWidth) return;
    const index = days.indexOf(selectedDate);
    if (index < 0) return;
    const axis = parseFloat(getComputedStyle(el).getPropertyValue("--axis")) || 0;
    const col = (el.scrollWidth - axis) / days.length;
    const visible = el.clientWidth - axis;
    const left = index * col;
    if (left >= el.scrollLeft && left + col <= el.scrollLeft + visible) return;
    el.scrollTo({ left: Math.max(0, left - (visible - col) / 2), behavior: didScrollX.current ? "smooth" : "auto" });
    didScrollX.current = true;
  }, [days, selectedDate]);

  useEffect(() => {
    if (!focusEventId) return;
    const ev = events.find((e) => e.id === focusEventId);
    if (ev && !ev.allDay && scrollRef.current) {
      scrollRef.current.scrollTo({ top: Math.max(0, minutesToPx(ev.start) - HOUR_HEIGHT), behavior: "smooth" });
    }
    const raf = requestAnimationFrame(() => {
      setHighlightId(focusEventId);
      clearFocus();
    });
    const t = setTimeout(() => setHighlightId(null), 1400);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t);
    };
  }, [focusEventId, events, clearFocus]);

  const columns = useMemo(() => {
    const preview =
      drag && drag.type !== "create" && drag.moved && !drag.locked
        ? { id: drag.eventId, date: days[drag.dayIndex], start: drag.start, end: drag.end }
        : null;
    return days.map((day) => {
      const dayEvents = events
        .map((e) => (preview && e.id === preview.id ? { ...e, ...preview } : e))
        .filter((e) => !e.allDay && e.date === day);
      return layoutDay(dayEvents);
    });
  }, [days, events, drag]);

  const nowMinutes = now ? (now - fromKey(today).getTime()) / 60000 : -1;
  const todayIndex = days.indexOf(today);
  const createGhost = createGhostFor(drag);

  return (
    <>
      {strip && <WeekStrip days={strip} />}
      <div
        ref={scrollRef}
        onScroll={() => useCalendarStore.getState().popover && useCalendarStore.getState().closePopover()}
        className="relative min-h-0 w-full flex-1 overflow-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div
          className="relative flex min-w-full flex-col"
          style={{ width: `max(100%, calc(var(--axis) + ${days.length * MIN_COLUMN}px))` }}
        >
          <div className="sticky top-0 z-40 bg-surface">
            <div className={strip ? "max-md:hidden" : undefined}>
              <DayHeaders days={days} />
            </div>
            <AllDayRow days={days} />
            <div className="pointer-events-none absolute inset-x-0 top-full h-2" aria-hidden>
              <div className="absolute inset-x-0 top-0 h-px bg-surface" />
              <div className="sticky left-0 h-2 w-(--axis) bg-surface" />
            </div>
          </div>

          <div className="relative flex w-full" style={{ height: 24 * HOUR_HEIGHT }}>
            <div className="pointer-events-none absolute inset-y-0 right-0 left-(--axis)" aria-hidden>
              {HOURS.map((h) => (
                <div key={h} className="absolute inset-x-0 h-px bg-hairline" style={{ top: h * HOUR_HEIGHT }} />
              ))}
            </div>

            <div className="sticky left-0 z-20 h-full w-(--axis) shrink-0 bg-surface select-none" aria-hidden>
              {HOURS.map((h) => (
                <span
                  key={h}
                  className="t-14 absolute right-3 whitespace-nowrap text-fg-2 max-md:right-1.5 max-md:text-[11px] max-md:tracking-normal"
                  style={{ top: h * HOUR_HEIGHT - 7 }}
                >
                  {formatTime(h * 60, timeFormat).replace(":00 ", " ")}
                </span>
              ))}
            </div>

            <div
              ref={bodyRef}
              onDragOver={(e) => { if (e.dataTransfer.types.includes("application/x-gather-task") || e.dataTransfer.types.includes("application/x-kargul-task")) e.preventDefault(); }}
              onDrop={(e) => dropCalendarTask(e, days)}
              className={cn(
                "relative flex h-full min-w-0 flex-1 select-none",
                days.length <= 3 ? "touch-pan-y" : "touch-manipulation",
                drag?.moved && drag.type === "move" && !drag.locked && "cursor-grabbing",
              )}
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerCancel}
            >
              {days.map((day, i) => (
                <div
                  key={day}
                  className="relative h-full min-w-0 flex-1 border-l border-hairline"
                  aria-label={`${fromKey(day).toDateString()} schedule`}
                  role="group"
                >
                  {columns[i].map(({ event, column, columns: count }) => (
                    <EventBlock
                      key={event.id}
                      event={event}
                      column={column}
                      count={count}
                      timeFormat={timeFormat}
                      dragging={Boolean(
                        drag && drag.type !== "create" && drag.eventId === event.id && drag.moved && !drag.locked,
                      )}
                      highlighted={highlightId === event.id}
                      selected={selectedEventId === event.id}
                      onOpen={(el) => openPopover("event", event.id, el)}
                    />
                  ))}

                  {createGhost?.dayIndex === i && (
                    <div
                      className="pointer-events-none absolute z-20 flex flex-col gap-0.5 overflow-hidden rounded-lg border border-dashed border-brand/60 bg-brand-tint p-2 text-brand"
                      style={{
                        top: minutesToPx(createGhost.start) + 1,
                        height: Math.max(minutesToPx(createGhost.end - createGhost.start) - 2, 14),
                        left: 2,
                        right: 3,
                      }}
                    >
                      <span className="t-12 salt">{formatTimeRange(createGhost.start, createGhost.end, timeFormat)}</span>
                    </div>
                  )}

                  {i === todayIndex && nowMinutes >= 0 && nowMinutes <= 1440 && (
                    <div
                      className="pointer-events-none absolute right-0 left-0 z-10 flex items-center"
                      style={{ top: minutesToPx(nowMinutes) - 4 }}
                      aria-label={`Now, ${formatTime(Math.floor(nowMinutes), timeFormat)}`}
                    >
                      <span className="-ml-1 size-2 rounded-full bg-brand" />
                      <span className="h-[1.5px] flex-1 bg-brand" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
