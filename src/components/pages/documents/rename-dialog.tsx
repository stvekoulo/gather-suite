"use client";
import { translate } from "@/lib/i18n/ui-text";

import { useState } from "react";
import { toast } from "sonner";
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
import type { DocumentFile } from "@/lib/types";
import { useAppStore } from "@/stores/app-store";
import { splitName } from "./doc-utils";

export function RenameDialog({ doc, onClose }: { doc: DocumentFile | null; onClose: () => void }) {
  return (
    <Dialog open={!!doc} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="gap-5 p-5 sm:max-w-[420px]">
        {doc ? <RenameForm key={doc.id} doc={doc} onDone={onClose} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function RenameForm({ doc, onDone }: { doc: DocumentFile; onDone: () => void }) {
  const updateDocument = useAppStore((s) => s.updateDocument);
  const [base, ext] = splitName(doc.name);
  const [value, setValue] = useState(base);
  const trimmed = value.trim();
  const error = !trimmed
    ? translate("Give the file a name.")
    : /[\\/:*?"<>|]/.test(trimmed)
      ? translate('Avoid \\ / : * ? " < > |')
      : null;

  return (
    <form
      className="contents"
      onSubmit={(e) => {
        e.preventDefault();
        if (error) return;
        const name = trimmed + ext;
        if (name !== doc.name) {
          updateDocument(doc.id, { name });
          toast.success(translate("Document renamed"), { description: name });
        }
        onDone();
      }}
    >
      <DialogHeader className="gap-1.5">
        <DialogTitle className="t-16">{translate("Rename document")}</DialogTitle>
        <DialogDescription className="t-14">{translate("The file type stays the same.")}</DialogDescription>
      </DialogHeader>
      <Field label={translate("Name")} htmlFor="doc-name" error={value !== base ? error : null}>
        <div className="flex items-center gap-2">
          <Input
            id="doc-name"
            value={value}
            autoFocus
            onFocus={(e) => e.currentTarget.select()}
            onChange={(e) => setValue(e.target.value)}
            aria-invalid={error ? true : undefined}
            className="max-md:h-10 max-md:text-[16px]"
          />
          {ext ? <span className="t-14 shrink-0 text-fg-2">{ext}</span> : null}
        </div>
      </Field>
      <DialogFooter className="-mx-5 -mb-5 bg-app px-5 py-3 max-sm:mb-[calc(-1*max(1.25rem,env(safe-area-inset-bottom)))] max-sm:pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <Button type="button" onClick={onDone} className="max-sm:h-10">{translate("Cancel")}
        </Button>
        <Button type="submit" variant="brand" disabled={!!error} className="max-sm:h-10">{translate("Rename")}
        </Button>
      </DialogFooter>
    </form>
  );
}
