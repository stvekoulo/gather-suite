import type { ReactNode } from "react";

export interface DateRange {
  from: string;
  to?: string;
}

export interface DateRangePreset {
  label: string;
  value: DateRange;
}

export interface DateRangePickerProps {
  value?: DateRange | null;
  defaultValue?: DateRange | null;
  onValueChange?: (range: DateRange | null) => void;
  defaultMonth?: string;
  min?: string;
  max?: string;
  isDateDisabled?: (date: string) => boolean;
  presets?: DateRangePreset[];
  locale?: string;
  label?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  showSummary?: boolean;
  className?: string;
  children?: ReactNode;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnSelect?: boolean;
}
