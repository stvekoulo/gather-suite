export type WheelPickerOption = string | { label: string; value: string };

export interface WheelPickerProps {
  options: WheelPickerOption[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  visibleCount?: number;
  itemHeight?: number;
  disabled?: boolean;
  sound?: boolean;
  className?: string;
  "aria-label"?: string;
}

export function optionValue(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.value;
}

export function optionLabel(option: WheelPickerOption) {
  return typeof option === "string" ? option : option.label;
}
