"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useTheme } from "next-themes";
import { useMemo, useSyncExternalStore } from "react";
import { CheckIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/beui/switch";
import { formatTime } from "@/lib/dates";
import { computeLeaveStats, formatDays } from "@/lib/leave";
import type { Settings } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useToday } from "@/hooks/use-today";
import { useAppStore } from "@/stores/app-store";
import {
  Panel,
  Row,
  Stepper,
  ThemePreview,
  TOUCH_CONTROL,
  useSettings,
} from "./settings-shared";

const noopSubscribe = () => () => {};

export function GeneralTab() {
  const [settings, set] = useSettings();
  const tr = (k: string) => translate(k, settings.language);
  return (
    <Panel title={tr("General")} description={tr("How dates and times appear across your calendar.")}>
      <Row title={tr("Week starts on")} description={tr("First column in week and month views")} htmlFor="st-week" stack>
        <Select
          value={String(settings.weekStartsOn)}
          onValueChange={(v) => set("weekStartsOn", Number(v) as 0 | 1)}
        >
          <SelectTrigger id="st-week" className={cn("w-40", TOUCH_CONTROL)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">{tr("Sunday")}</SelectItem>
            <SelectItem value="1">{tr("Monday")}</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row title={tr("Time format")} description={tr("Used for events, requests and time entries")} htmlFor="st-time" stack>
        <Select value={settings.timeFormat} onValueChange={(v) => set("timeFormat", v as Settings["timeFormat"])}>
          <SelectTrigger id="st-time" className={cn("w-40", TOUCH_CONTROL)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="24h">{tr("24-hour · 14:30")}</SelectItem>
            <SelectItem value="12h">{tr("12-hour · 2:30 PM")}</SelectItem>
          </SelectContent>
        </Select>
      </Row>
      <Row title={tr("Calendar day starts at")} description={tr("Day and week views scroll to this hour")} htmlFor="st-start" stack>
        <Select value={String(settings.dayStartHour)} onValueChange={(v) => set("dayStartHour", Number(v))}>
          <SelectTrigger id="st-start" className={cn("w-40", TOUCH_CONTROL)}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {Array.from({ length: 13 }, (_, h) => (
              <SelectItem key={h} value={String(h)}>
                {formatTime(h * 60, settings.timeFormat)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Row>
      <Row title={tr("Show weekends")} description={tr("Hide Saturday and Sunday to focus on the work week")} htmlFor="st-weekends">
        <Switch id="st-weekends" checked={settings.showWeekends} onCheckedChange={(v) => set("showWeekends", v)} />
      </Row>
    </Panel>
  );
}

export function TimeOffTab() {
  const [settings, set] = useSettings();
  const tr = (k: string) => translate(k, settings.language);
  const today = useToday();
  const requests = useAppStore((s) => s.requests);
  const holidays = useAppStore((s) => s.holidays);
  const stats = useMemo(
    () => computeLeaveStats({ requests, settings, holidays }, today),
    [requests, settings, holidays, today],
  );
  const total = settings.contractDays + settings.carryoverDays;

  return (
    <div className="grid gap-4">
      <Panel title={tr("Time off")} description={tr("Your yearly allowance. Balances everywhere update instantly.")}>
        <Row title={tr("Contract days")} description={tr("Paid days off per calendar year (0–60)")} htmlFor="st-contract" stack>
          <Stepper
            id="st-contract"
            label={tr("contract days")}
            value={settings.contractDays}
            min={0}
            max={60}
            onChange={(v) => set("contractDays", v)}
          />
        </Row>
        <Row title={tr("Carryover days")} description={tr("Unused days brought over from last year (0–30)")} htmlFor="st-carryover" stack>
          <Stepper
            id="st-carryover"
            label={tr("carryover days")}
            value={settings.carryoverDays}
            min={0}
            max={30}
            onChange={(v) => set("carryoverDays", v)}
          />
        </Row>
      </Panel>
    </div>
  );
}

export function NotificationsTab() {
  const [settings, set] = useSettings();
  const tr = (k: string) => translate(k, settings.language);
  const email = useAppStore((s) => s.profile.email);
  const emailDesc =
    settings.language === "en"
      ? `Approvals, declines and reminders to ${email || "your email address"}`
      : `Approbations, refus et rappels à ${email || "votre adresse e-mail"}`;
  return (
    <Panel title={tr("Notifications")} description={tr("Choose how you hear about approvals and reminders.")}>
      <Row title={tr("Email")} description={emailDesc} htmlFor="st-email">
        <Switch
          id="st-email"
          checked={settings.emailNotifications}
          onCheckedChange={(v) => set("emailNotifications", v)}
        />
      </Row>
      <Row title={tr("Push")} description={tr("Instant alerts in this browser")} htmlFor="st-push">
        <Switch id="st-push" checked={settings.pushNotifications} onCheckedChange={(v) => set("pushNotifications", v)} />
      </Row>
      <Row title={tr("Weekly digest")} description={tr("A Monday summary of your week ahead and leave balance")} htmlFor="st-digest">
        <Switch id="st-digest" checked={settings.weeklyDigest} onCheckedChange={(v) => set("weeklyDigest", v)} />
      </Row>
    </Panel>
  );
}

export function AppearanceTab() {
  const { resolvedTheme, setTheme } = useTheme();
  const language = useAppStore((s) => s.settings.language);
  const tr = (k: string) => translate(k, language);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const current = mounted ? (resolvedTheme === "dark" ? "dark" : "light") : null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-2 px-1">
        <h3 className="t-16 text-fg">{tr("Appearance")}</h3>
        <p className="t-14 text-fg-2">{tr("Pick a theme for this browser. You can also toggle it from the sidebar.")}</p>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:gap-4" role="radiogroup" aria-label={tr("Theme")}>
        {(["light", "dark"] as const).map((t) => {
          const active = current === t;
          return (
            <button
              key={t}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setTheme(t)}
              className={cn(
                "press grid gap-3 rounded-xl border bg-surface p-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                active ? "border-brand ring-1 ring-brand" : "border-hairline hover-fine:border-segment",
              )}
            >
              <ThemePreview theme={t} />
              <span className="flex items-center gap-2 px-0.5">
                <span className="t-14 flex-1 text-fg">{tr(t === "light" ? "Light" : "Dark")}</span>
                <span
                  className={cn(
                    "flex size-4 items-center justify-center rounded-full border transition-colors duration-150",
                    active ? "border-brand bg-brand text-white" : "border-control",
                  )}
                >
                  {active ? <CheckIcon className="size-2.5" strokeWidth={3} /> : null}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

