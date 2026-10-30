import JSZip from "jszip";
import type { PresentationDeck, SlideElement, SlideItem } from "@/stores/workspace-types";
import { REL_NS, colorOf, fillOf, kid, kids, readRels, readXml, type Theme, readTheme } from "./pptx-xml";

type Ctx = { zip: JSZip; theme: Theme; sx: number; sy: number; pt: number; warnings: Set<string> };
type Part = { doc: Document; path: string; rels: Awaited<ReturnType<typeof readRels>> };
type Box = { x: number; y: number; w: number; h: number };
type Map2 = (b: Box) => Box;
const identity: Map2 = (b) => b;

const phKey = (sp: Element) => {
  const ph = sp.getElementsByTagNameNS("*", "ph")[0];
  if (!ph) return null;
  const type = ph.getAttribute("type") ?? "body";
  return { type: type === "ctrTitle" ? "title" : type, idx: ph.getAttribute("idx") };
};

// Find matching placeholder shape in a layout or master part
function findPh(part: Part | undefined, key: { type: string; idx: string | null }) {
  const shapes = Array.from(part?.doc.getElementsByTagNameNS("*", "sp") ?? []);
  return shapes.find((s) => { const k = phKey(s); return k && key.idx && k.idx === key.idx; })
    ?? shapes.find((s) => phKey(s)?.type === key.type);
}

function xfrmBox(sp: Element | undefined): Box | null {
  const xfrm = sp?.getElementsByTagNameNS("*", "xfrm")[0];
  const off = kid(xfrm, "off"), ext = kid(xfrm, "ext");
  if (!off || !ext) return null;
  const x = Number(off.getAttribute("x") || 0), y = Number(off.getAttribute("y") || 0);
  const w = Number(ext.getAttribute("cx") || 0), h = Number(ext.getAttribute("cy") || 0);
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return { x, y, w, h };
}

// Default run props from list styles chain (shape → layout → master txStyles)
function defaults(chain: (Element | undefined)[], master: Part | undefined, type: string, ctx: Ctx) {
  const styleName = type === "title" ? "titleStyle" : ["body", "subTitle", "obj"].includes(type) ? "bodyStyle" : "otherStyle";
  const sources = [...chain.map((s) => s?.getElementsByTagNameNS("*", "lvl1pPr")[0]),
    master?.doc.getElementsByTagNameNS("*", styleName)[0]?.getElementsByTagNameNS("*", "lvl1pPr")[0]];
  let size: number | undefined, color: string | undefined, algn: string | undefined;
  for (const lvl of sources) {
    const def = kid(lvl, "defRPr");
    size ??= def?.getAttribute("sz") ? +def.getAttribute("sz")! / 100 : undefined;
    color ??= colorOf(kid(def, "solidFill"), ctx.theme);
    algn ??= lvl?.getAttribute("algn") ?? undefined;
  }
  return { size: size ?? (type === "title" ? 44 : 18), color, algn };
}

async function imageUrl(part: Part, embed: string | null, ctx: Ctx) {
  const rel = embed ? part.rels.get(embed) : undefined;
  if (!rel) return undefined;
  const path = rel.path;
  const file = ctx.zip.file(path) ?? ctx.zip.file(new RegExp(`^${path.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")}$`, "i"))[0];
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  const mime: Record<string, string> = { png: "png", jpg: "jpeg", jpeg: "jpeg", gif: "gif", webp: "webp", svg: "svg+xml" };
  if (!file || !mime[ext]) { ctx.warnings.add(`Format d'image non pris en charge (.${ext}).`); return undefined; }
  try {
    return `data:image/${mime[ext]};base64,${await file.async("base64")}`;
  } catch {
    ctx.warnings.add(`Impossible de décoder l'image ${path}.`);
    return undefined;
  }
}

