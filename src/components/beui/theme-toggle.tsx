"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useReducedMotion } from "motion/react";
import { useEffect, useSyncExternalStore, type ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";
import { ActionSwapIcon } from "./action-swap";

const VT_STYLE_ID = "beui-theme-toggle-vt";
const noopSubscribe = () => () => {};

const VT_CSS = `
html[data-beui-vt="circle"]::view-transition-old(root) { animation: none; mix-blend-mode: normal; }
html[data-beui-vt="circle"]::view-transition-new(root) {
  mix-blend-mode: normal;
  animation: beui-circle-reveal 600ms cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes beui-circle-reveal {
  from { clip-path: circle(0% at 50% 50%); }
  to   { clip-path: circle(150% at 50% 50%); }
}
`;

export function ThemeToggle({
  className,
  iconClassName,
  ...rest
}: Omit<ComponentPropsWithoutRef<"button">, "children" | "onClick"> & { iconClassName?: string }) {
  const { setTheme, resolvedTheme } = useTheme();
  const reduce = useReducedMotion() ?? false;
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);

  useEffect(() => {
    if (!document.getElementById(VT_STYLE_ID)) {
      const el = document.createElement("style");
      el.id = VT_STYLE_ID;
      el.textContent = VT_CSS;
      document.head.appendChild(el);
    }
  }, []);

  const isDark = mounted && resolvedTheme === "dark";

  const toggle = () => {
    const next = isDark ? "light" : "dark";
    if (reduce || !("startViewTransition" in document)) {
      setTheme(next);
      return;
    }
    const root = document.documentElement;
    root.dataset.beuiVt = "circle";
    const vt = (
      document as Document & {
        startViewTransition(cb: () => void): { finished: Promise<void> };
      }
    ).startViewTransition(() => setTheme(next));
    vt.finished.finally(() => {
      delete root.dataset.beuiVt;
    });
  };

  return (
    <button
      type="button"
      aria-label={mounted && isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
      className={cn(
        "flex size-9 items-center justify-center rounded-lg border border-control bg-surface text-icon outline-none transition-colors duration-150 hover-fine:bg-hover hover-fine:text-fg focus-visible:ring-2 focus-visible:ring-brand/40",
        className,
      )}
      {...rest}
    >
      {mounted ? (
        <ActionSwapIcon value={isDark ? "dark" : "light"} animation="blur" className={iconClassName}>
          {isDark ? <Sun className={cn("size-4", iconClassName)} /> : <Moon className={cn("size-4", iconClassName)} />}
        </ActionSwapIcon>
      ) : (
        <span className={cn("size-4", iconClassName)} aria-hidden="true" />
      )}
    </button>
  );
}
