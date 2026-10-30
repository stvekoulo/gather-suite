"use client";

import { MoreHorizontal, X } from "lucide-react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Transition,
  type Variants,
} from "motion/react";
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { EASE_OUT } from "@/lib/ease";
import { useHoverCapable } from "@/lib/hooks/use-hover-capable";
import { cn } from "@/lib/utils";

export type OverflowActionsSize = "sm" | "md";

export type OverflowActionItem = {
  id: string;
  label: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export interface OverflowActionsProps {
  primaryActions: OverflowActionItem[];
  overflowActions: OverflowActionItem[];
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  onAction?: (item: OverflowActionItem) => void;
  collapseOnAction?: boolean;
  size?: OverflowActionsSize;
  openLabel?: string;
  closeLabel?: string;
  className?: string;
}

const SHELL_TRANSITION: Transition = {
  type: "spring",
  stiffness: 220,
  damping: 17,
  mass: 0.85,
};

const ICON_VARIANTS: Variants = {
  hidden: { opacity: 0, filter: "blur(3px)" },
  visible: { opacity: 1, filter: "blur(0px)", transition: { duration: 0.18, ease: EASE_OUT } },
  exit: { opacity: 0, filter: "blur(3px)", transition: { duration: 0.18, ease: EASE_OUT } },
};

const OVERFLOW_ACTION_VARIANTS: Variants = {
  hidden: { opacity: 0, filter: "blur(4px)" },
  visible: { opacity: 1, filter: "blur(0px)" },
  exit: { opacity: 0, filter: "blur(4px)" },
};

export function OverflowActions({
  primaryActions,
  overflowActions,
  expanded,
  defaultExpanded = false,
  onExpandedChange,
  onAction,
  collapseOnAction = false,
  size = "sm",
  openLabel = "Plus d'actions",
  closeLabel = "Masquer",
  className,
}: OverflowActionsProps) {
  const reduce = useReducedMotion();
  const canHover = useHoverCapable();
  const overflowId = useId();
  const overflowWrapperRef = useRef<HTMLDivElement>(null);
  const overflowWrapperLeftRef = useRef(0);
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const isExpanded = expanded !== undefined ? expanded : internalExpanded;

  const setIsExpanded = useCallback(
    (next: boolean) => {
      if (expanded === undefined) setInternalExpanded(next);
      onExpandedChange?.(next);
    },
    [expanded, onExpandedChange]
  );

  const transition = reduce ? { duration: 0 } : SHELL_TRANSITION;

  useLayoutEffect(() => {
    const node = overflowWrapperRef.current;
    if (!node) return;
    if (!isExpanded) {
      node.style.left = `${overflowWrapperLeftRef.current - node.getBoundingClientRect().left}px`;
      return;
    }
    node.style.left = "";
    overflowWrapperLeftRef.current = node.getBoundingClientRect().left;
  }, [isExpanded]);

  const handleAction = (item: OverflowActionItem) => {
    item.onClick?.();
    onAction?.(item);
    if (collapseOnAction) setIsExpanded(false);
  };

  return (
    <motion.div layout transition={transition} className={cn("inline-flex", className)}>
      <motion.div
        layout
        transition={transition}
        className={cn(
          "relative inline-flex items-center overflow-hidden rounded-full border border-hairline bg-surface p-1 shadow-xs",
          size === "sm" ? "gap-1 text-xs" : "gap-1.5 text-sm"
        )}
      >
        <motion.div layout transition={transition} className="inline-flex items-center gap-1">
          {primaryActions.map((item) => (
            <ActionButton
              key={item.id}
              item={item}
              size={size}
              reduce={reduce}
              canHover={canHover}
              onAction={handleAction}
              layoutTransition={transition}
            />
          ))}
        </motion.div>

        <AnimatePresence mode="popLayout" initial={false}>
          {isExpanded ? (
            <motion.div
              key="overflow-actions"
              ref={overflowWrapperRef}
              id={overflowId}
              layout
              aria-hidden={!isExpanded}
              transition={transition}
              className="relative inline-flex w-max items-center gap-1"
            >
              {overflowActions.map((item) => (
                <ActionButton
                  key={item.id}
                  item={item}
                  size={size}
                  reduce={reduce}
                  canHover={canHover}
                  overflow
                  visible={isExpanded}
                  variants={OVERFLOW_ACTION_VARIANTS}
                  onAction={handleAction}
                  layoutTransition={transition}
                />
              ))}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <motion.button
          type="button"
          layout
          aria-expanded={isExpanded}
          aria-controls={isExpanded ? overflowId : undefined}
          aria-label={isExpanded ? closeLabel : openLabel}
          title={isExpanded ? closeLabel : openLabel}
          onClick={() => setIsExpanded(!isExpanded)}
          whileTap={reduce ? undefined : { scale: 0.96 }}
          whileHover={reduce || !canHover ? undefined : { scale: 1.03 }}
          transition={transition}
          className="relative inline-grid size-7 shrink-0 place-items-center rounded-full bg-brand text-white outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <AnimatePresence mode="popLayout" initial={false}>
            <motion.span
              key={isExpanded ? "close" : "open"}
              variants={ICON_VARIANTS}
              initial={reduce ? { opacity: 0 } : "hidden"}
              animate={reduce ? { opacity: 1 } : "visible"}
              exit={reduce ? { opacity: 0 } : "exit"}
              className="inline-grid place-items-center"
            >
              {isExpanded ? <X className="size-3.5" /> : <MoreHorizontal className="size-3.5" />}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

function ActionButton({
  item,
  size,
  reduce,
  canHover,
  overflow,
  visible = true,
  variants,
  onAction,
  layoutTransition,
}: {
  item: OverflowActionItem;
  size: OverflowActionsSize;
  reduce: boolean | null;
  canHover: boolean;
  overflow?: boolean;
  visible?: boolean;
  variants?: Variants;
  onAction: (item: OverflowActionItem) => void;
  layoutTransition: Transition;
}) {
  return (
    <motion.span
      layout="position"
      variants={variants}
      initial={variants ? (reduce ? { opacity: 0 } : "hidden") : undefined}
      animate={variants ? (reduce ? { opacity: 1 } : "visible") : undefined}
      exit={variants ? (reduce ? { opacity: 0 } : "exit") : undefined}
      whileTap={reduce || item.disabled ? undefined : { scale: 0.97 }}
      whileHover={reduce || !canHover || item.disabled ? undefined : { scale: 1.02 }}
      transition={layoutTransition}
      className="inline-flex shrink-0"
    >
      <button
        type="button"
        disabled={item.disabled}
        aria-label={item.ariaLabel}
        tabIndex={overflow && !visible ? -1 : undefined}
        onClick={() => onAction(item)}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full bg-surface-2 px-2.5 font-medium text-fg outline-none transition-colors hover:bg-hover focus-visible:ring-2 focus-visible:ring-brand/40",
          size === "sm" ? "h-7 text-xs" : "h-8 text-xs",
          "disabled:pointer-events-none disabled:opacity-40"
        )}
      >
        {item.icon && <span className="inline-flex size-3.5 shrink-0 items-center justify-center">{item.icon}</span>}
        <span className="whitespace-nowrap">{item.label}</span>
      </button>
    </motion.span>
  );
}
