export function parseCsv(source: string): string[][] {
  const delimiter = source.split(/\r?\n/, 1)[0].includes(";") ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], value = "", quoted = false;
  for (let i = 0; i < source.length; i++) {
    const char = source[i];
    if (char === '"') { if (quoted && source[i + 1] === '"') { value += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && char === delimiter) { row.push(value); value = ""; }
    else if (!quoted && (char === "\n" || char === "\r")) { if (char === "\r" && source[i + 1] === "\n") i++; row.push(value); rows.push(row); row = []; value = ""; }
    else value += char;
  }
  if (quoted) throw new Error("Guillemets non fermés dans le CSV.");
  if (value || row.length) { row.push(value); rows.push(row); }
  return rows;
}
export const serializeCsv = (rows: string[][]) => rows.map((row) => row.map((value) => `"${value.replace(/"/g, '""')}"`).join(",")).join("\r\n");
