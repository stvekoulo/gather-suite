"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CanvasElement } from "@/stores/workspace-types";

interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<CanvasElement>) => void;
  onDelete: () => void;
}

export function CanvasElementNode({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: CanvasElementProps) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      style={{
        position: "absolute",
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
      }}
      className={cn(
        "group select-none transition-shadow",
        isSelected && "ring-2 ring-brand ring-offset-2"
      )}
    >
      {/* Sticky Note */}
      {element.type === "sticky" && (
        <div
          style={{ backgroundColor: element.color, color: element.textColor }}
          className="relative flex h-full w-full flex-col justify-between rounded-xl p-3.5 shadow-md"
        >
          {isEditing ? (
            <textarea
              autoFocus
              value={element.content}
              onBlur={() => setIsEditing(false)}
              onChange={(e) => onUpdate({ content: e.target.value })}
              className="h-full w-full resize-none bg-transparent text-[13px] leading-relaxed outline-none"
            />
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              className="h-full w-full overflow-hidden text-[13px] leading-relaxed whitespace-pre-wrap cursor-text"
            >
              {element.content || "Double click to write..."}
            </div>
          )}
        </div>
      )}

      {/* Rectangle */}
      {element.type === "rectangle" && (
        <div
          style={{ backgroundColor: element.color, color: element.textColor }}
          className="relative flex h-full w-full flex-col justify-center rounded-2xl border border-hairline p-4 shadow-sm"
        >
          <div
            onDoubleClick={() => setIsEditing(true)}
            className="text-[13px] font-medium leading-relaxed whitespace-pre-wrap text-center"
          >
            {element.content}
          </div>
        </div>
      )}

      {/* Ellipse */}
      {element.type === "ellipse" && (
        <div
          style={{ backgroundColor: element.color, color: element.textColor }}
          className="relative flex h-full w-full flex-col items-center justify-center rounded-full border border-hairline p-4 shadow-sm"
        >
          <span className="text-[12px] font-medium text-center">{element.content}</span>
        </div>
      )}

      {/* Text block */}
      {element.type === "text" && (
        <div className="relative flex h-full w-full items-center p-2">
          <span className="text-base font-semibold text-fg">{element.content}</span>
        </div>
      )}

      {/* Floating delete button when selected */}
      {isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 flex size-6 items-center justify-center rounded-full bg-destructive text-white shadow-md hover:scale-110 transition-transform"
        >
          <Trash2Icon className="size-3" />
        </button>
      )}
    </div>
  );
}
