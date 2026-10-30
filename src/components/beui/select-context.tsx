"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { MotionValue, Variants } from "motion/react";
import { EASE_OUT } from "@/lib/ease";
import type { ListboxRow } from "@/lib/hooks/use-listbox";

export const UNFOLD_SPRING = { type: "spring", visualDuration: 0.2, bounce: 0.12 } as const;
export const UNFOLD_EXIT = { duration: 0.2, ease: EASE_OUT } as const;
export const RADIUS = 12;
export const GAP = 8;
export const LIP = 8;
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export const ITEM_VARIANTS: Variants = {
  hidden: { opacity: 0, y: -4, transition: { duration: 0.08, ease: EASE_OUT } },
  show: { opacity: 1, y: 0, transition: { duration: 0.12, ease: EASE_OUT } },
};

export type Placement = "bottom" | "top";

export interface SelectContextValue {
  value: string | undefined;
  open: boolean;
  setOpen: (open: boolean) => void;
  select: (value: string) => void;
  register: (value: string, label: string, disabled: boolean) => void;
  unregister: (value: string) => void;
  labelFor: (value: string | undefined) => string | undefined;
  rows: ListboxRow[];
  close: () => void;
  reduce: boolean;
  progress: MotionValue<number>;
  triggerId: string;
  listId: string;
  disabled: boolean;
  placement: Placement;
  setPlacement: (p: Placement) => void;
}

export const SelectContext = createContext<SelectContextValue | null>(null);
export const ActiveOptionContext = createContext<string | undefined>(undefined);

// Accesseur typé au contexte du Select beUI
export function useSelectContext(component: string) {
  const ctx = useContext(SelectContext);
  if (!ctx) throw new Error(`${component} must be used within <Select>`);
  return ctx;
}

export interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}
