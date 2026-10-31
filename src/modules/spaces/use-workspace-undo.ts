"use client";
import { useEffect } from "react";
import { useWorkspaceStore } from "@/stores/workspace-store";

const LIMIT = 50;
// Changes this close together are one user action, e.g. typing then validating a cell.
const GROUP_MS = 800;
const isTyping = (target: EventTarget | null) => target instanceof HTMLElement && (target.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName));

/** Ctrl+Z / Ctrl+Y for a workspace list while its editor is open. Text fields keep their own undo. */
export function useWorkspaceUndo(key: "sheets" | "decks") {
  useEffect(() => {
    const past: unknown[] = [], future: unknown[] = [];
    let restoring = false, lastChange = 0;
    const stop = useWorkspaceStore.subscribe((state, previous) => {
      if (restoring || state[key] === previous[key]) return;
      const now = Date.now();
      if (now - lastChange > GROUP_MS) past.push(previous[key]);
      lastChange = now;
      if (past.length > LIMIT) past.shift();
      future.length = 0;
    });
    const restore = (from: unknown[], to: unknown[]) => {
      if (!from.length) return;
      to.push(useWorkspaceStore.getState()[key]);
      restoring = true;
      useWorkspaceStore.setState({ [key]: from.pop() });
      restoring = false;
    };
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey || isTyping(e.target)) return;
      const k = e.key.toLowerCase();
      if (k !== "z" && k !== "y") return;
      // Runs before the app-wide undo, which only knows calendar and finance changes.
      e.preventDefault();
      e.stopImmediatePropagation();
      if (k === "y" || e.shiftKey) restore(future, past);
      else restore(past, future);
    };
    window.addEventListener("keydown", onKey, true);
    return () => { stop(); window.removeEventListener("keydown", onKey, true); };
  }, [key]);
}
