"use client";
import { forwardRef, useImperativeHandle, useRef, useState, type ComponentProps } from "react";
import { FileUpload, type FileUploadItem } from "@/components/beui/file-upload";
import { useI18n } from "@/lib/i18n";

/** Shared beUI selection surface; the existing module remains responsible for processing. */
export const FilePicker = forwardRef<HTMLInputElement, ComponentProps<"input"> & { selectionOnly?: boolean }>(function FilePicker(props, ref) {
  const { onChange, accept, multiple, disabled, className, selectionOnly = false, ...rest } = props;
  const input = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => input.current!, []);
  const [items, setItems] = useState<FileUploadItem[]>([]);
  const [error, setError] = useState("");
  const { language } = useI18n(); const fr = language === "fr";
  const label = typeof props["aria-label"] === "string" ? props["aria-label"] : fr ? "Fichiers à importer" : "Select files";
  const compact = className?.includes("sr-only");
  if (props.hidden || className?.includes("hidden") || compact) {
    return (
      <input
        {...rest}
        ref={input}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={onChange}
        className="hidden"
        tabIndex={-1}
      />
    );
  }
  function process(files: File[]) {
    const unsupported = files.find((file) => accept && !accept.split(",").some((value) => {
      const rule = value.trim().toLowerCase(), name = file.name.toLowerCase();
      if (rule.startsWith(".")) return name.endsWith(rule);
      if (rule.endsWith("/*")) return file.type.startsWith(rule.slice(0, -1));
      const fallback: Record<string, string[]> = { "application/pdf": [".pdf"], "image/png": [".png"], "image/jpeg": [".jpg", ".jpeg"], "text/csv": [".csv"] };
      return file.type === rule || fallback[rule]?.some((extension) => name.endsWith(extension));
    }));
    if (unsupported) { setError(fr ? `Format non accepté : ${unsupported.name}. Formats attendus : ${accept}` : `Unsupported file: ${unsupported.name}. Expected: ${accept}`); setItems(items); return; }
    setError(""); if (!input.current) return;
    const transfer = new DataTransfer(); files.forEach((file) => transfer.items.add(file));
    input.current.files = transfer.files;
    input.current.dispatchEvent(new Event("change", { bubbles: true }));
  }
  return <div className="min-w-0 w-full" data-file-picker>
    <input {...rest} aria-label={undefined} ref={input} type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={onChange} className="hidden" tabIndex={-1} />
    <FileUpload inputLabel={label} accept={accept} multiple={multiple} disabled={disabled} value={selectionOnly ? items : []}
      onValueChange={(next) => setItems((multiple ? next : next.slice(-1)).map((item) => ({ ...item, status: "queued", progress: undefined })))}
      onFilesAdded={(added, files) => { setItems(added.map((item) => ({ ...item, status: "queued" }))); process(files); }}
      onRemove={(item) => { if (selectionOnly) process(items.filter((entry) => entry.id !== item.id).map((entry) => entry.file!).filter(Boolean)); }}
      title={label} description={fr ? `Glissez-déposez ${multiple ? "vos fichiers" : "un fichier"} ici${accept ? ` · ${accept}` : ""}` : `Drag and drop files here${accept ? ` · ${accept}` : ""}`}
      browseLabel={fr ? "Parcourir" : "Browse"}
      classNames={{ dropzone: compact ? "min-h-0 flex-wrap rounded-xl gap-2 p-2 [&>span:first-child]:size-8 [&>span:first-child>svg]:size-4" : "flex-wrap rounded-xl", queue: selectionOnly ? "max-h-40 overflow-auto" : "hidden" }} />
    {error && <p role="alert" className="mt-2 break-words text-xs text-danger">{error}</p>}
  </div>;
});