async function shapeToElements(sp: Element, part: Part, layout: Part | undefined, master: Part | undefined, map: Map2, ctx: Ctx): Promise<SlideElement[]> {
  const name = sp.localName;
  if (name === "grpSp") {
    const x = kid(kid(sp, "grpSpPr"), "xfrm");
    const [off, ext, chOff, chExt] = ["off", "ext", "chOff", "chExt"].map((n) => kid(x, n));
    const n = (e: Element | undefined, a: string) => +(e?.getAttribute(a) ?? 0);
    const kx = n(chExt, "cx") ? n(ext, "cx") / n(chExt, "cx") : 1, ky = n(chExt, "cy") ? n(ext, "cy") / n(chExt, "cy") : 1;
    const inner: Map2 = (b) => map({ x: n(off, "x") + (b.x - n(chOff, "x")) * kx, y: n(off, "y") + (b.y - n(chOff, "y")) * ky, w: b.w * kx, h: b.h * ky });
    const out: SlideElement[] = [];
    for (const c of Array.from(sp.children)) out.push(...await shapeToElements(c, part, layout, master, inner, ctx));
    return out;
  }
  if (name === "graphicFrame") ctx.warnings.add("Tableaux et graphiques importés partiellement.");
  if (!["sp", "pic", "cxnSp"].includes(name)) return [];
  const key = phKey(sp);
  const lph = key ? findPh(layout, key) : undefined, mph = key ? findPh(master, key) : undefined;
  const raw = xfrmBox(sp) ?? xfrmBox(lph) ?? xfrmBox(mph);
  if (!raw) return [];
  const b = map(raw);
  const rot = +(sp.getElementsByTagNameNS("*", "xfrm")[0]?.getAttribute("rot") ?? 0) / 60000;
  const base = { id: crypto.randomUUID(), x: b.x / ctx.sx, y: b.y / ctx.sy, width: Math.max(4, b.w / ctx.sx), height: Math.max(4, b.h / ctx.sy), rotation: rot || undefined, fontSize: 18, color: "#000000", fill: "transparent" };
  const spPr = kid(sp, "spPr");
  const blip = sp.getElementsByTagNameNS("*", "blip")[0];
  if (name === "pic" || (blip && !sp.getElementsByTagNameNS("*", "t").length)) {
    const url = await imageUrl(part, blip?.getAttributeNS(REL_NS, "embed") ?? blip?.getAttribute("r:embed") ?? null, ctx);
    return url ? [{ ...base, type: "image", dataUrl: url }] : [];
  }
  const fillRef = kid(kid(sp, "style"), "fillRef");
  const own = fillOf(spPr, ctx.theme) ?? fillOf(kid(lph, "spPr"), ctx.theme);
  const fill = own === null ? undefined : own ?? (fillRef && fillRef.getAttribute("idx") !== "0" ? colorOf(fillRef, ctx.theme) : undefined);
  const ln = kid(spPr, "ln") ?? kid(kid(lph, "spPr"), "ln");
  const border = ln && !kid(ln, "noFill") ? colorOf(kid(ln, "solidFill"), ctx.theme) : undefined;
  const geom = kid(spPr, "prstGeom")?.getAttribute("prst");
  const body = kid(sp, "txBody");
  const def = defaults([body, kid(lph, "txBody"), kid(mph, "txBody")], master, key?.type ?? "other", ctx);
  const styleFontRef = kid(kid(sp, "style"), "fontRef");
  const styleTextColor = colorOf(styleFontRef, ctx.theme);
  const lines: string[] = [];
  let size: number | undefined, color: string | undefined, bold = false, italic = false, algn = def.algn, font: string | undefined;
  for (const p of kids(body, "p")) {
    const pPr = kid(p, "pPr");
    algn = pPr?.getAttribute("algn") ?? algn;
    const bu = kid(pPr, "buChar") || kid(pPr, "buAutoNum");
    const pText = Array.from(p.getElementsByTagNameNS("*", "t")).map((t) => t.textContent ?? "").join("");
    lines.push(bu && pText && !pText.startsWith("•") ? `• ${pText}` : pText);
    const r = p.getElementsByTagNameNS("*", "rPr")[0] ?? kid(p, "endParaRPr") ?? kid(pPr, "defRPr");
    if (r) {
      size ??= r.getAttribute("sz") ? +r.getAttribute("sz")! / 100 : undefined;
      color ??= colorOf(kid(r, "solidFill"), ctx.theme);
      bold ||= r.getAttribute("b") === "1"; italic ||= r.getAttribute("i") === "1";
      const tf = kid(r, "latin")?.getAttribute("typeface");
      font ??= tf === "+mj-lt" ? ctx.theme.major : tf === "+mn-lt" ? ctx.theme.minor : tf ?? undefined;
    }
  }
  const text = lines.join("\n").replace(/\n+$/, "");
  const anchorAttr = kid(body, "bodyPr")?.getAttribute("anchor") ?? (key?.type === "title" ? "ctr" : "t");
  if (text.trim()) {
    return [{ ...base, type: "text", text, fill: fill ?? "transparent", borderColor: border,
      fontSize: (size ?? def.size) * ctx.pt, color: color ?? styleTextColor ?? def.color ?? "#000000", bold, italic,
      fontFamily: font ?? (key?.type === "title" ? ctx.theme.major : ctx.theme.minor),
      textAlign: algn === "ctr" ? "center" : algn === "r" ? "right" : "left",
      anchor: anchorAttr === "ctr" ? "middle" : anchorAttr === "b" ? "bottom" : "top" }];
  }
  if (key || (!fill && !border)) return [];
  return [{ ...base, type: geom === "ellipse" ? "ellipse" : "rectangle", fill: fill ?? "transparent", color: fill ?? "#000000", borderColor: border }];
}

