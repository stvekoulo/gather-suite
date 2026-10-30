"use client";

import { useState } from "react";
import { ArrowRight, CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";
import { parse, iso, monthOf, shiftMonth, ordered, DAY } from "./date-picker/date-utils";
import type { DateRange, DateRangePickerProps } from "./date-picker/types";
export type { DateRange, DateRangePreset, DateRangePickerProps } from "./date-picker/types";

// Composant Sélecteur de Plage de Dates beUI animé avec calendrier mensuel
export function DateRangePicker({
  value,
  defaultValue = null,
  onValueChange,
  className,
  locale = "fr-FR",
}: DateRangePickerProps) {
  const [internal, setInternal] = useState<DateRange | null>(defaultValue);
  const current = value !== undefined ? value : internal;
  const todayIso = new Date().toISOString().slice(0, 10);
  const [month, setMonth] = useState(() => monthOf(current?.from || todayIso));
  const [open, setOpen] = useState(false);

  const handleSelect = (dayIso: string) => {
    if (!current || (current.from && current.to)) {
      const next = { from: dayIso };
      setInternal(next);
      onValueChange?.(next);
    } else {
      const next = ordered(current.from, dayIso);
      setInternal(next);
      onValueChange?.(next);
      setOpen(false);
    }
  };

  const clear = () => {
    setInternal(null);
    onValueChange?.(null);
  };

  const monthDate = new Date(parse(month));
  const monthName = new Intl.DateTimeFormat(locale, { month: "long", year: "numeric", timeZone: "UTC" }).format(monthDate);
  const firstDay = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), 1)).getUTCDay();
  const startOffset = (firstDay + 6) % 7;
  const lastDate = new Date(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth() + 1, 0)).getUTCDate();

  const days: (string | null)[] = [];
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let d = 1; d <= lastDate; d++) {
    days.push(iso(Date.UTC(monthDate.getUTCFullYear(), monthDate.getUTCMonth(), d)));
  }

  const formatShort = (dateStr?: string) => {
    if (!dateStr) return "";
    return new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(parse(dateStr)));
  };

  return (
    <div className={cn("relative inline-block", className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex h-8 items-center gap-2 rounded-xl border border-control bg-surface px-2.5 text-xs font-medium text-fg shadow-xs transition-colors hover:border-fg-2/40 outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <CalendarDays className="size-3.5 text-icon" />
        <span>
          {current?.from ? (
            current.to ? `${formatShort(current.from)} – ${formatShort(current.to)}` : `Depuis le ${formatShort(current.from)}`
          ) : "Sélectionner des dates"}
        </span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full z-40 mt-1.5 w-72 rounded-2xl border border-hairline bg-surface p-3 shadow-xl backdrop-blur-md"
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-hairline">
              <span className="text-xs font-semibold text-fg capitalize">{monthName}</span>
              <div className="flex items-center gap-0.5">
                <button
                  type="button"
                  onClick={() => setMonth(shiftMonth(month, -1))}
                  className="flex size-6 items-center justify-center rounded-lg text-icon hover:bg-hover hover:text-fg"
                >
                  <ChevronLeft className="size-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setMonth(shiftMonth(month, 1))}
                  className="flex size-6 items-center justify-center rounded-lg text-icon hover:bg-hover hover:text-fg"
                >
                  <ChevronRight className="size-3.5" />
                </button>
              </div>
            </div>

            {/* Days of week */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-medium text-fg-2 pb-1">
              {["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"].map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="size-8" />;
                const isFrom = current?.from === day;
                const isTo = current?.to === day;
                const inRange = Boolean(current?.from && current.to && day >= current.from && day <= current.to);
                const isSelected = isFrom || isTo;
                const dayNum = new Date(parse(day)).getUTCDate();

                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => handleSelect(day)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-lg text-xs font-medium transition-colors",
                      isSelected
                        ? "bg-brand text-white font-semibold"
                        : inRange
                        ? "bg-brand/15 text-brand"
                        : "hover:bg-hover text-fg"
                    )}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-hairline pt-2 mt-2 text-[11px]">
              <button type="button" onClick={clear} className="text-fg-2 hover:text-fg">
                Effacer
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="font-medium text-brand hover:underline"
              >
                Fermer
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
