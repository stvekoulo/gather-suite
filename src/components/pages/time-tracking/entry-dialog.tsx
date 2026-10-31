"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { WheelDatePicker } from "@/components/beui/wheel-date-picker";
import { Field } from "@/components/dialogs/field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/beui/switch";
import type { TimeEntry } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { toast } from "sonner";
import { formatHours } from "./shared";

type Props = {
  open: boolean;
  session: number;
  onClose: () => void;
  entry?: TimeEntry;
  defaultDate: string;
  projects: string[];
};

export function EntryDialog({ open, session, onClose, entry, defaultDate, projects }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-5 p-5 max-sm:pb-0 sm:max-w-[440px]">
        <EntryForm key={session} entry={entry} defaultDate={defaultDate} projects={projects} onDone={onClose} />
      </DialogContent>
    </Dialog>
  );
}

function EntryForm({
  entry,
  defaultDate,
  projects,
  onDone,
}: {
  entry?: TimeEntry;
  defaultDate: string;
  projects: string[];
  onDone: () => void;
}) {
  const saveTimeEntry = useAppStore((s) => s.saveTimeEntry);
  const [date, setDate] = useState(entry?.date ?? defaultDate);
  const [project, setProject] = useState(entry?.project ?? projects[0] ?? "");
  const [task, setTask] = useState(entry?.task ?? "");
  const [hours, setHours] = useState(String(entry ? Math.floor(entry.minutes / 60) : 1));
  const [minutes, setMinutes] = useState(String(entry ? entry.minutes % 60 : 0));
  const [billable, setBillable] = useState(entry?.billable ?? true);

  const total = (Number(hours) || 0) * 60 + (Number(minutes) || 0);
  const error =
    total <= 0 ? "Enregistrez au moins une minute." : total > 24 * 60 ? "Une session ne peut pas dépasser 24 heures." : null;

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        if (error || !date || !project.trim() || !task.trim()) return;
        saveTimeEntry({ id: entry?.id, date, project: project.trim(), task: task.trim(), minutes: total, billable });
        toast.success(entry ? translate("Entry updated") : translate("Time logged"), {
          description: `${formatHours(total)} · ${project.trim()}`,
        });
        onDone();
      }}
    >
      <DialogHeader className="gap-1.5">
        <DialogTitle className="t-16">{entry ? translate("Edit entry") : translate("Add time entry")}</DialogTitle>
        <DialogDescription className="t-14">
          {entry ? "Modifiez les détails de cette session." : "Enregistrez du temps que vous n'avez pas chronométré."}
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-3">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-fg">Date</span>
            <WheelDatePicker id="te-date" value={date} onChange={setDate} />
          </div>
          <Field label={translate("Project")} htmlFor="te-project">
            <Input
              id="te-project"
              required
              list="te-projects"
              placeholder={translate("Project")}
              value={project}
              onChange={(e) => setProject(e.target.value)}
            />
            <datalist id="te-projects">
              {projects.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </Field>
        </div>
        <Field label={translate("Task")} htmlFor="te-task">
          <Input
            id="te-task"
            required
            autoFocus={!entry}
            placeholder={translate("Sur quoi avez-vous travaillé ?")}
            value={task}
            onChange={(e) => setTask(e.target.value)}
          />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label={translate("Hours")} htmlFor="te-hours">
            <Input
              id="te-hours"
              type="number"
              inputMode="numeric"
              min={0}
              max={24}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
            />
          </Field>
          <Field label={translate("Minutes")} htmlFor="te-minutes">
            <Input
              id="te-minutes"
              type="number"
              inputMode="numeric"
              min={0}
              max={59}
              step={5}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
            />
          </Field>
        </div>
        <label className="flex items-center justify-between gap-3 rounded-lg border border-control bg-app px-3 py-2.5">
          <span className="grid gap-1">
            <span className="t-14 text-fg">{translate("Billable")}</span>
            <span className="t-12 text-fg-2">{translate("Pris en compte dans les factures client")}</span>
          </span>
          <Switch checked={billable} onCheckedChange={setBillable} />
        </label>
        {error && total !== 0 ? (
          <p className="t-12 text-danger" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <DialogFooter className="-mx-5 -mb-5 bg-app px-5 py-3 max-sm:mb-0 max-sm:pb-[max(12px,env(safe-area-inset-bottom))] max-sm:[&_button]:h-10">
        <Button type="button" onClick={onDone}>{translate("Cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={!!error}>
          {entry ? translate("Save changes") : `Enregistrer ${error ? "le temps" : formatHours(total)}`}
        </Button>
      </DialogFooter>
    </form>
  );
}
