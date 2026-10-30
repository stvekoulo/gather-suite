"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type IslandContextValue = {
  view: string | null;
};

const IslandContext = createContext<IslandContextValue | null>(null);

// Ressorts Apple pour l'îlot dynamique : dilatation élastique et transition douce
const SHELL_SPRING = {
  type: "spring",
  duration: 0.75,
  bounce: 0.18,
} as const;

const CONTENT_SPRING = {
  type: "spring",
  duration: 0.75,
  bounce: 0.28,
} as const;

const RADIUS = 28;
const PILL_WIDTH = 132;
const PILL_HEIGHT = 38;

// Mesure les dimensions réelles du contenu pour animer la coquille de l'îlot
function useContentSize() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ width: number; height: number } | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    setSize({ width: el.offsetWidth, height: el.offsetHeight });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => {
      setSize({ width: el.offsetWidth, height: el.offsetHeight });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [ref, size] as const;
}

function Slot({
  keyId,
  children,
  className,
}: {
  keyId: string;
  children: ReactNode;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      key={keyId}
      initial={
        reduce
          ? { opacity: 0, filter: "blur(0px)" }
          : { opacity: 0, scale: 0.92, y: -6, filter: "blur(4px)" }
      }
      animate={
        reduce
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }
      }
      exit={
        reduce
          ? { opacity: 0, filter: "blur(0px)", transition: { duration: 0.1 } }
          : {
              opacity: 0,
              scale: 0.92,
              y: -4,
              filter: "blur(0px)",
              transition: { duration: 0.1, ease: EASE_OUT },
            }
      }
      transition={reduce ? { duration: 0.15 } : CONTENT_SPRING}
      style={{ transformOrigin: "top center" }}
      className={cn("flex items-center justify-center", className)}
    >
      {children}
    </motion.div>
  );
}

export interface DynamicIslandProps {
  view: string | null;
  compact?: ReactNode;
  children?: ReactNode;
  className?: string;
  onClick?: () => void;
}

// Composant Dynamic Island animé beUI avec expansion physique et morphing
export function DynamicIsland({
  view,
  compact,
  children,
  className,
  onClick,
}: DynamicIslandProps) {
  const reduce = useReducedMotion();
  const expanded = view !== null;
  const [sizerRef, size] = useContentSize();
  const contextValue = useMemo(() => ({ view }), [view]);

  return (
    <IslandContext.Provider value={contextValue}>
      <motion.div
        role="status"
        aria-live="polite"
        initial={false}
        onClick={onClick}
        animate={
          size
            ? { width: size.width, height: size.height }
            : { width: PILL_WIDTH, height: PILL_HEIGHT }
        }
        transition={reduce ? { duration: 0 } : SHELL_SPRING}
        style={{ borderRadius: RADIUS }}
        className={cn(
          "relative inline-flex items-start justify-center overflow-hidden cursor-pointer select-none",
          "bg-zinc-900 text-white dark:bg-zinc-900 dark:text-zinc-100",
          "border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.35)] backdrop-blur-xl",
          className
        )}
      >
        <div ref={sizerRef} className="w-max">
          <AnimatePresence mode="popLayout" initial={false}>
            {!expanded && compact ? (
              <Slot
                keyId="compact"
                className="min-h-[38px] min-w-[132px] gap-2 px-3.5 py-1.5 text-xs font-medium"
              >
                {compact}
              </Slot>
            ) : null}
          </AnimatePresence>
          {children}
        </div>
      </motion.div>
    </IslandContext.Provider>
  );
}

export interface DynamicIslandViewProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export function DynamicIslandView({
  id,
  children,
  className,
}: DynamicIslandViewProps) {
  const ctx = useContext(IslandContext);
  if (!ctx) {
    throw new Error("DynamicIslandView must be used inside <DynamicIsland>");
  }
  const active = ctx.view === id;

  return (
    <AnimatePresence mode="popLayout" initial={false}>
      {active ? (
        <Slot keyId={id} className={cn("px-5 py-3.5", className)}>
          {children}
        </Slot>
      ) : null}
    </AnimatePresence>
  );
}
