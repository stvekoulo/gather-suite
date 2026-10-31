import { describe, expect, it } from "vitest";
import { summarize } from "./finance-totals";
import { convertAmount, refreshRates, useFxStore } from "./fx";

const rates = { USD: 1.1 };

describe("currency conversion", () => {
  it("converts through EUR and knows pegged FCFA without any download", () => {
    expect(convertAmount(110, "USD", "EUR", rates)).toBeCloseTo(100);
    expect(convertAmount(655.957, "XOF", "EUR", {})).toBeCloseTo(1);
    expect(convertAmount(110, "USD", "XOF", rates)).toBeCloseTo(65595.7);
  });
  it("adds a FCFA and a dollar subscription in the preferred currency", () => {
    const { total, unconverted } = summarize([{ amount: 6559.57, currency: "XOF" }, { amount: 11, currency: "USD" }], "EUR", rates);
    expect(total).toBe(20);
    expect(unconverted.size).toBe(0);
  });
  it("keeps amounts apart when no rate is known", () => {
    const { total, unconverted } = summarize([{ amount: 10, currency: "EUR" }, { amount: 11, currency: "USD" }], "EUR", {});
    expect(total).toBe(10);
    expect(unconverted.get("USD")).toBe(11);
  });
  it("keeps the stored rates when a download fails or is malformed", async () => {
    useFxStore.setState({ rates, updatedAt: "2026-01-01" });
    await expect(refreshRates((async () => new Response("", { status: 502 })) as typeof fetch)).rejects.toThrow();
    await expect(refreshRates((async () => Response.json({ result: "error" })) as typeof fetch)).rejects.toThrow();
    expect(useFxStore.getState().rates).toEqual(rates);
    await refreshRates((async () => Response.json({ result: "success", rates: { USD: 1.2 } })) as typeof fetch);
    expect(useFxStore.getState().rates.USD).toBe(1.2);
  });
});
