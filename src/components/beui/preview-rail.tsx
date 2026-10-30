"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type MouseEvent, type PointerEvent, type ReactNode, useCallback, useId, useRef, useState } from "react";
import { EASE_OUT, SPRING_LAYOUT } from "@/lib/ease";
import { useDismiss } from "@/lib/hooks/use-dismiss";
import { useHoverGesture } from "@/lib/hooks/use-hover-gesture";
import { useTapGesture } from "@/lib/hooks/use-tap-gesture";
import { cn } from "@/lib/utils";

export interface PreviewRailItem {
  id: string;
  label: string;
  ariaLabel?: string;
  description?: ReactNode;
}

export interface PreviewRailProps {
  items: PreviewRailItem[];
  label?: string;
  orientation?: "vertical" | "horizontal";
  activeId?: string;
  defaultActiveId?: string;
  onActiveChange?: (id: string) => void;
  onItemSelect?: (item: PreviewRailItem) => void;
  renderPreview?: (item: PreviewRailItem) => ReactNode;
  showPreview?: boolean;
  highlightActive?: boolean;
  itemSize?: number;
  className?: string;
}

// Composant PreviewRail beUI animé avec ticks pyramidaux et carte de prévisualisation flottante
export function PreviewRail({
  items,
  label = "Navigation d'aperçu",
  orientation = "vertical",
  activeId,
  defaultActiveId,
  onActiveChange,
  onItemSelect,
  renderPreview,
  showPreview = true,
  highlightActive = false,
  itemSize = 24,
  className,
}: PreviewRailProps) {
  const uid = useId();
  const reduce = useReducedMotion();
  const rootRef = useRef<HTMLDivElement>(null);
  const [internalActiveId, setInternalActiveId] = useState(defaultActiveId ?? items[0]?.id ?? "");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [pinnedId, setPinnedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const tap = useTapGesture<boolean>();
  const hover = useHoverGesture();

  const clearPinned = useCallback(() => setPinnedId(null), []);
  useDismiss(pinnedId !== null, clearPinned, rootRef);

  const requestedActiveId = activeId ?? internalActiveId;
  const selectedId = items.some((item) => item.id === requestedActiveId) ? requestedActiveId : (items[0]?.id ?? "");
  const displayedId = hoveredId ?? pinnedId ?? focusedId ?? "";
  const highlightedId = displayedId || (highlightActive ? selectedId : "");
  const displayedIndex = items.findIndex((item) => item.id === highlightedId);
  const isHorizontal = orientation === "horizontal";
  const rowTemplate = items.length ? `repeat(${items.length}, ${itemSize}px)` : undefined;

  const selectItem = (id: string) => {
    if (activeId === undefined) setInternalActiveId(id);
    onActiveChange?.(id);
  };

  return (
    <motion.div
      layoutRoot
      ref={rootRef}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget)) {
          setFocusedId(null);
          setPinnedId(null);
        }
      }}
      className={cn("isolate relative flex w-full overflow-visible", isHorizontal ? "flex-col items-center justify-center min-h-36" : "min-h-48", className)}
    >
      <nav
        aria-label={label}
        onPointerLeave={(e) => { if (hover.leave(e)) setHoveredId(null); }}
        style={isHorizontal ? { gridTemplateColumns: rowTemplate } : { gridTemplateRows: rowTemplate }}
        className={cn("relative z-10 grid shrink-0", isHorizontal ? "h-10 w-fit max-w-full justify-center" : "w-10 content-center")}
      >
        {items.map((item, index) => {
          const selected = item.id === selectedId;
          const highlighted = item.id === highlightedId;
          const distance = displayedIndex < 0 ? Number.POSITIVE_INFINITY : Math.abs(index - displayedIndex);
          const scale = highlighted ? 1 : distance === 1 ? 0.68 : distance === 2 ? 0.44 : 0.25;

          return (
            <button
              key={item.id}
              type="button"
              aria-label={item.ariaLabel ?? item.label}
              aria-current={selected ? "location" : undefined}
              onPointerEnter={(e) => { if (hover.enter(e)) setHoveredId(item.id); }}
              onPointerDown={(e) => { tap.start(e, pinnedId === item.id); setFocusedId(null); }}
              onPointerCancel={() => tap.drop()}
              onKeyDown={() => tap.drop()}
              onFocus={(e) => { if (e.currentTarget.matches(":focus-visible")) setFocusedId(item.id); }}
              onClick={(e) => {
                const gesture = tap.take();
                if (gesture && gesture.pointerType !== "mouse") setPinnedId(item.id);
                selectItem(item.id);
                onItemSelect?.(item);
              }}
              style={isHorizontal ? { width: itemSize } : { height: itemSize }}
              className={cn("relative flex items-center justify-center text-icon hover:text-brand outline-none focus-visible:ring-2 focus-visible:ring-brand/40", isHorizontal ? "h-10 w-6 items-end" : "h-6 w-10")}
            >
              <motion.span
                aria-hidden="true"
                animate={isHorizontal ? { scaleY: scale } : { scaleX: scale }}
                transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
                className={cn("block bg-current rounded-full", isHorizontal ? "h-8 w-1 origin-bottom" : "h-1 w-8 origin-left", highlighted ? "text-brand" : undefined)}
              />
            </button>
          );
        })}
      </nav>

      {showPreview && (
        <div
          aria-hidden="true"
          style={isHorizontal ? { gridTemplateColumns: rowTemplate } : { gridTemplateRows: rowTemplate }}
          className={cn("pointer-events-none absolute z-50 grid", isHorizontal ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "inset-y-0 right-2 left-12 content-center")}
        >
          {items.map((item) => (
            <div key={item.id} style={isHorizontal ? { width: itemSize } : { height: itemSize }} className="relative flex items-center">
              {item.id === displayedId ? (
                <div className={cn(isHorizontal ? "absolute bottom-10 left-1/2 w-64 -translate-x-1/2" : "w-64")}>
                  <motion.div layoutId={`preview-rail-card-${uid}`} transition={reduce ? { duration: 0 } : SPRING_LAYOUT}>
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={item.id}
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 4 }}
                        animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, y: -2 }}
                        transition={{ duration: 0.16, ease: EASE_OUT }}
                        className="rounded-xl border border-hairline bg-surface p-3 shadow-lg"
                      >
                        {renderPreview ? renderPreview(item) : (
                          <div>
                            <p className="text-xs font-semibold text-fg">{item.label}</p>
                            {item.description && <p className="mt-1 text-[11px] text-fg-2">{item.description}</p>}
                          </div>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </motion.div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
