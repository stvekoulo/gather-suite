import type JSZip from "jszip";

export const REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
export type Theme = { colors: Record<string, string>; major: string; minor: string };

export function parseXml(source: string): Document {
  try {
    const doc = new DOMParser().parseFromString(source, "application/xml");
    if (doc.getElementsByTagName("parsererror").length) {
      return new DOMParser().parseFromString(source, "text/html");
    }
    return doc;
  } catch {
    return new DOMParser().parseFromString(source, "text/html");
  }
}

export function resolveZipPath(base: string, path: string): string {
  if (path.startsWith("/")) return path.slice(1);
  const parts = base.split("/"); parts.pop();
  for (const part of path.split("/")) {
    if (part === "..") parts.pop();
    else if (part !== ".") parts.push(part);
  }
  return parts.join("/");
}

export async function readXml(zip: JSZip, path: string): Promise<Document | null> {
  const file = zip.file(path) ?? zip.file(new RegExp(`^${path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"))[0];
  if (!file) return null;
  try {
    return parseXml(await file.async("string"));
  } catch {
    return null;
  }
}

// Map rel id -> { target path, type } for a part
export async function readRels(zip: JSZip, partPath: string) {
  const doc = await readXml(zip, partPath.replace(/([^/]+)$/, "_rels/$1.rels"));
  const map = new Map<string, { path: string; type: string }>();
  for (const r of Array.from(doc?.getElementsByTagName("Relationship") ?? [])) {
    map.set(r.getAttribute("Id") ?? "", { path: resolveZipPath(partPath, r.getAttribute("Target") ?? ""), type: r.getAttribute("Type") ?? "" });
  }
  return map;
}

export const kids = (el: Element | null | undefined, name: string) =>
  Array.from(el?.children ?? []).filter((c) => c.localName === name);
export const kid = (el: Element | null | undefined, name: string) => kids(el, name)[0];

export async function readTheme(zip: JSZip): Promise<Theme> {
  const colors: Record<string, string> = {
    dk1: "000000", lt1: "FFFFFF", dk2: "1F497D", lt2: "EEECE1", accent1: "4472C4", accent2: "ED7D31",
    accent3: "A5A5A5", accent4: "FFC000", accent5: "5B9BD5", accent6: "70AD47", hlink: "0563C1", folHlink: "954F72",
  };
  const theme: Theme = { colors, major: "Calibri Light", minor: "Calibri" };
  const file = zip.file(/^ppt\/theme\/theme\d+\.xml$/i)[0];
  if (!file) return theme;
  const doc = parseXml(await file.async("string"));
  const scheme = doc.getElementsByTagNameNS("*", "clrScheme")[0];
  for (const child of Array.from(scheme?.children ?? [])) {
    const c = child.firstElementChild;
    const val = c?.getAttribute("lastClr") ?? c?.getAttribute("val");
    if (val) colors[child.localName] = val;
  }
  const font = (n: string) => doc.getElementsByTagNameNS("*", n)[0]?.getElementsByTagNameNS("*", "latin")[0]?.getAttribute("typeface");
  theme.major = font("majorFont") || theme.major;
  theme.minor = font("minorFont") || theme.minor;
  return theme;
}

const ALIAS: Record<string, string> = { tx1: "dk1", tx2: "dk2", bg1: "lt1", bg2: "lt2" };

function applyMods(hex: string, node: Element): string {
  let [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
  for (const m of Array.from(node.children)) {
    const v = Number(m.getAttribute("val") ?? 0) / 100000;
    if (m.localName === "lumMod") [r, g, b] = [r, g, b].map((x) => x * v);
    if (m.localName === "lumOff") [r, g, b] = [r, g, b].map((x) => x + 255 * v);
    if (m.localName === "tint") [r, g, b] = [r, g, b].map((x) => x + (255 - x) * (1 - v));
    if (m.localName === "shade") [r, g, b] = [r, g, b].map((x) => x * v);
  }
  return "#" + [r, g, b].map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0")).join("");
}

// Resolve a color-choice element (srgbClr, schemeClr, sysClr, prstClr)
export function colorOf(node: Element | null | undefined, theme: Theme): string | undefined {
  const c = node?.firstElementChild;
  if (!c) return undefined;
  if (c.localName === "srgbClr") return applyMods(c.getAttribute("val") ?? "000000", c);
  if (c.localName === "sysClr") return applyMods(c.getAttribute("lastClr") ?? "000000", c);
  if (c.localName === "schemeClr") {
    const key = c.getAttribute("val") ?? "";
    const hex = theme.colors[ALIAS[key] ?? key];
    return hex ? applyMods(hex, c) : undefined;
  }
  if (c.localName === "prstClr") return c.getAttribute("val") === "white" ? "#ffffff" : "#000000";
  return undefined;
}

// Fill of a spPr/bgPr: direct solidFill child only (ignores outline colors)
export function fillOf(pr: Element | null | undefined, theme: Theme): string | undefined | null {
  if (!pr) return undefined;
  if (kid(pr, "noFill")) return null;
  const solid = kid(pr, "solidFill");
  if (solid) return colorOf(solid, theme);
  const grad = kid(pr, "gradFill");
  const stop = grad?.getElementsByTagNameNS("*", "gs")[0];
  return stop ? colorOf(stop, theme) : undefined;
}
