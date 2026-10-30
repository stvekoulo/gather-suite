"use client";

import { Check } from "lucide-react";
import { motion, useMotionValueEvent, useTransform } from "motion/react";
import { type ReactNode, useContext, useLayoutEffect, useRef, useState } from "react";
import { useListbox } from "@/lib/hooks/use-listbox";
import { cn } from "@/lib/utils";
import {
  ActiveOptionContext,
  GAP,
  ITEM_VARIANTS,
  LIP,
  RADIUS,
  lerp,
  useSelectContext,
} from "./select-context";

// Menu déroulant animé avec projection et ajustement vertical
export function SelectContent({ className, children }: { className?: string; children: ReactNode }) {
  const ctx = useSelectContext("SelectContent");
  const panelRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);
  const { open, progress, reduce, setPlacement } = ctx;
  const { activeId, onKeyDown } = useListbox({ open, rows: ctx.rows, selected: ctx.value, list: panelRef });

  const [exiting, setExiting] = useState(false);
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (!open) setExiting(true);
  }
  const present = open || exiting;
  useMotionValueEvent(progress, "animationComplete", () => {
    if (progress.get() === 0) setExiting(false);
  });

  useLayoutEffect(() => {
    const node = panelRef.current;
    if (!node || !present) return;
    const measure = () => setHeight(node.offsetHeight);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [present]);

  useLayoutEffect(() => {
    if (!open) return;
    const trigger = document.getElementById(ctx.triggerId);
    const node = panelRef.current;
    if (!trigger || !node) return;
    const rect = trigger.getBoundingClientRect();
    const h = node.offsetHeight;
    const below = window.innerHeight - rect.bottom;
    const above = rect.top;
    setPlacement(below < h + 16 && above > below ? "top" : "bottom");
  }, [open, ctx.triggerId, setPlacement]);

  const isTop = ctx.placement === "top";
  const ready = height > 0 && !reduce;
  const fromY = ready ? (isTop ? GAP : -GAP) : 0;
  const detach = useTransform(progress, [0.4, 1], [0, 1]);
  const y = useTransform(detach, (d) => lerp(fromY, 0, d));
  const nearRadius = useTransform(detach, (d) => (ready ? RADIUS * d : RADIUS));
  const borderRadius = useTransform(nearRadius, (near) =>
    isTop ? `${RADIUS}px ${RADIUS}px ${near}px ${near}px` : `${near}px ${near}px ${RADIUS}px ${RADIUS}px`
  );
  const clipPath = useTransform([progress, nearRadius], ([p, near]: number[]) => {
    if (!ready) return "none";
    const reveal = Math.min(1, Math.max(0, p));
    if (reveal === 1) return "none";
    const hidden = Math.max(0, (height - LIP) * (1 - reveal));
    const inset = isTop ? `${hidden}px 0 0 0` : `0 0 ${hidden}px 0`;
    const corners = isTop ? `${RADIUS}px ${RADIUS}px ${near}px ${near}px` : `${near}px ${near}px ${RADIUS}px ${RADIUS}px`;
    return `inset(${inset} round ${corners})`;
  });
  const opacity = useTransform(progress, reduce ? [0, 1] : [0, 0.12], [0, 1]);

  return (
    <motion.div
      ref={panelRef}
      id={ctx.listId}
      role="listbox"
      aria-labelledby={ctx.triggerId}
      aria-hidden={!open}
      inert={!open}
      onKeyDown={(event) => {
        if (event.key === "Tab") ctx.close();
        else onKeyDown(event);
      }}
      style={{
        visibility: present ? undefined : "hidden",
        maxHeight: present ? undefined : 0,
        borderWidth: present ? undefined : 0,
        y,
        clipPath,
        borderRadius,
        opacity,
        pointerEvents: open ? "auto" : "none",
        marginTop: isTop ? 0 : GAP,
        marginBottom: isTop ? GAP : 0,
      }}
      className={cn(
        "absolute left-0 right-0 z-30 min-w-36 overflow-hidden rounded-xl border border-hairline bg-surface p-1 shadow-lg",
        isTop ? "bottom-full" : "top-full",
        className
      )}
    >
      <ActiveOptionContext.Provider value={activeId}>
        <motion.div initial={false} animate={open ? "show" : "hidden"} className="flex flex-col gap-0.5">
          {children}
        </motion.div>
      </ActiveOptionContext.Provider>
    </motion.div>
  );
}

// Option individuelle du Select beUI avec retour visuel animé
export function SelectItem({
  value,
  disabled = false,
  className,
  children,
}: {
  value: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const ctx = useSelectContext("SelectItem");
  const activeId = useContext(ActiveOptionContext);
  const selected = ctx.value === value;
  const label = typeof children === "string" ? children : value;

  useLayoutEffect(() => {
    ctx.register(value, label, disabled);
  }, [ctx.register, value, label, disabled]);
  useLayoutEffect(() => () => ctx.unregister(value), [ctx.unregister, value]);

  return (
    <motion.div variants={ctx.reduce ? undefined : ITEM_VARIANTS}>
      <button
        type="button"
        role="option"
        aria-selected={selected}
        disabled={disabled}
        tabIndex={activeId === value ? 0 : -1}
        data-listbox-id={value}
        onClick={() => ctx.select(value)}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs outline-none transition-colors",
          selected ? "bg-brand/10 font-medium text-brand" : "text-fg hover:bg-hover focus-visible:bg-hover",
          "disabled:pointer-events-none disabled:opacity-50",
          className
        )}
      >
        <span>{children}</span>
        {selected ? <Check className="size-3.5 shrink-0 text-brand" /> : null}
      </button>
    </motion.div>
  );
}
