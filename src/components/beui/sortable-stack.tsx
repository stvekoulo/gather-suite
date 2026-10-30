"use client";

import { GripVertical, Undo2 } from "lucide-react";
import { type HTMLMotionProps, Reorder, useDragControls, useReducedMotion } from "motion/react";
import { createContext, useContext, useId, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { SPRING_LAYOUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

type MoveDirection = -1 | 1 | "first" | "last";
type ListContextValue = {
  ids: string[];
  labels: Map<string, string>;
  label: string;
  disabled: boolean;
  instructions: string;
  canUndo: boolean;
  reorder: (ids: string[]) => void;
  move: (id: string, direction: MoveDirection) => void;
  undo: () => void;
  beginDrag: () => void;
  finishDrag: (id: string) => void;
};
const ListContext = createContext<ListContextValue | null>(null);
const ItemContext = createContext<{ id: string; label: string; controls: ReturnType<typeof useDragControls>; dragging: boolean } | null>(null);

function useListContext(part: string) {
  const context = useContext(ListContext);
  if (!context) throw new Error(`${part} must be used within SortableStack`);
  return context;
}

export interface SortableStackProps<T extends { id: string }> {
  items?: T[];
  defaultItems?: T[];
  onItemsChange?: (items: T[]) => void;
  getItemLabel: (item: T) => string;
  children?: ReactNode | ((items: T[]) => ReactNode);
  label?: string;
  disabled?: boolean;
  showUndo?: boolean;
  className?: string;
}

// Composant SortableStack beUI avec réordonnancement animé et poignée tactile
export function SortableStack<T extends { id: string }>({
  items: controlledItems,
  defaultItems = [],
  onItemsChange,
  getItemLabel,
  children,
  label = "Éléments ordonnables",
  disabled = false,
  showUndo = true,
  className,
}: SortableStackProps<T>) {
  const [internalItems, setInternalItems] = useState(defaultItems);
  const items = controlledItems ?? internalItems;
  const ids = items.map((item) => item.id);
  const [previous, setPrevious] = useState<string[] | null>(null);
  const dragStart = useRef<string[] | null>(null);
  const instructions = useId();
  const live = useRef(items);

  useLayoutEffect(() => {
    live.current = items;
  });

  const change = (next: T[]) => {
    live.current = next;
    if (controlledItems === undefined) setInternalItems(next);
    onItemsChange?.(next);
  };

  const reorder = (nextIds: string[]) => {
    if (disabled) return;
    const byId = new Map(live.current.map((item) => [item.id, item]));
    const next = nextIds.flatMap((id) => {
      const item = byId.get(id);
      return item ? [item] : [];
    });
    if (next.length === live.current.length) change(next);
  };

  const move = (id: string, direction: MoveDirection) => {
    const current = live.current;
    const from = current.findIndex((item) => item.id === id);
    const to = direction === "first" ? 0 : direction === "last" ? current.length - 1 : from + direction;
    if (disabled || from < 0 || to < 0 || to >= current.length || from === to) return;
    const next = [...current];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    setPrevious(current.map((item) => item.id));
    change(next);
  };

  const undo = () => {
    if (disabled || !previous) return;
    reorder(previous);
    setPrevious(null);
  };

  const context: ListContextValue = {
    ids,
    labels: new Map(items.map((item) => [item.id, getItemLabel(item)])),
    label,
    disabled,
    instructions,
    canUndo: !!previous,
    reorder,
    move,
    undo,
    beginDrag: () => { dragStart.current = live.current.map((item) => item.id); },
    finishDrag: (id) => {
      const before = dragStart.current;
      dragStart.current = null;
      if (before && before.some((oldId, at) => oldId !== live.current[at]?.id)) {
        setPrevious(before);
      }
    },
  };

  return (
    <ListContext.Provider value={context}>
      <div className={cn("w-full", className)}>
        {typeof children === "function" ? children(items) : children}
        {showUndo && previous && (
          <button
            type="button"
            onClick={undo}
            className="mt-2 inline-flex items-center gap-1.5 text-xs text-fg-2 hover:text-fg"
          >
            <Undo2 className="size-3" /> Annuler le réagencement
          </button>
        )}
      </div>
    </ListContext.Provider>
  );
}

export function SortableStackGroup({ children, className }: { children: ReactNode; className?: string }) {
  const context = useListContext("SortableStackGroup");
  return (
    <Reorder.Group axis="y" values={context.ids} onReorder={context.reorder} className={cn("space-y-2", className)}>
      {children}
    </Reorder.Group>
  );
}

export function SortableStackItem({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  const context = useListContext("SortableStackItem");
  const controls = useDragControls();
  const reduce = useReducedMotion() ?? false;
  const [dragging, setDragging] = useState(false);
  const label = context.labels.get(id) ?? id;

  return (
    <ItemContext.Provider value={{ id, label, controls, dragging }}>
      <Reorder.Item
        value={id}
        dragListener={false}
        dragControls={controls}
        layout="position"
        transition={reduce ? { duration: 0 } : SPRING_LAYOUT}
        onDragStart={() => { setDragging(true); context.beginDrag(); }}
        onDragEnd={() => { setDragging(false); context.finishDrag(id); }}
        className={cn(
          "relative flex items-center gap-2.5 rounded-xl border border-hairline bg-surface p-2.5 shadow-xs transition-shadow",
          dragging && "shadow-lg ring-1 ring-brand/40 z-20",
          className
        )}
      >
        {children}
      </Reorder.Item>
    </ItemContext.Provider>
  );
}

export function SortableStackHandle({ className }: { className?: string }) {
  const context = useListContext("SortableStackHandle");
  const item = useContext(ItemContext);
  if (!item) throw new Error("SortableStackHandle must be inside SortableStackItem");

  return (
    <button
      type="button"
      disabled={context.disabled}
      onPointerDown={(e) => {
        if (!context.disabled && e.button === 0) {
          e.currentTarget.focus({ preventScroll: true });
          item.controls.start(e);
        }
      }}
      className={cn("flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg text-icon hover:bg-hover active:cursor-grabbing", className)}
      aria-label={`Déplacer ${item.label}`}
    >
      <GripVertical className="size-4" />
    </button>
  );
}
