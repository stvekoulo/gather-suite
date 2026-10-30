import JSZip from "jszip";
import type { CellStyle, Spreadsheet } from "@/modules/productivity/types";
import { colToIndex } from "./formulas";

async function parseXmlString(xml: string): Promise<Document> {
  if (typeof DOMParser !== "undefined") {
    return new DOMParser().parseFromString(xml, "application/xml");
  }
  const { DOMParser: XDomParser } = await import("@xmldom/xmldom");
  return new XDomParser().parseFromString(xml, "application/xml") as unknown as Document;
}

// Parseur OpenXML .xlsx haute fidélité inspiré du moteur de calcul Gridcraft
export async function importXlsx(file: File): Promise<Spreadsheet> {
  const zip = await JSZip.loadAsync(await file.arrayBuffer());

  // Lecture des chaînes partagées (sharedStrings.xml)
  const sharedStrings: string[] = [];
  const sstFile = zip.file("xl/sharedStrings.xml");
  if (sstFile) {
    const sstDoc = await parseXmlString(await sstFile.async("text"));
    const sis = Array.from(sstDoc.getElementsByTagName("si"));
    for (const si of sis) {
      const ts = Array.from(si.getElementsByTagName("t"));
      sharedStrings.push(ts.map((t) => t.textContent ?? "").join(""));
    }
  }

  // Lecture des styles (styles.xml) pour extraire les mises en gras
  const boldStyleIndices = new Set<number>();
  const stylesFile = zip.file("xl/styles.xml");
  if (stylesFile) {
    const sDoc = await parseXmlString(await stylesFile.async("text"));
    const boldFontIndices = new Set<number>();
    const fonts = Array.from(sDoc.getElementsByTagName("font"));
    fonts.forEach((f, idx) => {
      if (f.getElementsByTagName("b").length > 0) boldFontIndices.add(idx);
    });
    const xfs = Array.from(sDoc.getElementsByTagName("cellXfs")[0]?.getElementsByTagName("xf") ?? []);
    xfs.forEach((xf, idx) => {
      const fontId = parseInt(xf.getAttribute("fontId") || "0", 10);
      if (boldFontIndices.has(fontId)) boldStyleIndices.add(idx);
    });
  }

  // Découverte du nom de la feuille dans workbook.xml
  let sheetTitle = file.name.replace(/\.xlsx$/i, "");
  const wbFile = zip.file("xl/workbook.xml");
  if (wbFile) {
    const wbDoc = await parseXmlString(await wbFile.async("text"));
    const firstSheet = wbDoc.getElementsByTagName("sheet")[0];
    if (firstSheet?.getAttribute("name")) {
      sheetTitle = firstSheet.getAttribute("name")!;
    }
  }

  // Lecture de la feuille de calcul
  const sheetFile =
    zip.file("xl/worksheets/sheet1.xml") ??
    zip.file(/^xl\/worksheets\/sheet.*\.xml$/i)[0];
  if (!sheetFile) {
    throw new Error("Aucune feuille de calcul valide trouvée dans ce classeur Excel.");
  }

  const sheetDoc = await parseXmlString(await sheetFile.async("text"));
  const cells: Record<string, string> = {};
  const styles: Record<string, CellStyle> = {};
  let maxColIndex = 1;
  let maxRowIndex = 1;

  const cNodes = Array.from(sheetDoc.getElementsByTagName("c"));
  for (const c of cNodes) {
    const ref = c.getAttribute("r");
    if (!ref) continue;

    const match = /^([A-Z]+)([1-9]\d*)$/.exec(ref);
    if (match) {
      maxColIndex = Math.max(maxColIndex, colToIndex(match[1]));
      maxRowIndex = Math.max(maxRowIndex, parseInt(match[2], 10));
    }

    const sAttr = c.getAttribute("s");
    if (sAttr && boldStyleIndices.has(parseInt(sAttr, 10))) {
      styles[ref] = { bold: true };
    }

    const t = c.getAttribute("t");
    const fNode = c.getElementsByTagName("f")[0];
    const vNode = c.getElementsByTagName("v")[0];
    const isNode = c.getElementsByTagName("is")[0];

    if (fNode && fNode.textContent) {
      cells[ref] = `=${fNode.textContent}`;
    } else if (t === "s" && vNode && vNode.textContent) {
      const sIndex = parseInt(vNode.textContent, 10);
      cells[ref] = sharedStrings[sIndex] ?? "";
    } else if (t === "inlineStr" && isNode) {
      const ts = Array.from(isNode.getElementsByTagName("t"));
      cells[ref] = ts.map((item) => item.textContent ?? "").join("");
    } else if (t === "b" && vNode) {
      cells[ref] = vNode.textContent === "1" ? "VRAI" : "FAUX";
    } else if (vNode && vNode.textContent) {
      cells[ref] = vNode.textContent;
    } else if (c.getElementsByTagName("t")[0]?.textContent) {
      cells[ref] = c.getElementsByTagName("t")[0]!.textContent!;
    }
  }

  return {
    id: crypto.randomUUID(),
    title: sheetTitle,
    cells,
    styles: Object.keys(styles).length > 0 ? styles : undefined,
    rows: Math.max(35, maxRowIndex + 5),
    columns: Math.min(26, Math.max(10, maxColIndex + 2)),
  };
}