async function background(parts: (Part | undefined)[], ctx: Ctx) {
  for (const part of parts) {
    const bg = part?.doc.getElementsByTagNameNS("*", "bg")[0];
    if (!bg || !part) continue;
    const pr = kid(bg, "bgPr");
    const blip = pr?.getElementsByTagNameNS("*", "blip")[0];
    if (blip) return { color: "#ffffff", image: await imageUrl(part, blip.getAttributeNS(REL_NS, "embed") ?? blip.getAttribute("r:embed"), ctx) };
    const color = fillOf(pr, ctx.theme) ?? colorOf(kid(bg, "bgRef"), ctx.theme);
    if (color) return { color, image: undefined };
  }
  return { color: "#ffffff", image: undefined };
}

async function loadPart(zip: JSZip, path: string | undefined): Promise<Part | undefined> {
  if (!path) return undefined;
  const doc = await readXml(zip, path);
  return doc ? { doc, path, rels: await readRels(zip, path) } : undefined;
}
const relOfType = (p: Part | undefined, t: string) => [...(p?.rels.values() ?? [])].find((r) => r.type.endsWith(t))?.path;
const showMaster = (p: Part | undefined) => p?.doc.documentElement.getAttribute("showMasterSp") !== "0";

// Import PPTX with theme, master/layout inheritance, groups, images, backgrounds and notes
export async function importPptx(file: File): Promise<{ deck: Omit<PresentationDeck, "id" | "updatedAt">; warnings: string[] }> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());
  const pres = await loadPart(zip, "ppt/presentation.xml");
  if (!pres) throw new Error("Ce fichier n’est pas une présentation PPTX valide.");
  const sz = pres.doc.getElementsByTagNameNS("*", "sldSz")[0];
  const cx = +(sz?.getAttribute("cx") ?? 12192000), cy = +(sz?.getAttribute("cy") ?? 6858000);
  const is43 = cy > 0 && Math.abs(cx / cy - 4 / 3) < 0.15;
  const ratio: "16:9" | "4:3" = is43 ? "4:3" : "16:9";
  const ctx: Ctx = { zip, theme: await readTheme(zip), sx: cx / 1280, sy: cy / 720, pt: 1280 / (cx / 12700), warnings: new Set() };
  const slides: SlideItem[] = [];
  for (const sldId of Array.from(pres.doc.getElementsByTagNameNS("*", "sldId"))) {
    try {
      const rid = sldId.getAttributeNS(REL_NS, "id") ?? sldId.getAttribute("r:id") ?? "";
      const slide = await loadPart(zip, pres.rels.get(rid)?.path);
      if (!slide) continue;
      const layout = await loadPart(zip, relOfType(slide, "/slideLayout"));
      const master = await loadPart(zip, relOfType(layout, "/slideMaster"));
      const elements: SlideElement[] = [];
      const layers: [Part | undefined, boolean][] = [[master, showMaster(slide) && showMaster(layout)], [layout, showMaster(slide)], [slide, true]];
      for (const [part, visible] of layers) {
        if (!part || !visible) continue;
        const tree = part.doc.getElementsByTagNameNS("*", "spTree")[0];
        for (const sp of Array.from(tree?.children ?? [])) {
          if (part !== slide && phKey(sp)) continue;
          try {
            elements.push(...await shapeToElements(sp, part, part === slide ? layout : undefined, master, identity, ctx));
          } catch {
            ctx.warnings.add("Certains éléments visuels ont été omis.");
          }
        }
      }
      const bg = await background([slide, layout, master], ctx);
      const title = elements.find((e) => e.type === "text")?.text?.split("\n")[0] ?? `Diapositive ${slides.length + 1}`;
      const notesPart = await loadPart(zip, relOfType(slide, "/notesSlide"));
      const notes = Array.from(notesPart?.doc.getElementsByTagNameNS("*", "sp") ?? []).filter((s) => phKey(s)?.type === "body")
        .map((s) => Array.from(s.getElementsByTagNameNS("*", "t")).map((t) => t.textContent).join("")).join("\n");
      slides.push({ id: crypto.randomUUID(), layout: "title", title, background: bg.color, backgroundImage: bg.image, elements, notes: notes || undefined });
    } catch {
      ctx.warnings.add("Une diapositive n’a pas pu être convertie.");
    }
  }
  if (!slides.length) throw new Error("Aucune diapositive trouvée dans ce fichier PowerPoint.");
  const isDark = (hex?: string) => {
    if (!hex || !hex.startsWith("#") || hex.length < 7) return false;
    const r = parseInt(hex.slice(1, 3), 16), g = parseInt(hex.slice(3, 5), 16), b = parseInt(hex.slice(5, 7), 16);
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 < 0.5;
  };
  return { deck: { title: file.name.replace(/\.pptx$/i, ""), description: `${slides.length} diapositives importées`, theme: slides.some((s) => isDark(s.background)) ? "dark" : "light", ratio, slides }, warnings: [...ctx.warnings] };
}
