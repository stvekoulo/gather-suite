"use client";

import { useState } from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { Card } from "@/components/pages/shared/page-chrome";

export const TOUCH_CONTROL = "max-md:h-10!";

export function useSettings() {
  const settings = useAppStore((s) => s.settings);
  const updateSettings = useAppStore((s) => s.updateSettings);
  const set = <K extends keyof Settings>(key: K, value: Settings[K]) =>
    updateSettings({ [key]: value } as Partial<Settings>);
  return [settings, set] as const;
}

export function Panel({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-2 px-1">
        <h3 className="t-16 text-fg">{title}</h3>
        <p className="t-14 text-fg-2">{description}</p>
      </div>
      <Card className="divide-y divide-subtle">{children}</Card>
    </div>
  );
}

export function Row({
  title,
  description,
  htmlFor,
  stack = false,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  htmlFor?: string;
  stack?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-h-[68px] items-center gap-4 px-4 py-3 sm:gap-6",
        stack && "max-sm:flex-col max-sm:items-stretch max-sm:gap-3 max-sm:py-3.5",
      )}
    >
      <div className="grid min-w-0 flex-1 gap-1.5">
        <label htmlFor={htmlFor} className="t-14 text-fg">
          {title}
        </label>
        {description ? <p className="t-12 leading-[1.4] text-fg-2">{description}</p> : null}
      </div>
      <div className={cn("flex shrink-0 items-center gap-2", stack && "max-sm:*:flex-1")}>{children}</div>
    </div>
  );
}

export function Stepper({
  id,
  value,
  min,
  max,
  onChange,
  label,
}: {
  id: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
  label: string;
}) {
  // Local text only while typing; otherwise the store value is shown.
  const [text, setText] = useState<string | null>(null);
  const commit = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v))));
  const invalid =
    text !== null && (text.trim() === "" || Number.isNaN(Number(text)) || Number(text) < min || Number(text) > max);

  return (
    <div className="flex items-center gap-1 max-sm:w-full">
      <Button
        size="icon"
        className="max-md:size-10"
        aria-label={`Decrease ${label}`}
        disabled={value <= min}
        onClick={() => commit(value - 1)}
      >
        <MinusIcon className="text-icon" />
      </Button>
      <Input
        id={id}
        inputMode="numeric"
        className="h-[30px] w-14 text-center tabular-nums max-md:h-10 max-md:text-[16px] max-sm:flex-1"
        value={text ?? String(value)}
        aria-invalid={invalid || undefined}
        onChange={(e) => {
          const t = e.target.value.replace(/[^\d]/g, "");
          setText(t);
          const n = Number(t);
          if (t !== "" && n >= min && n <= max) onChange(n);
        }}
        onBlur={() => setText(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowUp") {
            e.preventDefault();
            commit(value + 1);
            setText(null);
          } else if (e.key === "ArrowDown") {
            e.preventDefault();
            commit(value - 1);
            setText(null);
          }
        }}
      />
      <Button
        size="icon"
        className="max-md:size-10"
        aria-label={`Increase ${label}`}
        disabled={value >= max}
        onClick={() => commit(value + 1)}
      >
        <PlusIcon className="text-icon" />
      </Button>
    </div>
  );
}

// Local preview tokens so both light and dark cards render their true palette.
const PREVIEW_TOKENS: Record<"light" | "dark", React.CSSProperties> = {
  light: {
    "--bg-app": "#f8f8f8",
    "--bg-surface": "#ffffff",
    "--bg-selected": "#eaeae6",
    "--bg-hover": "#f1f1ee",
    "--border-hairline": "#e5e7e1",
    "--text-primary": "#1d1d1d",
    "--event-green-bg": "#bde7db",
    "--event-purple-bg": "#e3daf7",
    "--event-blue-bg": "#c5e2f9",
  } as React.CSSProperties,
  dark: {
    "--bg-app": "#121212",
    "--bg-surface": "#181818",
    "--bg-selected": "#262624",
    "--bg-hover": "#232321",
    "--border-hairline": "#2a2a28",
    "--text-primary": "#ededed",
    "--event-green-bg": "#123d31",
    "--event-purple-bg": "#2d2547",
    "--event-blue-bg": "#17324a",
  } as React.CSSProperties,
};

export function ThemePreview({ theme }: { theme: "light" | "dark" }) {
  return (
    <div style={PREVIEW_TOKENS[theme]} className="flex h-24 overflow-hidden rounded-lg border border-hairline bg-app" aria-hidden>
      <div className="flex w-1/3 flex-col gap-1.5 border-r border-hairline p-2">
        <span className="h-1.5 w-3/4 rounded-full bg-selected" />
        <span className="h-1.5 w-1/2 rounded-full bg-hover" />
        <span className="h-1.5 w-2/3 rounded-full bg-hover" />
      </div>
      <div className="flex flex-1 flex-col gap-1.5 bg-surface p-2">
        <span className="h-1.5 w-1/2 rounded-full bg-[var(--text-primary)] opacity-80" />
        <div className="mt-1 grid flex-1 grid-cols-3 gap-1">
          <span className="rounded-[4px] bg-[var(--event-green-bg)]" />
          <span className="rounded-[4px] bg-[var(--event-purple-bg)]" />
          <span className="rounded-[4px] bg-[var(--event-blue-bg)]" />
        </div>
      </div>
    </div>
  );
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function selectCountsLabel(s: ReturnType<typeof useAppStore.getState>) {
  const parts = [
    [s.events.length, "event", "events"],
    [s.requests.length, "request", "requests"],
    [s.documents.length, "document", "documents"],
    [s.timeEntries.length, "time entry", "time entries"],
    [s.invoices.length, "invoice", "invoices"],
  ] as const;
  return `Download ${parts.map(([n, one, many]) => `${n} ${n === 1 ? one : many}`).join(", ")} as JSON`;
}
