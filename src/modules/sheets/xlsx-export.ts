import JSZip from "jszip";
import type { Spreadsheet } from "@/modules/productivity/types";
import { evaluateCell } from "./formulas";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Générateur OpenXML .xlsx haute fidélité style Gridcraft
export async function createXlsx(sheet: Spreadsheet): Promise<Uint8Array> {
  const zip = new JSZip();

  // [Content_Types].xml
  zip.file(
    "[Content_Types].xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`
  );

  // _rels/.rels
  zip.file(
    "_rels/.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`
  );

  // xl/_rels/workbook.xml.rels
  zip.file(
    "xl/_rels/workbook.xml.rels",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`
  );

  // xl/workbook.xml
  const sheetName = escapeXml(sheet.title || "Feuille 1");
  zip.file(
    "xl/workbook.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="${sheetName}" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>`
  );

  // xl/styles.xml
  zip.file(
    "xl/styles.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="2">
    <font><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color theme="1"/><name val="Calibri"/></font>
  </fonts>
  <fills count="2">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
  </fills>
  <borders count="1">
    <border><left/><right/><top/><bottom/><diagonal/></border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
  </cellXfs>
</styleSheet>`
  );

  // xl/worksheets/sheet1.xml
  // Regroupe les cellules par ligne
  const rowMap = new Map<number, Array<{ col: string; ref: string; raw: string }>>();
  for (const [ref, raw] of Object.entries(sheet.cells)) {
    if (!raw && raw !== "0") continue;
    const match = /^([A-Z]+)([1-9]\d*)$/.exec(ref);
    if (!match) continue;
    const col = match[1];
    const rowNum = parseInt(match[2], 10);
    if (!rowMap.has(rowNum)) rowMap.set(rowNum, []);
    rowMap.get(rowNum)!.push({ col, ref, raw });
  }

  const sortedRows = Array.from(rowMap.keys()).sort((a, b) => a - b);
  let sheetData = "";

  for (const r of sortedRows) {
    const items = rowMap.get(r)!;
    items.sort((a, b) => a.col.localeCompare(b.col));
    let rowXml = `<row r="${r}">`;
    for (const item of items) {
      const isBold = sheet.styles?.[item.ref]?.bold;
      const sAttr = isBold ? ` s="1"` : "";

      if (item.raw.startsWith("=")) {
        const formula = escapeXml(item.raw.slice(1));
        const val = evaluateCell(item.ref, sheet.cells);
        const evalStr = escapeXml(String(val ?? ""));
        rowXml += `<c r="${item.ref}"${sAttr}><f>${formula}</f><v>${evalStr}</v></c>`;
      } else {
        const num = Number(item.raw.replace(",", "."));
        if (!isNaN(num) && item.raw.trim() !== "") {
          rowXml += `<c r="${item.ref}"${sAttr}><v>${num}</v></c>`;
        } else {
          rowXml += `<c r="${item.ref}"${sAttr} t="inlineStr"><is><t>${escapeXml(item.raw)}</t></is></c>`;
        }
      }
    }
    rowXml += "</row>";
    sheetData += rowXml;
  }

  zip.file(
    "xl/worksheets/sheet1.xml",
    `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>${sheetData}</sheetData>
</worksheet>`
  );

  const buffer = await zip.generateAsync({ type: "arraybuffer", compression: "DEFLATE" });
  return new Uint8Array(buffer);
}
