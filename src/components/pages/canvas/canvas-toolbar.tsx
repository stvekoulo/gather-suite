"use client";

import {
  CircleIcon,
  DownloadIcon,
  MousePointerIcon,
  MoveIcon,
  SquareIcon,
  StickyNoteIcon,
  TypeIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type CanvasTool = "select" | "pan" | "sticky" | "rectangle" | "ellipse" | "text";

interface CanvasToolbarProps {
  tool: CanvasTool;
  onToolSelect: (t: CanvasTool) => void;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onAddElement: (type: CanvasTool) => void;
  onExport: () => void;
}

export function CanvasToolbar({
  tool,
  onToolSelect,
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onAddElement,
  onExport,
}: CanvasToolbarProps) {
  const tools: { id: CanvasTool; label: string; icon: React.ReactNode }[] = [
    { id: "select", label: "Select (V)", icon: <MousePointerIcon className="size-4" /> },
    { id: "pan", label: "Hand Tool (H)", icon: <MoveIcon className="size-4" /> },
    { id: "sticky", label: "Sticky Note", icon: <StickyNoteIcon className="size-4" /> },
    { id: "rectangle", label: "Rectangle", icon: <SquareIcon className="size-4" /> },
    { id: "ellipse", label: "Circle", icon: <CircleIcon className="size-4" /> },
    { id: "text", label: "Text", icon: <TypeIcon className="size-4" /> },
  ];

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 rounded-2xl border border-hairline bg-surface/85 backdrop-blur-xl p-1.5 shadow-lg select-none">
      <div className="flex items-center gap-1 pr-2 border-r border-hairline">
        {tools.map((t) => {
          const active = tool === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                onToolSelect(t.id);
                if (t.id !== "select" && t.id !== "pan") {
                  onAddElement(t.id);
                }
              }}
              title={t.label}
              className={cn(
                "flex size-8 items-center justify-center rounded-xl transition-all",
                active
                  ? "bg-brand text-white shadow-xs"
                  : "text-fg-2 hover:bg-hover hover:text-fg"
              )}
            >
              {t.icon}
            </button>
          );
        })}
      </div>

      {/* Zoom and Export Controls */}
      <div className="flex items-center gap-1 px-1">
        <button
          type="button"
          onClick={onZoomOut}
          title="Zoom Out"
          className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
        >
          <ZoomOutIcon className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={onResetZoom}
          title="Reset Zoom"
          className="px-1.5 text-[11px] font-mono font-medium text-fg-2 hover:text-fg transition-colors"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={onZoomIn}
          title="Zoom In"
          className="flex size-7 items-center justify-center rounded-lg text-fg-2 hover:bg-hover hover:text-fg transition-colors"
        >
          <ZoomInIcon className="size-3.5" />
        </button>
      </div>

      <div className="pl-1 border-l border-hairline">
        <button
          type="button"
          onClick={onExport}
          title="Export Canvas"
          className="flex size-8 items-center justify-center rounded-xl text-fg-2 hover:bg-hover hover:text-fg transition-colors"
        >
          <DownloadIcon className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
