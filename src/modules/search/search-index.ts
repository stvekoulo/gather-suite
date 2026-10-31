export type SearchKind = "page" | "client" | "note" | "attachment" | "document" | "task" | "event" | "invoice" | "transaction" | "time" | "sheet" | "deck" | "drawing";
export type SearchEntry = { key: string; kind: SearchKind; id: string; title: string; subtitle?: string; text?: string; date?: string };
export type SearchHit = SearchEntry & { score: number; snippet?: string };

export const normalize = (value: string) => value.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
const tokenize = (value: string) => normalize(value).match(/[\p{L}\p{N}]+/gu) ?? [];

function oneEditApart(a: string, b: string) {
  if (Math.abs(a.length - b.length) > 1) return false;
  if (a.length === b.length) {
    const diff = [...a].flatMap((c, i) => (c === b[i] ? [] : [i]));
    if (diff.length === 2 && diff[1] === diff[0] + 1 && a[diff[0]] === b[diff[1]] && a[diff[1]] === b[diff[0]]) return true;
  }
  let i = 0, j = 0, edits = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) { i++; j++; continue; }
    if (++edits > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else { i++; j++; }
  }
  return edits + (a.length - i) + (b.length - j) <= 1;
}

const TITLE = 1, BODY = 2;
/**
 * Inverted index over everything the user owns. The app rebuilds it whenever a store changes,
 * so results are always current.
 * ponytail: full rebuild on change, fine up to ~50k entries; per-module updates if that grows.
 */
export function buildIndex(entries: SearchEntry[]) {
  const postings = new Map<string, Map<number, number>>();
  entries.forEach((entry, position) => {
    const add = (value: string | undefined, field: number) => {
      for (const token of tokenize(value ?? "")) {
        let row = postings.get(token);
        if (!row) postings.set(token, (row = new Map()));
        row.set(position, (row.get(position) ?? 0) | field);
      }
    };
    add(entry.title, TITLE); add(entry.subtitle, BODY); add(entry.text, BODY);
  });
  return { entries, postings, terms: [...postings.keys()] };
}
export type SearchIndex = ReturnType<typeof buildIndex>;

function snippetOf(text: string | undefined, tokens: string[]) {
  if (!text) return undefined;
  const clean = normalize(text);
  const at = Math.min(...tokens.map((t) => clean.indexOf(t)).filter((i) => i >= 0), Infinity);
  if (at === Infinity) return undefined;
  const start = Math.max(0, at - 40);
  return (start ? "…" : "") + text.slice(start, at + 90).replace(/\s+/g, " ").trim() + "…";
}

/** Every word must match: exactly, as a prefix, or with one typo. Titles and exact matches rank first. */
export function searchIndex(index: SearchIndex, query: string, limit = 60): SearchHit[] {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  let scores = new Map<number, number>();
  let first = true;
  for (const token of tokens) {
    const round = new Map<number, number>();
    for (const term of index.terms) {
      const quality = term === token ? 4 : term.startsWith(token) ? 2 : token.length >= 4 && oneEditApart(term, token) ? 1 : term.includes(token) && token.length >= 3 ? 1 : 0;
      if (!quality) continue;
      for (const [position, fields] of index.postings.get(term)!) {
        const score = quality * (fields & TITLE ? 3 : 1);
        if (score > (round.get(position) ?? 0)) round.set(position, score);
      }
    }
    const previous = scores;
    scores = first ? round : new Map([...round].filter(([p]) => previous.has(p)).map(([p, s]) => [p, s + previous.get(p)!]));
    first = false;
    if (!scores.size) return [];
  }
  return [...scores]
    .sort((a, b) => b[1] - a[1] || (index.entries[b[0]].date ?? "").localeCompare(index.entries[a[0]].date ?? ""))
    .slice(0, limit)
    .map(([position, score]) => ({ ...index.entries[position], score, snippet: snippetOf(index.entries[position].text, tokens) }));
}

/** Plain text of a Tiptap document. */
export function tiptapText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const { text, content } = node as { text?: string; content?: unknown[] };
  return [text ?? "", ...(content ?? []).map(tiptapText)].filter(Boolean).join(" ");
}
/** Words typed on the whiteboard. */
export function drawingText(drawing: string | undefined) {
  if (!drawing) return "";
  try { return (JSON.parse(drawing) as { elements?: { text?: string }[] }).elements?.map((e) => e.text ?? "").filter(Boolean).join(" ") ?? ""; }
  catch { return ""; }
}
