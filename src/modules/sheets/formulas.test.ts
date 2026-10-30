import { describe, expect, it } from "vitest";
import { evaluateCell, formatCellValue } from "./formulas";
import { createXlsx } from "./xlsx-export";
import { importXlsx } from "./xlsx-import";
import { getRangeCells } from "./use-sheets-ops";
import type { Spreadsheet } from "@/modules/productivity/types";

describe("spreadsheet formulas & Gridcraft engine", () => {
  const cells = {
    A1: "10",
    A2: "20",
    B1: "=SOMME(A1:A2)",
    B2: "=MOYENNE(A1:A2)",
    C1: '=SI(B1>25;"Oui";"Non")',
    D1: "=2+3*4",
    AA1: "12,5",
    AA2: "2,5",
    AA3: "=SOMME(AA1:AA2)",
  };

  it("evaluates French functions, dependencies and arithmetic precedence", () => {
    expect(evaluateCell("B1", cells)).toBe(30);
    expect(evaluateCell("B2", cells)).toBe(15);
    expect(evaluateCell("C1", cells)).toBe("Oui");
    expect(evaluateCell("D1", cells)).toBe(14);
  });

  it("reports circular references, division by zero, and unsupported code", () => {
    expect(evaluateCell("A1", { A1: "=B1", B1: "=A1" })).toBe("#CYCLE!");
    expect(evaluateCell("A1", { A1: "=1/0" })).toBe("#DIV/0!");
    expect(evaluateCell("A1", { A1: "=process.exit()" })).toBe("#FORMULE!");
  });

  it("evaluates string concatenation, rounding, absolute values and products", () => {
    expect(evaluateCell("A1", { A1: '="Total : " & "100"' })).toBe("Total : 100");
    expect(evaluateCell("A1", { A1: '=CONCATENER("Gather"; " "; "Pro")' })).toBe("Gather Pro");
    expect(evaluateCell("A1", { A1: "=ARRONDI(3.14159; 2)" })).toBe(3.14);
    expect(evaluateCell("A1", { A1: "=ABS(-42)" })).toBe(42);
    expect(evaluateCell("A1", { A1: "=PRODUIT(2; 3; 4)" })).toBe(24);
  });

  it("evaluates logic, date and text functions from Gridcraft", () => {
    expect(evaluateCell("A1", { A1: "=ET(10>5; 20>10)" })).toBe(true);
    expect(evaluateCell("A1", { A1: "=OU(10<5; 20>10)" })).toBe(true);
    expect(evaluateCell("A1", { A1: "=NON(10>5)" })).toBe(false);
    expect(evaluateCell("A1", { A1: '=SIERREUR(1/0; "Erreur détectée")' })).toBe("Erreur détectée");
    expect(evaluateCell("A1", { A1: '=MAJUSCULE("hello")' })).toBe("HELLO");
    expect(evaluateCell("A1", { A1: '=MINUSCULE("HELLO")' })).toBe("hello");
    expect(evaluateCell("A1", { A1: '=NBCAR("Gather")' })).toBe(6);
    expect(evaluateCell("A1", { A1: '=GAUCHE("Excel"; 2)' })).toBe("Ex");
    expect(evaluateCell("A1", { A1: '=DROITE("Excel"; 3)' })).toBe("cel");
    expect(evaluateCell("A1", { A1: "=MOD(10; 3)" })).toBe(1);
  });

  it("formats cell display values without corrupting underlying numbers", () => {
    expect(formatCellValue(1250, "currency")).toContain("1");
    expect(formatCellValue(1250, "currency")).toContain("€");
    expect(formatCellValue(0.25, "percent")).toContain("25");
    expect(formatCellValue(0.25, "percent")).toContain("%");
    expect(formatCellValue(3.14159, "number")).toContain("3");
  });

  it("correctly identifies all cells in a range", () => {
    const range = getRangeCells("A1:B2");
    expect(range).toEqual(["A1", "B1", "A2", "B2"]);
  });

  it("exports a valid OpenXML XLSX package with PK zip header", async () => {
    const sheet: Spreadsheet = {
      id: "test-sheet",
      title: "Rapport Financier",
      cells: { A1: "Revenus", B1: "1500", A2: "Charges", B2: "500", A3: "Bénéfice", B3: "=B1-B2" },
      styles: { A1: { bold: true }, A3: { bold: true } },
      rows: 20,
      columns: 5,
    };
    const bytes = await createXlsx(sheet);
    expect(bytes).toBeInstanceOf(Uint8Array);
    expect(bytes.length).toBeGreaterThan(500);
    expect(bytes[0]).toBe(0x50);
    expect(bytes[1]).toBe(0x4b);

    const file = new File([bytes as BlobPart], "test.xlsx", {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    });
    const imported = await importXlsx(file);
    expect(imported.title).toBe("Rapport Financier");
    expect(imported.cells["A1"]).toBe("Revenus");
    expect(imported.cells["B1"]).toBe("1500");
    expect(imported.cells["B3"]).toBe("=B1-B2");
    expect(imported.styles?.["A1"]?.bold).toBe(true);
  });
});
