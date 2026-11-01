// Lists French text in the interface that English mode would still show in French.
// Usage: node scripts/i18n-audit.mjs [--json]
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import ts from "typescript";

const FRENCH = /[éèêëàâùûçôîïœ]|\b(le|la|les|des|du|une|un|et|ou|au|aux|de|vos|votre|vous|pour|avec|sans|dans|sur|aucun|aucune|nouveau|nouvelle|ajouter|supprimer|modifier|fermer|ouvrir|enregistrer|annuler|choisir|rechercher|voir|mois|jour|jours|semaine|année|heures|fichier|fichiers|page|pages|titre|nom|date|montant|facture|client|tâche|note|notes)\b/i;
const VISIBLE_ATTRS = new Set(["placeholder", "title", "aria-label", "alt", "label", "description", "heading", "subtitle", "hint"]);
const SKIP = /(^|[\\/])(i18n|__tests__)[\\/]|\.test\.|[\\/]e2e[\\/]/;

const dictionary = () => {
  const dictDir = "src/lib/i18n";
  const keys = new Set();
  for (const f of readdirSync(dictDir)) {
    if (!f.startsWith("dict-")) continue;
    const source = ts.createSourceFile(f, readFileSync(join(dictDir, f), "utf8"), ts.ScriptTarget.Latest, true);
    const visit = (n) => {
      if (ts.isPropertyAssignment(n)) {
        // A French key (fr→en tables) or a French value (en→fr tables) both translate.
        if (f.includes("fr-en") || f === "dict-app.ts") { if (ts.isStringLiteralLike(n.name)) keys.add(n.name.text); else if (ts.isIdentifier(n.name)) keys.add(n.name.text); }
        else if (ts.isStringLiteralLike(n.initializer)) keys.add(n.initializer.text);
      }
      ts.forEachChild(n, visit);
    };
    visit(source);
  }
  return keys;
};

const files = [];
const walk = (d) => { for (const e of readdirSync(d, { withFileTypes: true })) { const p = join(d, e.name); if (e.isDirectory()) walk(p); else if (/\.tsx?$/.test(e.name) && !SKIP.test(p)) files.push(p); } };
walk("src");

const dict = dictionary();
const findings = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  const sf = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const add = (node, value, kind) => {
    const v = value.replace(/\s+/g, " ").trim();
    if (v.length < 2 || !/[A-Za-zÀ-ÿ]/.test(v) || !FRENCH.test(v)) return;
    findings.push({ file: file.replace(/\\/g, "/"), line: sf.getLineAndCharacterOfPosition(node.getStart()).line + 1, kind, text: v, inDict: dict.has(v) });
  };
  const isTranslateArg = (n) => ts.isCallExpression(n.parent) && /^(translate|t)$/.test(n.parent.expression.getText());
  const visit = (n) => {
    if (ts.isJsxText(n) && n.text.trim()) add(n, n.text, "jsx");
    else if (ts.isJsxAttribute(n) && n.initializer && ts.isStringLiteral(n.initializer) && VISIBLE_ATTRS.has(n.name.getText())) add(n, n.initializer.text, "attr");
    else if (ts.isStringLiteralLike(n) && isTranslateArg(n)) add(n, n.text, "wrapped");
    else if (ts.isStringLiteralLike(n) && !ts.isJsxAttribute(n.parent) && !ts.isImportDeclaration(n.parent)) add(n, n.text, "string");
    else if (ts.isTemplateExpression(n)) { add(n.head, n.head.text, "template"); n.templateSpans.forEach((s) => add(s.literal, s.literal.text, "template")); }
    ts.forEachChild(n, visit);
  };
  visit(sf);
}
const missing = findings.filter((f) => f.kind === "jsx" || f.kind === "attr" || (f.kind === "wrapped" && !f.inDict));
if (process.argv.includes("--json")) console.log(JSON.stringify(findings));
else {
  const count = (k) => findings.filter((f) => f.kind === k).length;
  console.log(`JSX text not wrapped: ${count("jsx")}, attributes not wrapped: ${count("attr")}, wrapped but missing from the dictionary: ${findings.filter((f) => f.kind === "wrapped" && !f.inDict).length}`);
  console.log(`Other strings to review: ${count("string")} (in dictionary: ${findings.filter((f) => f.kind === "string" && f.inDict).length}), templates: ${count("template")}`);
  if (process.argv.includes("--list")) for (const f of missing) console.log(`${f.file}:${f.line} [${f.kind}] ${f.text}`);
  process.exitCode = missing.length ? 1 : 0;
}
