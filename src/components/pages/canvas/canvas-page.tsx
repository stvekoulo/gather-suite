"use client";
import dynamic from "next/dynamic";
const ExcalidrawEditor = dynamic(() => import("@/modules/canvas/excalidraw-editor"), { ssr: false, loading: () => <p className="p-6">Chargement du tableau blanc…</p> });
export function CanvasPage() { return <ExcalidrawEditor />; }
