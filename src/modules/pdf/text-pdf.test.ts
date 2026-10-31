import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CURRENCIES, formatMoney } from "@/components/pages/invoice/invoice-utils";
import { createTextPdf } from "./text-pdf";

const font = new Uint8Array(readFileSync("assets/og/Geist-Medium.ttf"));

describe("invoice PDF text", () => {
  it.each(CURRENCIES)("exports amounts in %s", async (currency) => {
    const bytes = await createTextPdf("F-1", `Total : ${formatMoney(1522, currency)}`, font);
    expect(bytes.length).toBeGreaterThan(100);
  });
  it("keeps refusing text the font truly cannot draw", async () => {
    await expect(createTextPdf("F-1", "日本語", font)).rejects.toThrow(/caractère/);
  });
});
