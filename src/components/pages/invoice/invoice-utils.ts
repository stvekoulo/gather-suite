import { formatLong } from "@/lib/dates";
import { translate } from "@/lib/i18n/ui-text";
import type { Invoice, InvoiceItem, InvoiceStatus, Profile } from "@/lib/types";

export const CURRENCIES = ["EUR", "USD", "GBP", "CHF", "CAD", "XOF", "XAF", "INR"] as const;

const formatters = new Map<string, Intl.NumberFormat>();

export function formatMoney(amount: number, currency: string): string {
  let f = formatters.get(currency);
  if (!f) {
    f = new Intl.NumberFormat("fr-FR", { style: "currency", currency });
    formatters.set(currency, f);
  }
  return f.format(amount);
}

export const lineTotal = (item: Pick<InvoiceItem, "quantity" | "rate">) =>
  Math.round((Number(item.quantity) || 0) * (Number(item.rate) || 0) * 100) / 100;

export const invoiceSubtotal = (inv: Pick<Invoice, "items">) =>
  Math.round(inv.items.reduce((n, i) => n + lineTotal(i), 0) * 100) / 100;
export const invoiceTax = (inv: Pick<Invoice, "items" | "taxRate">) =>
  Math.round(invoiceSubtotal(inv) * (inv.taxRate ?? 0)) / 100;
export const invoiceTotal = (inv: Pick<Invoice, "items" | "taxRate">) =>
  Math.round((invoiceSubtotal(inv) + invoiceTax(inv)) * 100) / 100;

/** A sent invoice past its due date is shown as overdue even before the store says so. */
export function effectiveStatus(inv: Invoice, today: string): InvoiceStatus {
  return inv.status === "sent" && inv.dueDate < today ? "overdue" : inv.status;
}

/** Next number in the INV-YYYY-NNN sequence. */
export function nextInvoiceNumber(invoices: Invoice[], today: string): string {
  const year = today.slice(0, 4);
  let max = 0;
  for (const inv of invoices) {
    const m = /^INV-(\d{4})-(\d+)$/.exec(inv.number);
    if (m && m[1] === year) max = Math.max(max, Number(m[2]));
  }
  return `INV-${year}-${String(max + 1).padStart(3, "0")}`;
}

/** Sums amounts per currency: "$5,200.00 · €900.00". */
export function formatTotals(list: Invoice[]): string {
  const by = new Map<string, number>();
  for (const inv of list) by.set(inv.currency, (by.get(inv.currency) ?? 0) + invoiceTotal(inv));
  if (!by.size) return formatMoney(0, "EUR");
  return [...by.entries()].map(([c, n]) => formatMoney(n, c)).join(" · ");
}

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const identity = (from: Profile) => [from.company, from.name, from.email, from.address, from.siret && `SIRET : ${from.siret}`, from.vatNumber && `TVA : ${from.vatNumber}`].filter((v): v is string => !!v);
const NO_VAT_MENTION = "TVA non applicable, art. 293 B du CGI";
/** French sole traders (SIRET, no VAT number, no rate) must print the franchise mention. */
const legalLines = (inv: Invoice, from: Profile) => [from.legalMentions, from.siret && !from.vatNumber && !inv.taxRate ? NO_VAT_MENTION : ""].filter((v): v is string => !!v);

