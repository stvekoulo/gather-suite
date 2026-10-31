import { expect, it } from "vitest";
import { cellsToText, pasteText } from "./clipboard";

it("copies a selection as tab-separated text, in any drag direction", () => {
  const cells = { A1: "1", B1: "2", A2: "3" };
  expect(cellsToText(cells, "A1", "B2")).toBe("1\t2\n3\t");
  expect(cellsToText(cells, "B2", "A1")).toBe("1\t2\n3\t");
});
it("pastes from the active cell and grows the sheet", () => {
  const { cells, rows } = pasteText({}, "Y9", "a\tb\tc\nd\r\n", 10);
  expect(cells).toEqual({ Y9: "a", Z9: "b", AA9: "c", Y10: "d" });
  expect(rows).toBe(12);
});
