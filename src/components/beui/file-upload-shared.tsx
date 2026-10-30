"use client";
// beui.dev/components/blocks/file-upload

import {
  AlertCircle,
  CheckCircle2,
  FileArchive,
  FileAudio,
  FileCode2,
  FileIcon,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileVideo,
  Loader2,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { EASE_OUT } from "@/lib/ease";
import { cn } from "@/lib/utils";

export type FileUploadStatus = "queued" | "uploading" | "success" | "error";
export type FileUploadVariant = "default" | "centered";

export type FileUploadItem = {
  id: string;
  name: string;
  size: number;
  type?: string;
  progress?: number;
  status?: FileUploadStatus;
  error?: string;
  file?: File;
};

export type FileUploadClassNames = {
  root?: string;
  dropzone?: string;
  queue?: string;
  item?: string;
  leading?: string;
  content?: string;
  name?: string;
  meta?: string;
  progress?: string;
  action?: string;
};

export interface FileUploadProps {
  inputLabel?: string;
  value?: FileUploadItem[];
  defaultValue?: FileUploadItem[];
  onValueChange?: (items: FileUploadItem[]) => void;
  onFilesAdded?: (items: FileUploadItem[], files: File[]) => void;
  onRemove?: (item: FileUploadItem) => void;
  onRetry?: (item: FileUploadItem) => void;
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  variant?: FileUploadVariant;
  title?: string;
  description?: string;
  browseLabel?: string;
  className?: string;
  classNames?: FileUploadClassNames;
}

export const ROW_TRANSITION = { duration: 0.22, ease: EASE_OUT } as const;
export const FAST_TRANSITION = { duration: 0.16, ease: EASE_OUT } as const;

export const STATUS_LABEL: Record<FileUploadStatus, string> = {
  queued: "Sélectionné",
  uploading: "Traitement",
  success: "Terminé",
  error: "Échec",
};

export const STATUS_TONE: Record<FileUploadStatus, string> = {
  queued: "text-muted-foreground",
  uploading: "text-foreground",
  success: "text-emerald-600 dark:text-emerald-400",
  error: "text-destructive",
};

export function useControllableUpload({
  value,
  defaultValue,
  onValueChange,
}: {
  value?: FileUploadItem[];
  defaultValue?: FileUploadItem[];
  onValueChange?: (items: FileUploadItem[]) => void;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? []);
  const isControlled = value !== undefined;
  const items = value ?? internalValue;

  const setItems = useCallback(
    (next: FileUploadItem[]) => {
      if (!isControlled) {
        setInternalValue(next);
      }

      onValueChange?.(next);
    },
    [isControlled, onValueChange],
  );

  return [items, setItems] as const;
}

export function clampProgress(value: number | undefined, status: FileUploadStatus) {
  if (status === "success") return 100;
  if (value === undefined || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

export function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / 1024 ** exponent;

  return `${value >= 10 || exponent === 0 ? value.toFixed(0) : value.toFixed(1)} ${
    units[exponent]
  }`;
}

export function fileKind(item: FileUploadItem) {
  const extension = item.name.includes(".")
    ? item.name.split(".").pop()
    : undefined;

  if (extension) return extension.toUpperCase();
  if (item.type) return item.type.split("/").pop()?.toUpperCase();
  return "FILE";
}

export function getFileIcon(item: FileUploadItem) {
  const extension = item.name.includes(".")
    ? item.name.split(".").pop()?.toLowerCase()
    : undefined;
  const type = item.type ?? "";

  if (type.startsWith("image/")) return <FileImage />;
  if (type.startsWith("video/")) return <FileVideo />;
  if (type.startsWith("audio/")) return <FileAudio />;
  if (
    type.includes("zip") ||
    type.includes("compressed") ||
    ["zip", "rar", "7z", "tar", "gz"].includes(extension ?? "")
  ) {
    return <FileArchive />;
  }
  if (
    type.includes("spreadsheet") ||
    type.includes("excel") ||
    ["csv", "xls", "xlsx"].includes(extension ?? "")
  ) {
    return <FileSpreadsheet />;
  }
  if (
    type.includes("pdf") ||
    type.startsWith("text/") ||
    ["pdf", "doc", "docx", "md", "txt"].includes(extension ?? "")
  ) {
    return <FileText />;
  }
  if (
    [
      "css",
      "html",
      "js",
      "jsx",
      "json",
      "mdx",
      "ts",
      "tsx",
      "xml",
      "yaml",
      "yml",
    ].includes(extension ?? "")
  ) {
    return <FileCode2 />;
  }

  return <FileIcon />;
}

export function createFileUploadItem(file: File, index = 0): FileUploadItem {
  return {
    id: `${Date.now()}-${index}-${file.name}`,
    name: file.name,
    size: file.size,
    type: file.type,
    progress: 0,
    status: "uploading",
    file,
  };
}

export function StatusIcon({
  status,
  reduce,
}: {
  status: FileUploadStatus;
  reduce: boolean;
}) {
  const iconClassName = "h-4 w-4";

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.span
        key={status}
        initial={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(4px)" }
        }
        animate={{ opacity: 1, transform: "translateY(0px)" }}
        exit={
          reduce
            ? { opacity: 0 }
            : { opacity: 0, transform: "translateY(-4px)" }
        }
        transition={FAST_TRANSITION}
        className={cn("grid h-6 w-6 place-items-center", STATUS_TONE[status])}
      >
        {status === "success" ? (
          <CheckCircle2 className={iconClassName} />
        ) : status === "error" ? (
          <AlertCircle className={iconClassName} />
        ) : status === "uploading" ? (
          <Loader2
            className={cn(
              iconClassName,
              "animate-spin",
              reduce && "animate-none",
            )}
          />
        ) : (
          <FileIcon className={iconClassName} />
        )}
        <span className="sr-only">{STATUS_LABEL[status]}</span>
      </motion.span>
    </AnimatePresence>
  );
}


