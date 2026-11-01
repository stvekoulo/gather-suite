"use client";
import { useEffect } from "react";
import { useAppStore } from "@/stores/app-store";
import { translateScreenText } from "./ui-text";

const ATTRIBUTES = ["placeholder", "title", "aria-label", "alt"];
// What people type or open must stay exactly as written.
const SKIP = "input, textarea, select, script, style, code, pre, [contenteditable='true'], .ProseMirror, [data-user-content]";

/** In English mode, translates interface text that is built outside translate(). */
export function DomTranslator() {
  const language = useAppStore((s) => s.settings.language);
  useEffect(() => {
    if (language !== "en") return;
    const changed = new Map<Text | Element, string | Map<string, string>>();
    const text = (node: Text) => {
      if (node.parentElement?.closest(SKIP)) return;
      const value = node.nodeValue ?? "";
      const next = translateScreenText(value);
      if (next === value) return;
      if (!changed.has(node)) changed.set(node, value);
      node.nodeValue = next;
    };
    const attributes = (element: Element) => {
      if (element.closest("script, style")) return;
      for (const name of ATTRIBUTES) {
        const value = element.getAttribute(name);
        const next = value && translateScreenText(value);
        if (!next || next === value) continue;
        let saved = changed.get(element) as Map<string, string> | undefined;
        if (!saved) changed.set(element, (saved = new Map()));
        saved.set(name, value);
        element.setAttribute(name, next);
      }
    };
    const walk = (root: Node) => {
      if (root.nodeType === Node.TEXT_NODE) { text(root as Text); return; }
      if (root.nodeType !== Node.ELEMENT_NODE) return;
      attributes(root as Element);
      (root as Element).querySelectorAll(ATTRIBUTES.map((a) => `[${a}]`).join(",")).forEach(attributes);
      const texts = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      while (texts.nextNode()) text(texts.currentNode as Text);
    };
    walk(document.body);
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        if (record.type === "childList") record.addedNodes.forEach(walk);
        else if (record.type === "characterData") text(record.target as Text);
        else attributes(record.target as Element);
      }
    });
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ATTRIBUTES });
    return () => {
      observer.disconnect();
      // Back to French: put the original text back where React did not already replace it.
      changed.forEach((saved, node) => {
        if (node instanceof Text) node.nodeValue = saved as string;
        else (saved as Map<string, string>).forEach((value, name) => node.setAttribute(name, value));
      });
    };
  }, [language]);
  return null;
}
