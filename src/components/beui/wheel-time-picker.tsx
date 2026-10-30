"use client";

import { ClockIcon, XIcon } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { WheelPicker } from "@/components/beui/wheel-picker";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

export interface WheelTimePickerProps {
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
  "aria-label"?: string;
}

// Sélecteur d'heure animé avec rouleaux 3D iOS et retour haptique Web Audio
export function WheelTimePicker({
  value,
  defaultValue = "09:00",
  onChange,
  disabled = false,
  className,
  id,
  "aria-label": ariaLabel = "Sélectionner une heure",
}: WheelTimePickerProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const controlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = controlled ? (value || "09:00") : internal;
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const [h, m] = current.includes(":") ? current.split(":") : ["09", "00"];
  const safeH = HOURS.includes(h) ? h : "09";
  const safeM = MINUTES.includes(m) ? m : "00";

  const handleHourChange = (newH: string) => {
    const next = `${newH}:${safeM}`;
    if (!controlled) setInternal(next);
    onChange?.(next);
  };

  const handleMinuteChange = (newM: string) => {
    const next = `${safeH}:${newM}`;
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
          {safeH}:{safeM}
        </span>
        <ClockIcon className="size-3.5 text-icon" />
      </button>

      {open && (
        <div className="absolute left-0 z-50 mt-1.5 w-60 max-w-[calc(100vw-32px)] rounded-2xl border border-hairline bg-surface p-3 shadow-xl backdrop-blur-md animate-in fade-in-0 zoom-in-95">
          <div className="flex items-center justify-between pb-2 border-b border-hairline/60">
            <span className="text-[11px] font-semibold text-fg-2">Heure (clic haptique)</span>
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

          <div className="flex items-center justify-center gap-2 py-3">
            <div className="w-20">
              <span className="block pb-1 text-center text-[10px] font-medium text-fg-3">Heures</span>
              <WheelPicker
                options={HOURS}
                value={safeH}
                onValueChange={handleHourChange}
                visibleCount={5}
                itemHeight={32}
                sound
                className="w-full bg-surface-2/30"
              />
            </div>

            <span className="text-lg font-bold text-fg-3 pt-4">:</span>

            <div className="w-20">
              <span className="block pb-1 text-center text-[10px] font-medium text-fg-3">Minutes</span>
              <WheelPicker
                options={MINUTES}
                value={safeM}
                onValueChange={handleMinuteChange}
                visibleCount={5}
                itemHeight={32}
                sound
                className="w-full bg-surface-2/30"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-hairline/60">
            <span className="font-mono text-xs font-bold text-brand">
              {safeH} h {safeM}
            </span>
            <Button
              type="button"
              size="sm"
              variant="brand"
              onClick={() => setOpen(false)}
              className="h-6 text-[11px] px-2.5"
            >
              Valider
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
