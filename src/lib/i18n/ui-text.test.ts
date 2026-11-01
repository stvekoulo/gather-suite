import { describe, expect, it } from "vitest";
import { translateScreenText } from "./ui-text";

describe("translateScreenText", () => {
  it("translates known text and keeps its surrounding spaces", () => {
    expect(translateScreenText(" Résultats ")).toBe(" Results ");
  });
  it("translates the parts around a value", () => {
    expect(translateScreenText("Facture en retard : F-12, échue le 3 mai")).toContain("Overdue invoice: F-12, due on");
    expect(translateScreenText("Dépenses Août : 0,00 €")).toBe("Expenses August : 0,00 €");
  });
  it("leaves words alone when no date or amount follows", () => {
    expect(translateScreenText("Mission Mars")).toBe("Mission Mars");
    expect(translateScreenText("Maintenance 3")).toBe("Maintenance 3");
  });
});
