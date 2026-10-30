"use client";

import { useRef, useState } from "react";
import type { CanvasElement } from "@/stores/workspace-types";
import { CanvasElementNode } from "./canvas-element";
import type { CanvasTool } from "./canvas-toolbar";

interface CanvasBoardProps {
  elements: CanvasElement[];
  zoom: number;
  panX: number;
  panY: number;
  tool: CanvasTool;
  onPanChange: (x: number, y: number) => void;
  onUpdateElement: (id: string, patch: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  selectedId: string | null;
  onSelectId: (id: string | null) => void;
}

export function CanvasBoard({
  elements,
  zoom,
  panX,
  panY,
  tool,
  onPanChange,
  onUpdateElement,
  onDeleteElement,
  selectedId,
  onSelectId,
}: CanvasBoardProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isPanning = useRef(false);
  const startPan = useRef({ x: 0, y: 0 });

  const [draggingElemId, setDraggingElemId] = useState<string | null>(null);
  const dragStart = useRef({ mouseX: 0, mouseY: 0, elemX: 0, elemY: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (tool === "pan" || e.button === 1) {
      isPanning.current = true;
      startPan.current = { x: e.clientX - panX, y: e.clientY - panY };
    } else {
      onSelectId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning.current) {
      onPanChange(e.clientX - startPan.current.x, e.clientY - startPan.current.y);
    } else if (draggingElemId) {
      const dx = (e.clientX - dragStart.current.mouseX) / zoom;
      const dy = (e.clientY - dragStart.current.mouseY) / zoom;
      onUpdateElement(draggingElemId, {
        x: Math.round(dragStart.current.elemX + dx),
        y: Math.round(dragStart.current.elemY + dy),
      });
    }
  };

  const handleMouseUp = () => {
    isPanning.current = false;
    setDraggingElemId(null);
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative h-full w-full overflow-hidden bg-[#fafafa] dark:bg-[#0c0c0e] select-none cursor-default"
      style={{
        backgroundImage: `radial-gradient(circle, var(--color-hairline) 1px, transparent 1px)`,
        backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
        backgroundPosition: `${panX}px ${panY}px`,
      }}
    >
      {/* Transform Container */}
      <div
        style={{
          transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
          transformOrigin: "0 0",
        }}
        className="absolute inset-0 pointer-events-none"
      >
        <div className="pointer-events-auto relative h-full w-full">
          {elements.map((elem) => (
            <div
              key={elem.id}
              onMouseDown={(e) => {
                if (tool !== "pan" && e.button === 0) {
                  e.stopPropagation();
                  onSelectId(elem.id);
                  setDraggingElemId(elem.id);
                  dragStart.current = {
                    mouseX: e.clientX,
                    mouseY: e.clientY,
                    elemX: elem.x,
                    elemY: elem.y,
                  };
                }
              }}
            >
              <CanvasElementNode
                element={elem}
                isSelected={elem.id === selectedId}
                onSelect={() => onSelectId(elem.id)}
                onUpdate={(patch) => onUpdateElement(elem.id, patch)}
                onDelete={() => onDeleteElement(elem.id)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
