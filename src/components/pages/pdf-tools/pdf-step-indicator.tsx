"use client";

import { CheckIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StepItem {
  id: number;
  title: string;
  subtitle: string;
}

interface PdfStepIndicatorProps {
  steps: StepItem[];
  currentStep: number;
  completedSteps: number[];
}

// 3-step interactive indicator with state badges
export function PdfStepIndicator({ steps, currentStep, completedSteps }: PdfStepIndicatorProps) {
  return (
    <div className="flex w-full items-center justify-between gap-2 border-b border-hairline pb-4">
      {steps.map((step, idx) => {
        const isCompleted = completedSteps.includes(step.id);
        const isCurrent = currentStep === step.id;
        const isLocked = !isCompleted && !isCurrent;

        return (
          <div key={step.id} className="flex flex-1 items-center gap-2">
            <div
              className={cn(
                "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all",
                isCompleted
                  ? "bg-emerald-600 text-white shadow-xs"
                  : isCurrent
                  ? "bg-brand text-white shadow-xs ring-2 ring-brand/20"
                  : "bg-surface-2 text-fg-2 border border-hairline"
              )}
            >
              {isCompleted ? <CheckIcon className="size-3.5 stroke-[2.5]" /> : step.id}
            </div>

            <div className="flex flex-col overflow-hidden text-left">
              <span
                className={cn(
                  "truncate text-xs font-semibold",
                  isCurrent ? "text-fg" : isCompleted ? "text-emerald-600 dark:text-emerald-400" : "text-fg-2"
                )}
              >
                {step.title}
              </span>
              <span className="truncate text-[11px] text-fg-2">
                {isCompleted ? "Terminé" : isCurrent ? "En cours" : "En attente"}
              </span>
            </div>

            {idx < steps.length - 1 && (
              <div
                className={cn(
                  "hidden h-0.5 flex-1 rounded-full transition-colors md:block",
                  isCompleted ? "bg-emerald-500/60" : "bg-hairline"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
