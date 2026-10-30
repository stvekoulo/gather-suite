"use client";
import { translate } from "@/lib/i18n/ui-text";

import { ClockIcon, PencilIcon, PlayIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatShort, formatWeekday } from "@/lib/dates";
import type { TimeEntry } from "@/lib/types";
import { formatHours, projectColor } from "./shared";

export function EntriesSection({
  weekEntriesCount,
  groups,
  today,
  timerRunning,
  onOpenDialog,
  onStartTimer,
  onSaveEntry,
  onDeleteEntry,
}: {
  weekEntriesCount: number;
  groups: [string, TimeEntry[]][];
  today: string;
  timerRunning: boolean;
  onOpenDialog: (entry?: TimeEntry) => void;
  onStartTimer: (project: string, task: string) => void;
  onSaveEntry: (entry: TimeEntry) => void;
  onDeleteEntry: (id: string) => void;
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <div className="flex h-12 items-center justify-between border-b border-hairline px-4">
        <h3 className="t-14 text-fg">{translate("Entries")}</h3>
        <span className="t-12 text-fg-2">
          {weekEntriesCount} {weekEntriesCount === 1 ? "session" : "sessions"}
        </span>
      </div>
      {groups.length === 0 ? (
        <div className="flex flex-col items-center gap-3 px-4 py-14 text-center">
          <span className="flex size-10 items-center justify-center rounded-lg bg-app">
            <ClockIcon className="size-4 text-icon" />
          </span>
          <div className="flex flex-col gap-1.5">
            <p className="t-14 text-fg">{translate("No time logged this week")}</p>
            <p className="t-14 text-fg-2">{translate("Start the timer or add an entry manually.")}</p>
          </div>
          <Button onClick={() => onOpenDialog()}>
            <PlusIcon />{translate("Add entry")}
          </Button>
        </div>
      ) : (
        <>
          <ul className="md:hidden">
            {groups.map(([date, list]) => (
              <li key={date}>
                <div
                  id={`tt-mday-${date}`}
                  className="flex h-9 scroll-mt-3 items-center justify-between border-b border-subtle bg-app px-4"
                >
                  <span className="t-12">
                    <span className="text-fg">{formatWeekday(date)}</span>
                    <span className="ml-1.5 text-fg-2">
                      {formatShort(date)}
                      {date === today && ` · ${translate("Today")}`}
                    </span>
                  </span>
                  <span className="t-12 text-fg-2 tabular-nums">
                    {formatHours(list.reduce((n, e) => n + e.minutes, 0))}
                  </span>
                </div>
                <ul>
                  {list.map((e) => (
                    <li key={e.id} className="flex items-center border-b border-subtle">
                      <button
                        type="button"
                        aria-label={`Modifier ${e.task}`}
                        className="flex min-h-14 min-w-0 flex-1 items-center gap-3 py-2.5 pl-4 text-left outline-none focus-visible:bg-hover"
                        onClick={() => onOpenDialog(e)}
                      >
                        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                          <span className="t-14 truncate text-table">{e.task}</span>
                          <span className="t-12 flex min-w-0 items-center gap-1.5 text-fg-2">
                            <span
                              className="size-2 shrink-0 rounded-full"
                              style={{ background: `var(--event-${projectColor(e.project)}-fg)` }}
                            />
                            <span className="truncate">{e.project}</span>
                            <span className="shrink-0">· {e.billable ? translate("Billable") : translate("Non-billable")}</span>
                          </span>
                        </span>
                        <span className="t-14 shrink-0 text-table tabular-nums">{formatHours(e.minutes)}</span>
                      </button>
                      <EntryMenu
                        entry={e}
                        timerRunning={timerRunning}
                        onResume={() => onStartTimer(e.project, e.task)}
                        onEdit={() => onOpenDialog(e)}
                        onToggleBillable={(v) => onSaveEntry({ ...e, billable: v })}
                        onDelete={() => onDeleteEntry(e.id)}
                      />
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
          <table className="w-full table-fixed border-collapse max-md:hidden">
            <colgroup>
              <col />
              <col className="w-[200px]" />
              <col className="w-[110px]" />
              <col className="w-[100px]" />
              <col className="w-[112px]" />
            </colgroup>
            <thead>
              <tr className="h-10 bg-app text-left">
                <th className="t-14 px-4 font-medium text-fg-2">{translate("Task")}</th>
                <th className="t-14 px-2 font-medium text-fg-2">{translate("Project")}</th>
                <th className="t-14 px-2 font-medium text-fg-2">{translate("Billable")}</th>
                <th className="t-14 px-2 text-right font-medium text-fg-2">{translate("Duration")}</th>
                <th className="px-4">
                  <span className="sr-only">{translate("Actions")}</span>
                </th>
              </tr>
            </thead>
            {groups.map(([date, list]) => (
              <tbody key={date}>
                <tr id={`tt-day-${date}`} className="h-9 scroll-mt-[76px] border-y border-subtle bg-surface">
                  <th colSpan={3} className="px-4 text-left font-medium">
                    <span className="t-12 text-fg">{formatWeekday(date)}</span>
                    <span className="t-12 ml-1.5 text-fg-2">
                      {formatShort(date)}
                      {date === today && ` · ${translate("Today")}`}
                    </span>
                  </th>
                  <td className="t-12 px-2 text-right text-fg-2 tabular-nums">
                    {formatHours(list.reduce((n, e) => n + e.minutes, 0))}
                  </td>
                  <td />
                </tr>
                {list.map((e) => (
                  <tr key={e.id} className="h-14 border-b border-subtle transition-colors duration-150 hover-fine:bg-hover/50">
                    <td className="t-14 truncate px-4 text-table">{e.task}</td>
                    <td className="px-2">
                      <span className="t-14 flex min-w-0 items-center gap-2 text-table">
                        <span
                          className="size-2 shrink-0 rounded-full"
                          style={{ background: `var(--event-${projectColor(e.project)}-fg)` }}
                        />
                        <span className="truncate">{e.project}</span>
                      </span>
                    </td>
                    <td className="px-2">
                      <Switch
                        size="sm"
                        checked={e.billable}
                        aria-label={`Facturable : ${e.task}`}
                        onCheckedChange={(v) => onSaveEntry({ ...e, billable: v })}
                      />
                    </td>
                    <td className="t-14 px-2 text-right text-table tabular-nums">{formatHours(e.minutes)}</td>
                    <td className="px-4">
                      <div className="flex items-center justify-end gap-0.5">
                        <RowAction
                          label={translate("Resume timer")}
                          disabled={timerRunning}
                          onClick={() => onStartTimer(e.project, e.task)}
                        >
                          <PlayIcon />
                        </RowAction>
                        <RowAction label={translate("Edit entry")} onClick={() => onOpenDialog(e)}>
                          <PencilIcon />
                        </RowAction>
                        <RowAction label={translate("Delete entry")} onClick={() => onDeleteEntry(e.id)}>
                          <Trash2Icon />
                        </RowAction>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </>
      )}
    </section>
  );
}

function RowAction({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button variant="ghost" size="icon-sm" aria-label={label} disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function EntryMenu({
  entry,
  timerRunning,
  onResume,
  onEdit,
  onToggleBillable,
  onDelete,
}: {
  entry: TimeEntry;
  timerRunning: boolean;
  onResume: () => void;
  onEdit: () => void;
  onToggleBillable: (billable: boolean) => void;
  onDelete: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="mx-1.5 size-10 shrink-0" aria-label={`Actions pour ${entry.task}`}>
          <Icon name="more" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 [&_[role^=menuitem]]:min-h-10">
        <DropdownMenuItem disabled={timerRunning} onSelect={onResume}>
          <PlayIcon /> {translate("Resume timer")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={onEdit}>
          <PencilIcon />{translate("Edit")}
        </DropdownMenuItem>
        <DropdownMenuCheckboxItem checked={entry.billable} onCheckedChange={onToggleBillable}>{translate("Billable")}
        </DropdownMenuCheckboxItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={onDelete}>
          <Trash2Icon />{translate("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
