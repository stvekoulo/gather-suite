"use client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";

type Option = { value: string; label: string };

/** The beUI select, for call sites that only have a value and a list of options. */
export function Dropdown({ value, defaultValue, onChange, options, placeholder, className, triggerClassName, "aria-label": ariaLabel }: {
  value?: string;
  defaultValue?: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  "aria-label"?: string;
}) {
  return (
    <Select value={value} defaultValue={defaultValue} onValueChange={onChange} className={className}>
      <SelectTrigger aria-label={ariaLabel} className={triggerClassName}>
        <SelectValue placeholder={placeholder} className="truncate" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  );
}
