"use client";

import { useMemo } from "react";
import { CalendarHeartIcon, CopyIcon, MapPinIcon, PencilIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor, PopoverContent } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatDuration, formatLong, formatTimeRange, formatWeekday } from "@/lib/dates";
import { useIsMobile } from "@/hooks/use-media-query";
import { useTranslate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";
import { useCalendarStore } from "@/stores/calendar-store";
import { openOverlay } from "@/stores/overlay-store";
import { deleteCalendarEvent } from "./delete-event";

// Bulle de détails pour un événement ou un jour férié
export function EventPopover() {
  const tr = useTranslate();
  const target = useCalendarStore((s) => s.popover);
  const close = useCalendarStore((s) => s.closePopover);
  const event = useAppStore((s) => (target?.kind === "event" ? s.events.find((e) => e.id === target.id) : undefined));
  const holiday = useAppStore((s) => (target?.kind === "holiday" ? s.holidays.find((h) => h.id === target.id) : undefined));
  const timeFormat = useAppStore((s) => s.settings.timeFormat);
  const duplicateEvent = useAppStore((s) => s.duplicateEvent);

  const isMobile = useIsMobile();
  const rect = target?.rect;
  const virtualRef = useMemo(
    () => ({
      current: {
        getBoundingClientRect: () =>
          rect ? DOMRect.fromRect(rect) : DOMRect.fromRect({ x: 0, y: 0, width: 0, height: 0 }),
      },
    }),
    [rect],
  );

  const open = Boolean(target && (event || holiday));

  return (
    <Popover open={open} onOpenChange={(v) => !v && close()}>
      <PopoverAnchor virtualRef={virtualRef} />
      <PopoverContent
        side={isMobile ? "bottom" : "right"}
        align={isMobile ? "center" : "start"}
        sideOffset={8}
        collisionPadding={12}
        className="w-[300px] max-w-[calc(100vw-24px)] gap-0 p-0"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {event && (
          <>
            <div className="flex gap-3 p-4">
              <span className="mt-0.5 size-3 shrink-0 rounded-[4px]" style={{ background: `var(--event-${event.color}-fg)` }} />
              <div className="grid min-w-0 flex-1 gap-2">
                <h3 className="t-16 font-medium leading-[1.25] break-words text-fg">{event.title}</h3>
                <p className="t-14 salt text-fg-2">
                  {formatWeekday(event.date)}, {formatLong(event.date)}
                </p>
                <p className="t-14 salt text-fg-2">
                  {event.allDay
                    ? tr("Toute la journée")
                    : `${formatTimeRange(event.start, event.end, timeFormat)} · ${formatDuration(event.end - event.start)}`}
                </p>
                {event.category && (
                  <span className="inline-flex items-center gap-1 self-start rounded-md bg-app px-2 py-0.5 text-xs text-fg-2">
                    {event.category}
                  </span>
                )}
                {event.location && (
                  <p className="t-14 flex items-center gap-1.5 text-fg-2">
                    <MapPinIcon className="size-3.5 text-icon" /> <span className="truncate">{event.location}</span>
                  </p>
                )}
                {event.note && <p className="t-14 leading-[1.4] text-fg">{event.note}</p>}
              </div>
            </div>
            <div className="flex items-center gap-1 border-t border-hairline bg-app px-2 py-2">
              <Button
                size="sm"
                onClick={() => {
                  close();
                  openOverlay({ kind: "event", eventId: event.id });
                }}
              >
                <PencilIcon /> {tr("Modifier")}
              </Button>
              <span className="flex-1" />
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tr("Dupliquer")}
                    onClick={() => {
                      duplicateEvent(event.id);
                      close();
                    }}
                  >
                    <CopyIcon />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{tr("Dupliquer")}</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={tr("Supprimer")}
                    onClick={() => deleteCalendarEvent(event.id)}
                  >
                    <Trash2Icon className="text-danger" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {tr("Supprimer")} <kbd className="ml-1 font-sans opacity-70">⌫</kbd>
                </TooltipContent>
              </Tooltip>
            </div>
          </>
        )}
        {holiday && (
          <div className="flex gap-3 p-4">
            <span className="mt-0.5 size-3 shrink-0 rounded-[4px] bg-[var(--event-purple-fg)]" />
            <div className="grid min-w-0 flex-1 gap-2">
              <h3 className="t-16 font-semibold text-fg">{holiday.name}</h3>
              <p className="t-14 salt text-fg-2">
                {formatWeekday(holiday.date)}, {formatLong(holiday.date)}
              </p>
              <p className="t-14 salt text-fg-2">{tr("Jour férié officiel")}</p>
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
