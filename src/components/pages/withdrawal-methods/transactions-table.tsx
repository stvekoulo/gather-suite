"use client";

import { useMemo, useState } from "react";
import { ArrowDownRightIcon, ArrowUpRightIcon, DownloadIcon, FileTextIcon, SearchIcon, Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { saveFile } from "@/lib/files";
import { toast } from "sonner";
import type { FinanceTransaction } from "./types";

interface TransactionsTableProps {
  transactions: FinanceTransaction[];
  onDeleteTransaction: (id: string) => void;
}

// Table interactive des écritures financières avec filtres et export CSV
export function TransactionsTable({ transactions, onDeleteTransaction }: TransactionsTableProps) {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("all");
  const [query, setQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach((t) => set.add(t.category));
    return Array.from(set);
  }, [transactions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return transactions.filter((t) => {
      const matchType = filterType === "all" || t.type === filterType;
      const matchCat = selectedCategory === "all" || t.category === selectedCategory;
      const matchQuery =
        !q ||
        t.title.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q) ||
        (t.invoiceNumber && t.invoiceNumber.toLowerCase().includes(q));
      return matchType && matchCat && matchQuery;
    });
  }, [transactions, filterType, selectedCategory, query]);

  const handleExportCsv = async () => {
    try {
      const headers = ["ID", "Type", "Titre", "Montant (€)", "Catégorie", "Date", "Facture Liée"];
      const rows = filtered.map((t) => [
        t.id,
        t.type === "income" ? "Revenu" : "Dépense",
        `"${t.title.replace(/"/g, '""')}"`,
        t.amount,
        `"${t.category}"`,
        t.date,
        t.invoiceNumber || "",
      ]);
      const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      await saveFile("grand-livre-gather.csv", new Blob([csv], { type: "text/csv;charset=utf-8" }));
      toast.success("Grand livre exporté en CSV");
    } catch {
      toast.error("Échec de l'export CSV");
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-hairline bg-surface overflow-hidden shadow-2xs">
      {/* Barre d'outils et filtres */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-hairline p-4">
        <div className="flex items-center gap-1.5 rounded-xl border border-hairline bg-surface-2/40 p-1">
          {(["all", "income", "expense"] as const).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setFilterType(type)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                filterType === type
                  ? "bg-surface text-fg font-semibold shadow-xs"
                  : "text-fg-2 hover:text-fg"
              }`}
            >
              {type === "all" ? "Toutes les écritures" : type === "income" ? "Revenus" : "Dépenses"}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Recherche */}
          <div className="relative">
            <SearchIcon className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-fg-2" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une écriture..."
              className="h-8 w-44 sm:w-56 pl-8 text-xs bg-surface-2/30"
            />
          </div>

          {/* Filtre catégorie */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-8 rounded-lg border border-hairline bg-surface-2/30 px-2 text-xs font-medium text-fg outline-none"
          >
            <option value="all">Toutes les catégories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <Button variant="outline" size="sm" onClick={handleExportCsv} className="h-8 gap-1.5 text-xs">
            <DownloadIcon className="size-3.5" /> Exporter CSV
          </Button>
        </div>
      </div>

      {/* Table des écritures */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-hairline bg-surface-2/30 font-semibold text-fg-2">
            <tr>
              <th className="px-4 py-2.5">Date</th>
              <th className="px-4 py-2.5">Libellé</th>
              <th className="px-4 py-2.5">Catégorie</th>
              <th className="px-4 py-2.5">Compte / Référence</th>
              <th className="px-4 py-2.5 text-right">Montant</th>
              <th className="px-4 py-2.5 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-xs text-fg-2 italic">
                  Aucune transaction ne correspond aux critères sélectionnés.
                </td>
              </tr>
            ) : (
              filtered.map((t) => (
                <tr key={t.id} className="hover:bg-hover/40 transition-colors">
                  <td className="px-4 py-3 font-mono text-[11px] text-fg-2 whitespace-nowrap">
                    {t.date}
                  </td>
                  <td className="px-4 py-3 font-medium text-fg">
                    <div className="flex items-center gap-2">
                      <span
                        className={`flex size-6 shrink-0 items-center justify-center rounded-lg ${
                          t.type === "income"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-red-500/10 text-red-600"
                        }`}
                      >
                        {t.type === "income" ? (
                          <ArrowUpRightIcon className="size-3.5" />
                        ) : (
                          <ArrowDownRightIcon className="size-3.5" />
                        )}
                      </span>
                      <span className="truncate max-w-xs">{t.title}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-fg-2 whitespace-nowrap">
                    <span className="rounded-full bg-surface-2 px-2.5 py-0.5 text-[11px] font-medium text-fg">
                      {t.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-fg-2 whitespace-nowrap">
                    {t.invoiceNumber ? (
                      <span className="inline-flex items-center gap-1 font-mono text-brand font-medium text-[11px]">
                        <FileTextIcon className="size-3" /> {t.invoiceNumber}
                      </span>
                    ) : (
                      <span>{t.methodLabel || "Virement"}</span>
                    )}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-mono font-bold whitespace-nowrap ${
                      t.type === "income"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : "text-fg"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                    {t.amount.toLocaleString("fr-FR", { minimumFractionDigits: 2 })} €
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteTransaction(t.id)}
                      className="size-7 p-0 text-red-600 hover:bg-red-500/10"
                      title="Supprimer la transaction"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
