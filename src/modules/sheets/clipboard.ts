const colIndex = (col: string) => [...col].reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0);
const colName = (index: number) => { let name = ""; for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) name = String.fromCharCode(65 + ((n - 1) % 26)) + name; return name; };
const parse = (cell: string) => { const m = /^([A-Z]+)(\d+)$/.exec(cell); return m ? { col: colIndex(m[1]), row: Number(m[2]) } : null; };

/** Tab-separated text of a selection, the format every spreadsheet exchanges through the clipboard. */
export function cellsToText(cells: Record<string, string>, from: string, to: string) {
  const a = parse(from), b = parse(to);
  if (!a || !b) return "";
  const lines: string[] = [];
  for (let row = Math.min(a.row, b.row); row <= Math.max(a.row, b.row); row++) {
    const values: string[] = [];
    for (let col = Math.min(a.col, b.col); col <= Math.max(a.col, b.col); col++) values.push(cells[`${colName(col)}${row}`] ?? "");
    lines.push(values.join("\t"));
  }
  return lines.join("\n");
}

export function pasteText(cells: Record<string, string>, at: string, text: string, rows: number) {
  const start = parse(at);
  if (!start) return { cells, rows };
  const lines = text.replace(/\r?\n$/, "").split(/\r?\n/);
  const next = { ...cells };
  lines.forEach((line, r) => line.split("\t").forEach((value, c) => { next[`${colName(start.col + c)}${start.row + r}`] = value; }));
  return { cells: next, rows: Math.max(rows, start.row + lines.length + 1) };
}
