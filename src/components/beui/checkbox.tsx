"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId } from "react";
import { EASE_OUT, SPRING_PRESS } from "@/lib/ease";
import { cn } from "@/lib/utils";

const CHECK_PATH = "M5 13l4 4L19 7";
const INDETERMINATE_PATH = "M6 12h12";

export interface CheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  indeterminate?: boolean;
  label?: string;
  description?: string;
  className?: string;
  id?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

// Composant Checkbox animé beUI avec tracé progressif et ressort
export function Checkbox({
  checked,
  onCheckedChange,
  disabled,
  indeterminate,
  label,
  description,
  className,
  id: idProp,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
}: CheckboxProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const reduce = useReducedMotion();
  const showMark = checked || indeterminate;
  const path = indeterminate ? INDETERMINATE_PATH : CHECK_PATH;
  const descriptionId = description ? `${id}-description` : undefined;
  const labelId = description && label && !ariaLabel ? `${id}-label` : undefined;
  const describedBy = [ariaDescribedBy, descriptionId].filter(Boolean).join(" ") || undefined;

  return (
    <label
      htmlFor={id}
      className={cn(
        "inline-flex gap-2.5",
        description ? "items-start" : "items-center",
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer",
        className
      )}
    >
      <motion.button
        id={id}
        type="button"
        role="checkbox"
        aria-checked={indeterminate ? "mixed" : checked}
        aria-label={ariaLabel}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        disabled={disabled}
        onClick={() => !disabled && onCheckedChange(!checked)}
        whileTap={reduce || disabled ? undefined : { scale: 0.92 }}
        transition={SPRING_PRESS}
        data-state={checked ? "checked" : indeterminate ? "indeterminate" : "unchecked"}
        className={cn(
          "inline-flex size-4.5 shrink-0 items-center justify-center rounded-md border transition-colors duration-150 outline-none",
          "focus-visible:ring-2 focus-visible:ring-brand/40",
          showMark
            ? "border-brand bg-brand text-white"
            : "border-control bg-surface hover:border-fg-2/60"
        )}
      >
        <AnimatePresence initial={false}>
          {showMark ? (
            <motion.svg
              key={indeterminate ? "indeterminate" : "checked"}
              width="11"
              height="11"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={reduce ? { opacity: 1 } : { opacity: 0, scale: 0.5 }}
              animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              transition={reduce ? { duration: 0 } : { duration: 0.16, ease: EASE_OUT }}
              aria-hidden
            >
              <title>{indeterminate ? "Partially selected" : "Selected"}</title>
              <motion.path
                d={path}
                initial={reduce ? { pathLength: 1 } : { pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={reduce ? { duration: 0 } : { duration: 0.24, ease: EASE_OUT, delay: 0.02 }}
              />
            </motion.svg>
          ) : null}
        </AnimatePresence>
      </motion.button>
      {label || description ? (
        <span className={cn("flex min-w-0 flex-col gap-0.5 select-none", disabled && "opacity-60")}>
          {label && <span id={labelId} className={cn("text-xs font-medium text-fg", description && "leading-4")}>{label}</span>}
          {description && <span id={descriptionId} className="text-[11px] text-fg-2">{description}</span>}
        </span>
      ) : null}
    </label>
  );
}
