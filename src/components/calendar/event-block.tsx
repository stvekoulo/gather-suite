"use client";

import { formatTime, formatTimeRange } from "@/lib/dates";
import type { CalEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { eventStyle } from "./event-colors";
import { minutesToPx } from "./layout";
import { TwoLineTitle } from "./two-line-title";

export function EventBlock({
  event,
  column,
  count,
  timeFormat,
  dragging,
  highlighted,
  selected,
  onOpen,
}: {
  event: CalEvent;
  column: number;
  count: number;
  timeFormat: "24h" | "12h";
  dragging: boolean;
  highlighted: boolean;
  selected: boolean;
  onOpen: (el: HTMLElement) => void;
}) {
  const height = minutesToPx(event.end - event.start) - 2;
  const compact = height < 44;
  const locked = Boolean(event.requestId);
  const time = formatTimeRange(event.start, event.end, timeFormat);

  return (
    <div
      data-event-id={event.id}
      role="button"
      tabIndex={0}
      aria-label={`${event.title}, ${time}${event.note ? `, ${event.note}` : ""}`}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen(e.currentTarget);
        }
      }}
      data-locked={locked || undefined}
      className={cn(
        "group/event @container absolute overflow-hidden rounded-lg font-medium outline-none",
        "transition-[box-shadow,filter,opacity,transform] duration-150 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-brand/60",
        "hover-fine:brightness-[0.97] dark:hover-fine:brightness-110",
        locked ? "cursor-pointer" : "cursor-grab",
        dragging && "z-30 opacity-95 shadow-[0_8px_24px_-6px_rgba(15,15,15,0.28)]",
        selected && "ring-2 ring-brand/70 ring-offset-1 ring-offset-surface",
        highlighted && "animate-[event-pulse_1.4s_var(--ease-out)]",
      )}
      style={{
        ...eventStyle(event.color),
        top: minutesToPx(event.start) + 1,
        height: Math.max(height, 14),
        left: `calc((100% - 5px) * ${column / count} + 2px)`,
        width: `calc((100% - 5px) / ${count} - ${count > 1 ? 2 : 0}px)`,
        zIndex: dragging ? 30 : 10 + column,
        ["--lines" as string]: Math.max(1, Math.floor((height - 6) / 13)),
      }}
    >
      {compact ? (
        <div className="flex h-full w-full items-center px-2 @max-[84px]:px-1">
          <p className="t-14 salt min-w-0 flex-1 truncate @max-[84px]:text-[11px] @max-[84px]:tracking-normal">
            {event.title}
            {height >= 28 ? null : (
              <span className="t-12 ml-1 opacity-80 @max-[84px]:hidden">{formatTime(event.start, timeFormat)}</span>
            )}
          </p>
        </div>
      ) : (
        <div className="flex h-full w-full flex-col gap-0.5 p-2 @max-[84px]:p-1">
          <div className="contents @max-[84px]:hidden">
            {height >= 60 ? (
              <TwoLineTitle text={event.title} className="t-14 salt w-full shrink-0 overflow-hidden" />
            ) : (
              <p className="t-14 salt w-full shrink-0 truncate">{event.title}</p>
            )}
            <p className="t-12 salt w-full shrink-0 truncate">{time}</p>
            {event.note && <p className="t-12 salt w-full shrink-0 truncate">{event.note}</p>}
          </div>
          <p className="hidden text-[11px] leading-[13px] break-words hyphens-auto @max-[84px]:line-clamp-(--lines)">
            {event.title}
          </p>
        </div>
      )}
      {!locked && (
        <span
          data-resize
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize pointer-coarse:hidden"
        />
      )}
    </div>
  );
}
