"use client";
import { motion, useReducedMotion } from "motion/react";
import { EASE_OUT } from "@/lib/ease";
import { RotateCcw, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type FileUploadItem, type FileUploadClassNames, ROW_TRANSITION, clampProgress, getFileIcon, fileKind, formatBytes, StatusIcon } from "./file-upload-shared";
export function FileUploadRow({
  item,
  onRemove,
  onRetry,
  classNames,
}: {
  item: FileUploadItem;
  onRemove: (item: FileUploadItem) => void;
  onRetry: (item: FileUploadItem) => void;
  classNames?: FileUploadClassNames;
}) {
  const reduce = useReducedMotion() ?? false;
  const status = item.status ?? "queued";
  const progress = clampProgress(item.progress, status);
  const progressRatio = progress / 100;
  const showProgress = status === "uploading" || status === "success";
  const leadingIcon = getFileIcon(item);

  return (
    <motion.li
      layout={!reduce}
      initial={
        reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(8px)" }
      }
      animate={{ opacity: 1, transform: "translateY(0px)" }}
      exit={
        reduce ? { opacity: 0 } : { opacity: 0, transform: "translateY(-6px)" }
      }
      transition={ROW_TRANSITION}
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-background p-3",
        classNames?.item,
      )}
    >
      <div className="flex items-center gap-3">
        <div
          className={cn(
            "grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-muted text-muted-foreground",
            classNames?.leading,
          )}
        >
          <span className="[&_svg]:h-5 [&_svg]:w-5">{leadingIcon}</span>
        </div>

        <div className={cn("min-w-0 flex-1", classNames?.content)}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={cn(
                  "truncate text-sm font-medium text-foreground",
                  classNames?.name,
                )}
              >
                {item.name}
              </p>
              <p
                className={cn(
                  "mt-0.5 text-xs text-muted-foreground",
                  classNames?.meta,
                )}
              >
                {fileKind(item)} · {formatBytes(item.size)}
                {status === "error" && item.error ? ` · ${item.error}` : null}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <StatusIcon status={status} reduce={reduce} />
              {status === "error" ? (
                <button
                  type="button"
                  onClick={() => onRetry(item)}
                  aria-label={`Réessayer ${item.name}`}
                  className={cn(
                    "grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95",
                    classNames?.action,
                  )}
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => onRemove(item)}
                aria-label={`Retirer ${item.name}`}
                className={cn(
                  "grid h-7 w-7 place-items-center rounded-full text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground active:scale-95",
                  classNames?.action,
                )}
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {showProgress ? (
            <div
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress)}
              aria-label={`Progression de ${item.name}`}
              className={cn(
                "mt-3 h-1.5 overflow-hidden rounded-full bg-muted",
                classNames?.progress,
              )}
            >
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  status === "success"
                    ? "bg-emerald-500"
                    : "bg-foreground",
                )}
                style={{
                  transformOrigin: "left",
                  transform: reduce ? `scaleX(${progressRatio})` : undefined,
                }}
                initial={false}
                animate={
                  reduce ? undefined : { transform: `scaleX(${progressRatio})` }
                }
                transition={{ duration: 0.28, ease: EASE_OUT }}
              />
            </div>
          ) : null}
        </div>
      </div>
    </motion.li>
  );
}


