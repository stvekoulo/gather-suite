"use client";

import * as React from "react";
import { Checkbox as BeuiCheckbox, type CheckboxProps } from "@/components/beui/checkbox";

// Ré-export du composant Checkbox beUI avec prise en charge des props standards
function Checkbox({
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
}) {
  return (
    <BeuiCheckbox
      checked={!!checked}
      onCheckedChange={(c) => onCheckedChange?.(c)}
      className={className}
      disabled={disabled}
      id={id}
      aria-label={ariaLabel}
    />
  );
}

export { Checkbox };
export type { CheckboxProps };
