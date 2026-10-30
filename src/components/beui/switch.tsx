"use client";

import { animate, motion, MotionConfig, useReducedMotion } from "motion/react";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const THUMB_SPRING = { type: "spring", stiffness: 800, damping: 80, mass: 4 } as const;

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
  id?: string;
  ariaLabel?: string;
  "aria-label"?: string;
  className?: string;
}

// Composant Switch animé beUI haute définition avec retour physique et contraste soigné
export function Switch({
  checked = false,
  onCheckedChange,
  disabled,
  label,
  id: idProp,
  ariaLabel,
  "aria-label": ariaLabelAttr,
  className,
}: SwitchProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const resolvedAriaLabel = ariaLabel ?? ariaLabelAttr;
  const thumbRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const [isPressed, setIsPressed] = useState(false);
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    if (!thumbRef.current || reduce) return;
    if (disabled && isPressed) {
      animate(thumbRef.current, { x: [0, -2, 2, -1, 0] }, { delay: 0.2, duration: 0.6 });
    }
  }, [disabled, isPressed, reduce]);

  const squish = !disabled && isPointer && isPressed && !reduce;

  return (
    <MotionConfig transition={reduce ? { duration: 0 } : THUMB_SPRING}>
      <span className={cn("inline-flex items-center gap-2.5", className)}>
        <motion.button
          id={id}
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={resolvedAriaLabel}
          disabled={disabled}
          onClick={() => !disabled && onCheckedChange(!checked)}
          onPointerDown={(e) => {
            setIsPressed(true);
            setIsPointer(e.type.startsWith("pointer"));
          }}
          onPointerUp={() => setIsPressed(false)}
          onPointerLeave={() => setIsPressed(false)}
          initial={false}
          data-state={checked ? "checked" : "unchecked"}
          className={cn(
            "group peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center px-0.5 rounded-full outline-none transition-all duration-200",
            "focus-visible:ring-2 focus-visible:ring-brand/40",
            "disabled:cursor-not-allowed disabled:opacity-50",
            checked
              ? "justify-end bg-brand border border-brand/90 shadow-2xs shadow-brand/20 hover:brightness-105"
              : "justify-start bg-zinc-300/90 dark:bg-zinc-700/90 border border-zinc-300 dark:border-zinc-600 hover:bg-zinc-300 dark:hover:bg-zinc-700"
          )}
        >
          <motion.div
            ref={thumbRef}
            layout
            animate={{ scale: squish ? 0.92 : 1 }}
            className="pointer-events-none block size-5 rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.22),0_1px_2px_rgba(0,0,0,0.12)] border border-black/10 dark:border-black/20"
          >
            <div className={cn("size-5", squish && (checked ? "ml-0.5" : "mr-0.5"))} />
          </motion.div>
        </motion.button>
        {label ? (
          <label htmlFor={id} className="cursor-pointer text-xs font-medium text-fg select-none">
            {label}
          </label>
        ) : null}
      </span>
    </MotionConfig>
  );
}
