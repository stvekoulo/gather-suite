"use client";

import { CalendarDaysIcon, XIcon } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { WheelPicker } from "@/components/beui/wheel-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toKey } from "@/lib/dates";

const MONTHS = [
  { label: "Janvier", value: "01" },
  { label: "Février", value: "02" },
  { label: "Mars", value: "03" },
  { label: "Avril", value: "04" },
  { label: "Mai", value: "05" },
  { label: "Juin", value: "06" },
  { label: "Juillet", value: "07" },
  { label: "Août", value: "08" },
  { label: "Septembre", value: "09" },
  { label: "Octobre", value: "10" },
  { label: "Novembre", value: "11" },
  { label: "Décembre", value: "12" },
];

const YEARS = Array.from({ length: 25 }, (_, i) => String(2020 + i));

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

export interface WheelDatePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

// Sélecteur de date animé avec 3 rouleaux 3D (Jour, Mois, Année) et clic haptique
export function WheelDatePicker({
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel = "Sélectionner une date",
}: WheelDatePickerProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const todayIso = toKey(new Date());
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue ?? todayIso);
  const current = controlled ? (value || todayIso) : internal;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [y, m, d] = current.includes("-") ? current.split("-") : todayIso.split("-");
  const yearNum = Number(y) || 2026;
  const monthNum = Number(m) || 1;
  const maxDays = daysInMonth(yearNum, monthNum);
  const daysOptions = useMemo(
    () => Array.from({ length: maxDays }, (_, i) => String(i + 1).padStart(2, "0")),
    [maxDays]
  );

  const safeDay = Math.min(Number(d) || 1, maxDays).toString().padStart(2, "0");

  const commit = (newY: string, newM: string, newD: string) => {
    const yNum = Number(newY);
    const mNum = Number(newM);
    const max = daysInMonth(yNum, mNum);
    const clampedD = Math.min(Number(newD), max).toString().padStart(2, "0");
    const next = `${newY}-${newM}-${clampedD}`;
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", handleClick);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleClick);
      window.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative inline-block w-full">
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={ariaLabel}
        onClick={() => setOpen(!open)}
        className={cn(
          "flex h-8 w-full items-center justify-between gap-2 rounded-lg border border-hairline bg-surface px-2.5 text-xs text-fg shadow-2xs outline-none transition-colors",
          "hover:border-fg-2/40 hover:bg-hover/50 focus-visible:ring-2 focus-visible:ring-brand/40",
          open && "border-brand ring-1 ring-brand/30",
          disabled && "pointer-events-none opacity-50",
          className
        )}
      >
        <span className="font-mono text-xs font-semibold tabular-nums text-fg">
          {safeDay}/{m}/{y}
        </span>
        <CalendarDaysIcon className="size-3.5 text-icon" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-72 max-w-[calc(100vw-32px)] rounded-2xl border border-hairline bg-surface p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-hairline/60">
            <span className="text-[11px] font-semibold text-fg-2">Date (clic mécanique)</span>
            <Button
              type="button"
              size="icon-xs"
              variant="ghost"
              onClick={() => setOpen(false)}
              className="size-6 text-icon hover:text-fg"
            >
              <XIcon className="size-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-1.5 py-3">
            <div>
              <span className="block pb-1 text-center text-[10px] font-medium text-fg-3">Jour</span>
              <WheelPicker
                options={daysOptions}
                value={safeDay}
                onValueChange={(newD) => commit(y, m, newD)}
                visibleCount={5}
                itemHeight={32}
                sound
                className="w-full bg-surface-2/30"
              />
            </div>

            <div>
              <span className="block pb-1 text-center text-[10px] font-medium text-fg-3">Mois</span>
              <WheelPicker
                options={MONTHS}
                value={m}
                onValueChange={(newM) => commit(y, newM, safeDay)}
                visibleCount={5}
                itemHeight={32}
                sound
                className="w-full bg-surface-2/30"
              />
            </div>

            <div>
              <span className="block pb-1 text-center text-[10px] font-medium text-fg-3">Année</span>
              <WheelPicker
                options={YEARS}
                value={y}
                onValueChange={(newY) => commit(newY, m, safeDay)}
                visibleCount={5}
                itemHeight={32}
                sound
                className="w-full bg-surface-2/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-hairline/60">
            <span className="font-mono text-xs font-bold text-brand">
              {safeDay}/{m}/{y}
            </span>
            <Button
              type="button"
              size="sm"
              variant="brand"
              onClick={() => setOpen(false)}
              className="h-6 text-[11px] px-2.5"
            >
              Confirmer
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
