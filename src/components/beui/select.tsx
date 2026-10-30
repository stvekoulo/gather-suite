"use client";

import { ChevronDown } from "lucide-react";
import { animate, motion, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";
import {
  RADIUS,
  SelectContext,
  type SelectContextValue,
  type SelectProps,
  UNFOLD_EXIT,
  UNFOLD_SPRING,
  useSelectContext,
} from "./select-context";

export type { SelectProps } from "./select-context";
export { SelectContent, SelectItem } from "./select-content";

// Composant Select animé beUI déroulant avec physique et navigation clavier
export function Select({
  value,
  defaultValue,
  onValueChange,
  open: openProp,
  defaultOpen = false,
  onOpenChange,
  disabled = false,
  className,
  children,
}: SelectProps) {
  const reduce = useReducedMotion() ?? false;
  const baseId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const [internal, setInternal] = useState(defaultValue);
  const [labels, setLabels] = useState<Map<string, { label: string; disabled: boolean }>>(new Map());
  const [placement, setPlacement] = useState<"bottom" | "top">("bottom");

  const controlled = value !== undefined;
  const current = controlled ? value : internal;
  const openControlled = openProp !== undefined;
  const open = openControlled ? openProp : internalOpen;
  const progress = useMotionValue(open ? 1 : 0);

  const setOpen = useCallback(
    (next: boolean) => {
      if (!openControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange, openControlled]
  );

  const close = useCallback(() => {
    const trigger = document.getElementById(`${baseId}-trigger`);
    if (rootRef.current?.contains(document.activeElement) && document.activeElement !== trigger) {
      trigger?.focus();
    }
    setOpen(false);
  }, [baseId, setOpen]);

  const select = useCallback(
    (next: string) => {
      if (!controlled) setInternal(next);
      onValueChange?.(next);
      close();
    },
    [controlled, onValueChange, close]
  );

  const register = useCallback((v: string, label: string, disabledItem: boolean) => {
    setLabels((m) => {
      const entry = m.get(v);
      if (entry?.label === label && entry.disabled === disabledItem) return m;
      return new Map(m).set(v, { label, disabled: disabledItem });
    });
  }, []);

  const unregister = useCallback((v: string) => {
    setLabels((m) => {
      if (!m.has(v)) return m;
      const next = new Map(m);
      next.delete(v);
      return next;
    });
  }, []);

  useEffect(() => {
    const animation = animate(progress, open ? 1 : 0, reduce ? { duration: 0.12 } : open ? UNFOLD_SPRING : UNFOLD_EXIT);
    return () => animation.stop();
  }, [open, progress, reduce]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPointer = (e: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer);
    };
  }, [open, setOpen, close]);

  const rows = useMemo(
    () => Array.from(labels, ([id, entry]) => ({ id, label: entry.label, disabled: entry.disabled })),
    [labels]
  );

  const ctx = useMemo<SelectContextValue>(
    () => ({
      value: current,
      open,
      setOpen,
      select,
      register,
      unregister,
      labelFor: (v) => (v === undefined ? undefined : labels.get(v)?.label),
      rows,
      close,
      reduce,
      progress,
      triggerId: `${baseId}-trigger`,
      listId: `${baseId}-list`,
      disabled,
      placement,
      setPlacement,
    }),
    [current, open, setOpen, select, register, unregister, labels, rows, close, reduce, progress, baseId, disabled, placement]
  );

  return (
    <SelectContext.Provider value={ctx}>
      <div ref={rootRef} className={cn("relative", className)}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

export function SelectTrigger({ className, children }: { className?: string; children: ReactNode }) {
  const ctx = useSelectContext("SelectTrigger");
  const isTop = ctx.placement === "top";
  const nearRadius = useTransform(ctx.progress, [0, 0.2, 0.4, 1], [RADIUS, 0, 0, RADIUS]);
  const rotate = useTransform(ctx.progress, (p) => (ctx.reduce ? (ctx.open ? 180 : 0) : Math.min(1, Math.max(0, p)) * 180));

  return (
    <motion.button
      type="button"
      id={ctx.triggerId}
      disabled={ctx.disabled}
      aria-haspopup="listbox"
      aria-expanded={ctx.open}
      aria-controls={ctx.listId}
      onClick={() => ctx.setOpen(!ctx.open)}
      onKeyDown={(event) => {
        if (!ctx.open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
          event.preventDefault();
          ctx.setOpen(true);
        }
      }}
      style={{
        borderTopLeftRadius: ctx.reduce || !isTop ? RADIUS : nearRadius,
        borderTopRightRadius: ctx.reduce || !isTop ? RADIUS : nearRadius,
        borderBottomLeftRadius: ctx.reduce || isTop ? RADIUS : nearRadius,
        borderBottomRightRadius: ctx.reduce || isTop ? RADIUS : nearRadius,
      }}
      className={cn(
        "relative z-10 flex h-8.5 w-full items-center justify-between gap-2 border border-control bg-surface px-3 py-1.5 text-xs text-fg outline-none transition-colors",
        "hover:border-fg-2/40 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:pointer-events-none disabled:opacity-50",
        className
      )}
    >
      {children}
      <motion.span aria-hidden style={{ rotate }} className="text-icon">
        <ChevronDown className="size-3.5" />
      </motion.span>
    </motion.button>
  );
}

export function SelectValue({ placeholder, className }: { placeholder?: string; className?: string }) {
  const ctx = useSelectContext("SelectValue");
  const label = ctx.labelFor(ctx.value);
  return <span className={cn(label ? "text-fg" : "text-fg-2", className)}>{label ?? placeholder ?? "Sélectionner"}</span>;
}
