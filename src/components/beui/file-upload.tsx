"use client";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
import { UploadCloud } from "lucide-react";
import { useCallback, useId, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { type FileUploadProps, type FileUploadItem, useControllableUpload, createFileUploadItem, FAST_TRANSITION } from "./file-upload-shared";
import { FileUploadRow } from "./file-upload-row";
export type { FileUploadItem, FileUploadProps } from "./file-upload-shared";
export function FileUpload({
  inputLabel = "Fichiers à importer",
  value,
  defaultValue,
  onValueChange,
  onFilesAdded,
  onRemove,
  onRetry,
  accept,
  multiple = true,
  maxFiles,
  disabled = false,
  variant = "default",
  title = "Drop files here",
  description = "Add files to the upload queue",
  browseLabel = "Browse",
  className,
  classNames,
}: FileUploadProps) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const dragDepthRef = useRef(0);
  const reduce = useReducedMotion() ?? false;
  const [items, setItems] = useControllableUpload({
    value,
    defaultValue,
    onValueChange,
  });
  const [dragging, setDragging] = useState(false);

  const commit = useCallback(
    (next: FileUploadItem[]) => {
      setItems(next);
    },
    [setItems],
  );

  const addFiles = useCallback(
    (incomingFiles: File[]) => {
      if (disabled || incomingFiles.length === 0) return;

      const remainingSlots =
        maxFiles === undefined ? incomingFiles.length : maxFiles - items.length;
      if (remainingSlots <= 0) return;

      const files = incomingFiles.slice(
        0,
        multiple ? remainingSlots : Math.min(1, remainingSlots),
      );
      const added = files.map((file, index) => createFileUploadItem(file, index));

      if (added.length === 0) return;

      commit([...items, ...added]);
      onFilesAdded?.(added, files);
    },
    [commit, disabled, items, maxFiles, multiple, onFilesAdded],
  );

  const removeItem = useCallback(
    (item: FileUploadItem) => {
      commit(items.filter((entry) => entry.id !== item.id));
      onRemove?.(item);
    },
    [commit, items, onRemove],
  );

  const retryItem = useCallback(
    (item: FileUploadItem) => {
      const retryingItem = {
        ...item,
        error: undefined,
        progress: 0,
        status: "uploading" as const,
      };

      commit(
        items.map((entry) => (entry.id === item.id ? retryingItem : entry)),
      );
      onRetry?.(retryingItem);
    },
    [commit, items, onRetry],
  );

  const resetDrag = useCallback(() => {
    dragDepthRef.current = 0;
    setDragging(false);
  }, []);

  const maxReached = maxFiles !== undefined && items.length >= maxFiles;
  const centered = variant === "centered";

  return (
    <div className={cn("w-full space-y-3", className, classNames?.root)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        aria-label={inputLabel}
        accept={accept}
        multiple={multiple}
        disabled={disabled || maxReached}
        tabIndex={-1}
        className="sr-only"
        onChange={(event) => {
          addFiles(Array.from(event.currentTarget.files ?? []));
          event.currentTarget.value = "";
        }}
      />

      <button
        type="button"
        disabled={disabled || maxReached}
        data-dragging={dragging}
        onClick={() => inputRef.current?.click()}
        onDragEnter={(event) => {
          if (disabled || maxReached) return;
          event.preventDefault();
          dragDepthRef.current += 1;
          setDragging(true);
        }}
        onDragOver={(event) => {
          if (disabled || maxReached) return;
          event.preventDefault();
          event.dataTransfer.dropEffect = "copy";
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (disabled || maxReached) return;
          event.preventDefault();
          dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
          if (dragDepthRef.current === 0) setDragging(false);
        }}
        onDrop={(event) => {
          if (disabled || maxReached) return;
          event.preventDefault();
          resetDrag();
          addFiles(Array.from(event.dataTransfer.files));
        }}
        className={cn(
          "group relative flex w-full overflow-hidden rounded-3xl border border-dashed border-border bg-background outline-none",
          "transition-[border-color,transform] duration-200 active:scale-[0.99]",
          "hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "data-[dragging=true]:border-foreground",
          "disabled:pointer-events-none disabled:opacity-55",
          centered
            ? "min-h-56 flex-col items-center justify-center gap-3 p-7 text-center"
            : "items-center gap-4 p-5 text-left",
          classNames?.dropzone,
        )}
      >
        <motion.span
          aria-hidden="true"
          className={cn(
            "grid shrink-0 place-items-center bg-muted text-foreground",
            centered
              ? "h-16 w-16 rounded-[1.35rem] border border-border"
              : "h-14 w-14 rounded-[1.25rem]",
          )}
          animate={
            reduce
              ? undefined
              : {
                  transform: dragging
                    ? "translateY(-2px)"
                    : "translateY(0px)",
                }
          }
          transition={FAST_TRANSITION}
        >
          <UploadCloud className={centered ? "h-7 w-7" : "h-6 w-6"} />
        </motion.span>

        <span className={cn("min-w-0", centered ? "max-w-xs" : "flex-1")}>
          <span
            className={cn(
              "block font-semibold text-foreground",
              centered ? "text-base" : "text-sm",
            )}
          >
            {maxReached ? "Limite de fichiers atteinte" : title}
          </span>
          <span
            className={cn(
              "block text-xs text-muted-foreground",
              centered ? "mt-1 leading-5" : "mt-0.5",
            )}
          >
            {maxReached
              ? `${items.length} / ${maxFiles} fichiers sélectionnés`
              : description}
          </span>
        </span>

        <span
          className={cn(
            "shrink-0 rounded-full border border-border text-xs font-medium text-foreground transition-colors duration-150 group-hover:bg-muted",
            centered ? "mt-1 px-4 py-2" : "px-3.5 py-2",
          )}
        >
          {browseLabel}
        </span>
      </button>

      <ul className={cn("space-y-2", classNames?.queue)}>
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <FileUploadRow
              key={item.id}
              item={item}
              onRemove={removeItem}
              onRetry={retryItem}
              classNames={classNames}
            />
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

