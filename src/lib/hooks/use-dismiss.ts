"use client";

import { type RefObject, useEffect } from "react";

export type DismissBehavior = "pass-through" | "consume";

export interface DismissOptions {
  behavior?: DismissBehavior;
  escape?: boolean;
  ignore?: (target: Element) => boolean;
}

const openScopes = new Set<(target: Element) => boolean>();

export function useDismiss(
  open: boolean,
  onDismiss: () => void,
  ref: RefObject<HTMLElement | SVGElement | null> | null,
  { escape: dismissOnEscape = true, ignore }: DismissOptions = {}
) {
  useEffect(() => {
    if (!open) return;
    const inside = (target: Element) => Boolean(ref?.current?.contains(target)) || Boolean(ignore?.(target));
    const onKey = (event: KeyboardEvent) => {
      if (dismissOnEscape && event.key === "Escape") onDismiss();
    };
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (!target || inside(target)) return;
      onDismiss();
    };
    openScopes.add(inside);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onPointer, true);
    return () => {
      openScopes.delete(inside);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onPointer, true);
    };
  }, [open, onDismiss, ref, dismissOnEscape, ignore]);
}