/** Standalone, print-ready HTML document for an invoice (used for Print and Download). */
export function invoiceHtml(inv: Invoice, from: Profile): string {
  const total = invoiceTotal(inv);
  const rows = inv.items
    .map(
      (i) => `<tr>
        <td>${esc(i.description)}</td>
        <td class="num">${i.quantity}</td>
        <td class="num">${formatMoney(i.rate, inv.currency)}</td>
        <td class="num">${formatMoney(lineTotal(i), inv.currency)}</td>
      </tr>`,
    )
    .join("");
  return `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8" />
<title>${esc(inv.number)} · ${esc(inv.client)}</title>
<style>
  * { box-sizing: border-box; }
  body { margin: 0; padding: 48px; font: 14px/1.45 -apple-system, BlinkMacSystemFont, "Geist", "Segoe UI", sans-serif; color: #1d1d1d; background: #fff; }
  .doc { max-width: 760px; margin: 0 auto; }
  header { display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 24px; border-bottom: 1px solid #e5e7e1; }
  h1 { margin: 0 0 6px; font-size: 24px; font-weight: 600; letter-spacing: -0.02em; }
  .muted { color: #757575; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; padding: 24px 0; }
  .label { font-size: 12px; color: #757575; margin-bottom: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; }
  th { text-align: left; font-size: 12px; font-weight: 500; color: #757575; padding: 10px 0; border-bottom: 1px solid #e5e7e1; }
  td { padding: 12px 0; border-bottom: 1px solid #f2f2f2; }
  .num { text-align: right; font-variant-numeric: tabular-nums; }
  .totals { margin-left: auto; width: 260px; margin-top: 16px; }
  .totals div { display: flex; justify-content: space-between; padding: 6px 0; }
  .totals .grand { border-top: 1px solid #e5e7e1; margin-top: 6px; padding-top: 12px; font-size: 16px; font-weight: 600; }
  .notes { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7e1; white-space: pre-wrap; }
  @page { margin: 16mm; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div class="doc">
  <header>
    <div>
      <h1>Facture</h1>
      <div class="muted">${esc(inv.number)}</div>
    </div>
    <div style="text-align:right">
      ${identity(from).map((line, i) => i ? `<div class="muted">${esc(line)}</div>` : `<div><strong>${esc(line)}</strong></div>`).join("")}
    </div>
  </header>
  <section class="grid">
    <div><div class="label">${translate("Facturé à")}</div><strong>${esc(inv.client)}</strong></div>
    <div><div class="label">${translate("Émise le")}</div>${formatLong(inv.issueDate)}</div>
    <div><div class="label">${translate("Échéance")}</div>${formatLong(inv.dueDate)}</div>
  </section>
  <table>
    <thead><tr><th>Description</th><th class="num">${translate("Qté")}</th><th class="num">${translate("Prix unitaire")}</th><th class="num">${translate("Montant")}</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="totals">
    <div><span class="muted">${translate("Total HT")}</span><span class="num">${formatMoney(invoiceSubtotal(inv), inv.currency)}</span></div>
    ${inv.taxRate ? `<div><span class="muted">${translate("TVA")} ${inv.taxRate} %</span><span class="num">${formatMoney(invoiceTax(inv), inv.currency)}</span></div>` : ""}
    <div class="grand"><span>${translate("Total à payer")}</span><span class="num">${formatMoney(total, inv.currency)}</span></div>
  </div>
  ${inv.notes.trim() ? `<div class="notes"><div class="label">Notes</div>${esc(inv.notes)}</div>` : ""}
  ${legalLines(inv, from).map((line) => `<div class="muted" style="margin-top:12px;font-size:12px">${esc(line)}</div>`).join("")}
</div>
</body>
</html>`;
}

export async function invoicePdfBytes(inv: Invoice, from: Profile) {
  const { createTextPdf } = await import("@/modules/pdf/text-pdf");
  const lines = [...identity(from), "", translate("Client :") + " " + inv.client, translate("Émission :") + " " + inv.issueDate, translate("Échéance :") + " " + inv.dueDate, "", ...inv.items.map((item) => item.description + " · " + item.quantity + " × " + formatMoney(item.rate, inv.currency) + " = " + formatMoney(lineTotal(item), inv.currency)), "", translate("Total HT") + " : " + formatMoney(invoiceSubtotal(inv), inv.currency), ...(inv.taxRate ? [`TVA ${inv.taxRate} % : ` + formatMoney(invoiceTax(inv), inv.currency)] : []), translate("Total à payer") + " : " + formatMoney(invoiceTotal(inv), inv.currency), "", inv.notes, ...legalLines(inv, from)];
  return createTextPdf(inv.number, lines.join("\n"));
}
export async function downloadInvoice(inv: Invoice, from: Profile) {
  const { saveFile, safeFilename } = await import("@/lib/files");
  return saveFile(safeFilename(inv.number) + ".pdf", await invoicePdfBytes(inv, from), "application/pdf");
}
/** Files the invoice PDF in the Documents library. */
export async function fileInvoice(inv: Invoice, from: Profile) {
  const { addToLibrary } = await import("@/lib/library");
  await addToLibrary(`${inv.number}.pdf`, await invoicePdfBytes(inv, from), "application/pdf", "Factures");
}

/** Prints just the invoice document through a hidden iframe, so the app chrome stays out of the printout. */
export function printInvoice(inv: Invoice, from: Profile) {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
  document.body.appendChild(frame);
  const win = frame.contentWindow;
  if (!win) {
    frame.remove();
    window.print();
    return;
  }
  win.document.open();
  win.document.write(invoiceHtml(inv, from));
  win.document.close();
  const cleanup = () => setTimeout(() => frame.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  // Let the iframe lay out before opening the print dialog.
  setTimeout(() => {
    win.focus();
    win.print();
  }, 50);
  setTimeout(() => frame.remove(), 60_000);
}
