"use client";

import * as React from "react";
import { Switch as BeuiSwitch, type SwitchProps } from "@/components/beui/switch";

// Ré-export du composant Switch beUI avec prise en charge des props UI
function Switch({
  checked = false,
  onCheckedChange,
  className,
  disabled,
  id,
  "aria-label": ariaLabel,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  className?: string;
  disabled?: boolean;
  id?: string;
  "aria-label"?: string;
  size?: "sm" | "default";
}) {
  return (
    <BeuiSwitch
      checked={!!checked}
      onCheckedChange={(c) => onCheckedChange?.(c)}
      className={className}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
    />
  );
}

export { Switch };
export type { SwitchProps };
