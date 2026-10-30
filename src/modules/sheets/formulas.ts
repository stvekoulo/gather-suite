import type { CellStyle } from "@/modules/productivity/types";

type Value = string | number | boolean;

// Formate l'affichage visuel d'une cellule selon son format Excel (devise, pourcentage, nombre)
export function formatCellValue(val: Value, format?: CellStyle["format"]): string {
  if (val === "" || val === null || val === undefined) return "";
  if (typeof val === "string" && val.startsWith("#")) return val;
  if (typeof val === "number" && Number.isFinite(val)) {
    if (format === "currency") {
      return `${val.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
    }
    if (format === "percent") {
      return `${(val * 100).toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 2 })} %`;
    }
    if (format === "number") {
      return val.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
    }
  }
  return String(val);
}

// Convertit une adresse de colonne (ex. A, Z, AA, AB) en indice numérique (1-based)
export function colToIndex(col: string): number {
  let idx = 0;
  for (let i = 0; i < col.length; i++) {
    idx = idx * 26 + (col.charCodeAt(i) - 64);
  }
  return idx;
}

// Convertit un indice numérique en adresse de colonne Excel (1 -> A, 27 -> AA)
export function indexToCol(idx: number): string {
  let col = "";
  let curr = idx;
  while (curr > 0) {
    const rem = (curr - 1) % 26;
    col = String.fromCharCode(65 + rem) + col;
    curr = Math.floor((curr - 1) / 26);
  }
  return col;
}

// Parse les valeurs brutes en gérant les décimales à virgule et les espaces de milliers
export function parseRawValue(raw: string): Value {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  const normalized = trimmed.replace(/\s/g, "").replace(",", ".");
  if (normalized !== "" && !isNaN(Number(normalized))) return Number(normalized);
  return raw;
}

// Évalue une cellule avec détection de cycles et résolution récursive
export function evaluateCell(address: string, cells: Record<string, string>, visited = new Set<string>()): Value {
  if (visited.has(address)) return "#CYCLE!";
  const raw = cells[address] ?? "";
  if (!raw.startsWith("=")) return parseRawValue(raw);

  const next = new Set(visited).add(address);
  try {
    return evaluate(raw.slice(1), (id) => {
      const value = evaluateCell(id, cells, next);
      if (typeof value === "string" && value.startsWith("#")) throw new Error(value);
      return value === "" ? 0 : value;
    });
  } catch (error) {
    return error instanceof Error && error.message.startsWith("#") ? error.message : "#FORMULE!";
  }
}

// Moteur de calcul Excel clean-room inspiré de Gridcraft
function evaluate(expression: string, resolve: (id: string) => Value): Value {
  const tokens = expression.match(/"(?:[^"]|"")*"|\d+(?:\.\d+)?|[A-Za-z_][A-Za-z_0-9]*|>=|<=|<>|[+\-*/(),;:><=&]/g) ?? [];
  if (tokens.join("").replace(/\s/g, "") !== expression.replace(/\s/g, "")) throw new Error("#FORMULE!");
  let index = 0;

  const peek = () => tokens[index];
  const consume = (token: string) => {
    if (tokens[index++] !== token) throw new Error("#FORMULE!");
  };

  const number = (value: Value) => {
    const n = typeof value === "number" ? value : Number(String(value || 0).replace(",", "."));
    if (!Number.isFinite(n)) throw new Error("#VALEUR!");
    return n;
  };

  const range = (first: string, last: string) => {
    const a = /^([A-Z]+)([1-9]\d*)$/.exec(first);
    const b = /^([A-Z]+)([1-9]\d*)$/.exec(last);
    if (!a || !b) throw new Error("#REF!");
    const colStart = Math.min(colToIndex(a[1]), colToIndex(b[1]));
    const colEnd = Math.max(colToIndex(a[1]), colToIndex(b[1]));
    const rowStart = Math.min(Number(a[2]), Number(b[2]));
    const rowEnd = Math.max(Number(a[2]), Number(b[2]));
    if (rowEnd > 10000 || colEnd - colStart > 200) throw new Error("#REF!");

    const values: Value[] = [];
    for (let col = colStart; col <= colEnd; col++) {
      const colName = indexToCol(col);
      for (let row = rowStart; row <= rowEnd; row++) {
        values.push(resolve(`${colName}${row}`));
      }
    }
    return values;
  };

  function atom(): Value {
    const token = tokens[index++];
    if (!token) throw new Error("#FORMULE!");
    if (token === "-") return -number(atom());
    if (token === "+") return number(atom());
    if (token === "(") {
      const value = comparison();
      consume(")");
      return value;
    }
    if (token.startsWith('"')) return token.slice(1, -1).replace(/""/g, '"');
    if (/^\d/.test(token)) return Number(token);

    const id = token.toUpperCase();
    if (peek() !== "(") {
      if (id === "TRUE" || id === "VRAI") return true;
      if (id === "FALSE" || id === "FAUX") return false;
      if (!/^[A-Z]+[1-9]\d*$/.test(id)) throw new Error("#FORMULE!");
      return resolve(id);
    }

    consume("(");
    if (id === "SIERREUR" || id === "IFERROR") {
      const branches: string[][] = [[]];
      let depth = 0;
      while (peek() !== undefined) {
        const part = peek();
        if (part === ")" && depth === 0) break;
        index++;
        if ((part === "," || part === ";") && depth === 0) branches.push([]);
        else {
          if (part === "(") depth++;
          if (part === ")") depth--;
          branches[branches.length - 1].push(part);
        }
      }
      consume(")");
      if (branches.length !== 2) throw new Error("#FORMULE!");
      try {
        const val = evaluate(branches[0].join(""), resolve);
        return typeof val === "string" && val.startsWith("#") ? evaluate(branches[1].join(""), resolve) : val;
      } catch {
        return evaluate(branches[1].join(""), resolve);
      }
    }

    if (id === "SI" || id === "IF") {
      const branches: string[][] = [[]];
      let depth = 0;
      while (peek() !== undefined) {
        const part = peek();
        if (part === ")" && depth === 0) break;
        index++;
        if ((part === "," || part === ";") && depth === 0) branches.push([]);
        else {
          if (part === "(") depth++;
          if (part === ")") depth--;
          branches[branches.length - 1].push(part);
        }
      }
      consume(")");
      if (branches.length < 2 || branches.length > 3) throw new Error("#FORMULE!");
      const cond = evaluate(branches[0].join(""), resolve);
      const chosen = cond ? branches[1] : branches[2] ?? ["0"];
      return evaluate(chosen.join(""), resolve);
    }

    const args: Value[] = [];
    if (peek() !== ")") {
      do {
        if (/^[A-Za-z]+[1-9]\d*$/.test(peek()) && tokens[index + 1] === ":") {
          const first = tokens[index++].toUpperCase();
          consume(":");
          args.push(...range(first, tokens[index++].toUpperCase()));
        } else {
          args.push(comparison());
        }
        if (peek() !== "," && peek() !== ";") break;
        index++;
      } while (peek() !== ")");
    }
    consume(")");

    const nums = args.filter((v) => typeof v === "number") as number[];
    if (["SUM", "SOMME"].includes(id)) return nums.reduce((a, b) => a + b, 0);
    if (["AVERAGE", "MOYENNE"].includes(id)) {
      if (!nums.length) throw new Error("#DIV/0!");
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    if (id === "MIN") return nums.length ? Math.min(...nums) : 0;
    if (id === "MAX") return nums.length ? Math.max(...nums) : 0;
    if (["COUNT", "NB"].includes(id)) return nums.length;
    if (["CONCAT", "CONCATENATE", "CONCATENER"].includes(id)) return args.map(String).join("");
    if (["ROUND", "ARRONDI"].includes(id)) {
      const val = number(args[0]);
      const dec = args[1] !== undefined ? number(args[1]) : 0;
      const factor = Math.pow(10, dec);
      return Math.round(val * factor) / factor;
    }
    if (["ABS"].includes(id)) return Math.abs(number(args[0]));
    if (["PRODUCT", "PRODUIT"].includes(id)) return nums.reduce((a, b) => a * b, 1);
    if (["POWER", "PUISSANCE"].includes(id)) return Math.pow(number(args[0]), number(args[1] ?? 1));
    if (["SQRT", "RACINE"].includes(id)) {
      const v = number(args[0]);
      if (v < 0) throw new Error("#NOMBRE!");
      return Math.sqrt(v);
    }
    if (["INT", "ENT"].includes(id)) return Math.floor(number(args[0]));
    if (["UPPER", "MAJUSCULE"].includes(id)) return String(args[0] ?? "").toUpperCase();
    if (["LOWER", "MINUSCULE"].includes(id)) return String(args[0] ?? "").toLowerCase();
    if (["AND", "ET"].includes(id)) return args.every(Boolean);
    if (["OR", "OU"].includes(id)) return args.some(Boolean);
    if (["NOT", "NON"].includes(id)) return !args[0];
    if (["IFERROR", "SIERREUR"].includes(id)) return typeof args[0] === "string" && args[0].startsWith("#") ? (args[1] ?? "") : args[0];
    if (["TODAY", "AUJOURDHUI"].includes(id)) return new Date().toISOString().slice(0, 10);
    if (["NOW", "MAINTENANT"].includes(id)) return new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
    if (["LEN", "NBCAR"].includes(id)) return String(args[0] ?? "").length;
    if (["LEFT", "GAUCHE"].includes(id)) return String(args[0] ?? "").slice(0, args[1] !== undefined ? number(args[1]) : 1);
    if (["RIGHT", "DROITE"].includes(id)) {
      const s = String(args[0] ?? "");
      return s.slice(Math.max(0, s.length - (args[1] !== undefined ? number(args[1]) : 1)));
    }
    if (["MID", "STXT"].includes(id)) {
      const s = String(args[0] ?? "");
      return s.slice(Math.max(0, number(args[1]) - 1), Math.max(0, number(args[1]) - 1) + number(args[2]));
    }
    if (["TRIM", "SUPPRESPACE"].includes(id)) return String(args[0] ?? "").trim();
    if (["MOD"].includes(id)) return number(args[0]) % number(args[1]);

    throw new Error("#FORMULE!");
  }

  function product(): Value {
    let value = atom();
    while (peek() === "*" || peek() === "/") {
      const op = tokens[index++];
      const right = number(atom());
      if (op === "/" && right === 0) throw new Error("#DIV/0!");
      value = op === "*" ? number(value) * right : number(value) / right;
    }
    return value;
  }

  function sum(): Value {
    let value = product();
    while (peek() === "+" || peek() === "-" || peek() === "&") {
      const op = tokens[index++];
      const right = product();
      if (op === "&") {
        value = String(value) + String(right);
      } else {
        value = op === "+" ? number(value) + number(right) : number(value) - number(right);
      }
    }
    return value;
  }

  function comparison(): Value {
    const left = sum();
    const op = peek();
    if (![">", "<", ">=", "<=", "=", "<>"].includes(op)) return left;
    index++;
    const right = sum();
    if (op === "=") return left === right;
    if (op === "<>") return left !== right;
    const a = number(left);
    const b = number(right);
    return op === ">" ? a > b : op === "<" ? a < b : op === ">=" ? a >= b : a <= b;
  }

  const result = comparison();
  if (index !== tokens.length || (typeof result === "number" && !Number.isFinite(result))) throw new Error("#FORMULE!");
  return result;
}
