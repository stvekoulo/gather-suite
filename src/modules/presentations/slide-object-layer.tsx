"use client";

import { useRef } from "react";
import type { SlideElement } from "@/stores/workspace-types";

// Couche interactive de rendu des formes, images et textes d'une diapositive
export function SlideObjectLayer({
  elements,
  onChange,
  onSelect,
  selectedId,
}: {
  elements: SlideElement[];
  onChange?: (elements: SlideElement[]) => void;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
}) {
  const stage = useRef<HTMLDivElement>(null);
  const drag = useRef<{
    id: string;
    startX: number;
    startY: number;
    original: SlideElement;
    resize: boolean;
    next: SlideElement;
  } | null>(null);

  return (
    <div
      ref={stage}
      style={{ containerType: "inline-size" }}
      className="absolute inset-0 pointer-events-none"
    >
      {elements.map((element) => {
        const isSelected = selectedId === element.id;

        return (
          <div
            key={element.id}
            role="group"
            aria-label={`Objet ${element.type}`}
            tabIndex={onChange ? 0 : undefined}
            className={`absolute pointer-events-auto select-none transition-shadow ${
              isSelected ? "ring-2 ring-orange-500 shadow-md z-10" : ""
            }`}
            style={{
              left: `${(element.x / 1280) * 100}%`,
              top: `${(element.y / 720) * 100}%`,
              width: `${(element.width / 1280) * 100}%`,
              height: `${(element.height / 720) * 100}%`,
              backgroundColor: ["arrow", "star", "line"].includes(element.type)
                ? undefined
                : element.fill && element.fill !== "transparent"
                ? element.fill
                : undefined,
              border: ["arrow", "star", "line"].includes(element.type)
                ? undefined
                : element.borderColor
                ? `1px solid ${element.borderColor}`
                : undefined,
              borderRadius: element.type === "ellipse" ? "50%" : 6,
              transform: element.rotation ? `rotate(${element.rotation}deg)` : undefined,
              color: element.color,
              touchAction: "none",
            }}
            onFocus={() => onSelect?.(element.id)}
            onPointerDown={(event) => {
              if (!onChange || event.button !== 0) return;
              event.stopPropagation();
              event.currentTarget.setPointerCapture(event.pointerId);
              onSelect?.(element.id);
              drag.current = {
                id: element.id,
                startX: event.clientX,
                startY: event.clientY,
                original: element,
                next: element,
                resize: (event.target as HTMLElement).dataset.resize === "true",
              };
            }}
            onPointerMove={(event) => {
              const current = drag.current;
              if (!current || current.id !== element.id || !stage.current) return;
              const bounds = stage.current.getBoundingClientRect();
              const dx = ((event.clientX - current.startX) * 1280) / bounds.width;
              const dy = ((event.clientY - current.startY) * 720) / bounds.height;
              const orig = current.original;
              current.next = current.resize
                ? {
                    ...orig,
                    width: Math.max(30, Math.min(1280 - orig.x, orig.width + dx)),
                    height: Math.max(20, Math.min(720 - orig.y, orig.height + dy)),
                  }
                : {
                    ...orig,
                    x: Math.max(0, Math.min(1280 - orig.width, orig.x + dx)),
                    y: Math.max(0, Math.min(720 - orig.height, orig.y + dy)),
                  };
              Object.assign(event.currentTarget.style, {
                left: `${(current.next.x / 1280) * 100}%`,
                top: `${(current.next.y / 720) * 100}%`,
                width: `${(current.next.width / 1280) * 100}%`,
                height: `${(current.next.height / 720) * 100}%`,
              });
            }}
            onPointerUp={(event) => {
              if (!drag.current) return;
              event.currentTarget.releasePointerCapture(event.pointerId);
              const next = drag.current.next;
              drag.current = null;
              onChange?.(elements.map((item) => (item.id === next.id ? next : item)));
            }}
            onPointerCancel={() => {
              drag.current = null;
            }}
          >
            {element.type === "text" && (
              <div
                contentEditable={!!onChange}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const newText = e.currentTarget.textContent ?? "";
                  if (newText !== element.text) {
                    onChange?.(elements.map((item) => (item.id === element.id ? { ...item, text: newText } : item)));
                  }
                }}
                className="h-full w-full overflow-hidden p-1 flex flex-col leading-snug whitespace-pre-wrap break-words outline-none"
                style={{
                  fontSize: `clamp(10px, calc(${element.fontSize || 18} * 100cqw / 1280), 120px)`,
                  fontWeight: element.bold ? 700 : 400,
                  fontStyle: element.italic ? "italic" : "normal",
                  textAlign: element.textAlign ?? "left",
                  fontFamily: element.fontFamily ? `"${element.fontFamily}", system-ui, sans-serif` : "inherit",
                  justifyContent:
                    element.anchor === "middle"
                      ? "center"
                      : element.anchor === "bottom"
                      ? "flex-end"
                      : "flex-start",
                  color: element.color,
                }}
              >
                {element.text}
              </div>
            )}

            {element.type === "image" && element.dataUrl && (
              <img
                src={element.dataUrl}
                alt="Objet visuel"
                className="h-full w-full object-contain pointer-events-none select-none"
              />
            )}

            {element.type === "arrow" && (
              <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="size-full pointer-events-none">
                <polygon
                  points="0,15 65,15 65,0 100,25 65,50 65,35 0,35"
                  fill={element.fill && element.fill !== "transparent" ? element.fill : "#f97316"}
                  stroke={element.borderColor || element.color || "transparent"}
                  strokeWidth="2"
                />
              </svg>
            )}

            {element.type === "star" && (
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="size-full pointer-events-none">
                <polygon
                  points="50,5 64,36 98,36 70,57 81,91 50,70 19,91 30,57 2,36 36,36"
                  fill={element.fill && element.fill !== "transparent" ? element.fill : "#f97316"}
                  stroke={element.borderColor || element.color || "transparent"}
                  strokeWidth="2"
                />
              </svg>
            )}

            {element.type === "line" && (
              <div className="flex size-full items-center pointer-events-none">
                <div
                  className="w-full h-1"
                  style={{
                    backgroundColor: element.borderColor || element.color || "#f97316",
                  }}
                />
              </div>
            )}

            {onChange && isSelected && (
              <button
                aria-label="Redimensionner l’objet"
                data-resize="true"
                className="absolute -right-1.5 -bottom-1.5 size-3.5 cursor-se-resize rounded-full border-2 border-white bg-orange-600 shadow-xs"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
