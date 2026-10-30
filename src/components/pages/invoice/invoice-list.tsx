"use client";
import { translate } from "@/lib/i18n/ui-text";

import { CheckIcon, CopyIcon, EyeIcon, PencilIcon, PlusIcon, ReceiptIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { addDays, formatShort } from "@/lib/dates";
import type { Invoice, InvoiceStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { uid, useAppStore } from "@/stores/app-store";
import { useInvoiceUi } from "./invoice-ui-store";
import { formatMoney, nextInvoiceNumber } from "./invoice-utils";
import { InvoiceStatusBadge } from "./status-badge";

export type InvoiceRowItem = { inv: Invoice; status: InvoiceStatus; total: number };

export function Stat({
  label,
  value,
  count,
  danger,
  onClick,
}: {
  label: string;
  value: string;
  count: number;
  danger?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="t-12 flex w-full items-center justify-between text-fg-2">
        {label}
        <span className="text-placeholder tabular-nums">{count}</span>
      </span>
      <span
        className={cn(
          "truncate text-[20px] leading-none font-medium tracking-[-0.4px] tabular-nums",
          danger ? "text-danger" : "text-fg",
        )}
      >
        {value}
      </span>
    </>
  );
  const base =
    "flex min-w-0 flex-col gap-2.5 border-hairline px-4 py-3.5 text-left max-md:odd:border-r max-md:nth-[-n+2]:border-b md:border-r md:last:border-r-0";
  if (!onClick) return <div className={base}>{body}</div>;
  return (
    <button
      type="button"
      title={`Afficher ${label.toLowerCase()}`}
      onClick={onClick}
      className={cn(base, "outline-none transition-colors duration-150 hover-fine:bg-hover/50 focus-visible:bg-hover")}
    >
      {body}
    </button>
  );
}

export function InvoicesList({
  visible,
  filtered,
  today,
  onClearFilters,
  onNewInvoice,
  onViewInvoice,
}: {
  visible: InvoiceRowItem[];
  filtered: boolean;
  today: string;
  onClearFilters: () => void;
  onNewInvoice: () => void;
  onViewInvoice: (id: string) => void;
}) {
  if (visible.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 px-4 py-16 text-center">
        <span className="flex size-10 items-center justify-center rounded-lg bg-app">
          <ReceiptIcon className="size-4 text-icon" />
        </span>
        <div className="flex flex-col gap-1.5">
          <p className="t-14 text-fg">{filtered ? translate("No invoices match") : translate("No invoices yet")}</p>
          <p className="t-14 text-fg-2">
            {filtered ? translate("Try a different search or status.") : translate("Create your first invoice to get paid.")}
          </p>
        </div>
        {filtered ? (
          <Button onClick={onClearFilters}>{translate("Clear filters")}</Button>
        ) : (
          <Button onClick={onNewInvoice}>
            <PlusIcon />{translate("New invoice")}
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <ul className="md:hidden">
        {visible.map(({ inv, status: st, total }) => (
          <li key={inv.id} className="flex items-center border-b border-subtle last:border-b-0">
            <button
              type="button"
              onClick={() => onViewInvoice(inv.id)}
              className="flex min-h-16 min-w-0 flex-1 flex-col gap-2 py-3 pl-4 text-left outline-none focus-visible:bg-hover"
            >
              <span className="flex w-full items-center gap-3">
                <span className="t-14 min-w-0 flex-1 truncate text-fg">{inv.client}</span>
                <span className="t-14 shrink-0 text-table tabular-nums">{formatMoney(total, inv.currency)}</span>
              </span>
              <span className="flex w-full items-center gap-3">
                <span className="t-12 min-w-0 flex-1 truncate text-fg-2">
                  {inv.number} ·{" "}
                  <span className={cn(st === "overdue" && "text-danger")}>Échéance {formatShort(inv.dueDate)}</span>
                </span>
                <InvoiceStatusBadge status={st} />
              </span>
            </button>
            <div className="px-1.5">
              <RowMenu invoice={inv} today={today} triggerClassName="size-10" />
            </div>
          </li>
        ))}
      </ul>
      <table className="w-full table-fixed border-collapse max-md:hidden">
        <colgroup>
          <col className="w-[160px]" />
          <col />
          <col className="w-[120px]" />
          <col className="w-[120px]" />
          <col className="w-[150px]" />
          <col className="w-[120px]" />
          <col className="w-[56px]" />
        </colgroup>
        <thead>
          <tr className="h-10 bg-app text-left">
            <th className="t-14 px-4 font-medium text-fg-2">{translate("Number")}</th>
            <th className="t-14 px-2 font-medium text-fg-2">{translate("Client")}</th>
            <th className="t-14 px-2 font-medium text-fg-2">{translate("Issued")}</th>
            <th className="t-14 px-2 font-medium text-fg-2">{translate("Due")}</th>
            <th className="t-14 px-2 text-right font-medium text-fg-2">{translate("Amount")}</th>
            <th className="t-14 px-4 font-medium text-fg-2">{translate("Status")}</th>
            <th className="pr-3">
              <span className="sr-only">{translate("Actions")}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map(({ inv, status: st, total }) => (
            <tr
              key={inv.id}
              onClick={() => onViewInvoice(inv.id)}
              className="h-14 cursor-pointer border-b border-subtle transition-colors duration-150 last:border-b-0 hover-fine:bg-hover/50"
            >
              <td className="px-4">
                <button
                  type="button"
                  className="t-14 rounded text-table outline-none focus-visible:ring-3 focus-visible:ring-brand/15"
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewInvoice(inv.id);
                  }}
                >
                  {inv.number}
                </button>
              </td>
              <td className="t-14 truncate px-2 text-table">{inv.client}</td>
              <td className="t-14 px-2 text-table">
                {formatShort(inv.issueDate)}, {inv.issueDate.slice(0, 4)}
              </td>
              <td className={cn("t-14 px-2", st === "overdue" ? "text-danger" : "text-table")}>
                {formatShort(inv.dueDate)}, {inv.dueDate.slice(0, 4)}
              </td>
              <td className="t-14 px-2 text-right text-table tabular-nums">{formatMoney(total, inv.currency)}</td>
              <td className="px-4">
                <InvoiceStatusBadge status={st} />
              </td>
              <td className="pr-3 text-right" onClick={(e) => e.stopPropagation()}>
                <RowMenu invoice={inv} today={today} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}

function RowMenu({ invoice, today, triggerClassName }: { invoice: Invoice; today: string; triggerClassName?: string }) {
  const invoices = useAppStore((s) => s.invoices);
  const saveInvoice = useAppStore((s) => s.saveInvoice);
  const setInvoiceStatus = useAppStore((s) => s.setInvoiceStatus);
  const deleteInvoice = useAppStore((s) => s.deleteInvoice);
  const view = useInvoiceUi((s) => s.view);
  const edit = useInvoiceUi((s) => s.edit);

  const mark = (status: InvoiceStatus) => {
    setInvoiceStatus(invoice.id, status);
    toast.success(status === "paid" ? translate("Marked as paid") : translate("Marked as sent"), {
      description: `${invoice.number} · ${invoice.client}`,
      action: { label: translate("Cancel"), onClick: () => useAppStore.getState().setInvoiceStatus(invoice.id, invoice.status) },
    });
  };

  const duplicate = () => {
    const copy = saveInvoice({
      ...invoice,
      id: undefined,
      number: nextInvoiceNumber(invoices, today),
      status: "draft",
      issueDate: today,
      dueDate: addDays(today, 30),
      items: invoice.items.map((i) => ({ ...i, id: uid("it") })),
    });
    toast.success(translate("Invoice duplicated"), {
      description: `${copy.number} · ${translate("Draft")}`,
      action: { label: translate("Edit"), onClick: () => useInvoiceUi.getState().edit(copy.id) },
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm" className={triggerClassName} aria-label={`Actions pour ${invoice.number}`}>
          <Icon name="more" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48 max-md:[&_[role^=menuitem]]:min-h-10">
        <DropdownMenuItem onSelect={() => view(invoice.id)}>
          <EyeIcon /> {translate("View")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => edit(invoice.id)}>
          <PencilIcon />{translate("Edit")}
        </DropdownMenuItem>
        {invoice.status === "draft" && (
          <DropdownMenuItem onSelect={() => mark("sent")}>
            <SendIcon /> {translate("Mark as sent")}
          </DropdownMenuItem>
        )}
        {invoice.status !== "paid" && (
          <DropdownMenuItem onSelect={() => mark("paid")}>
            <CheckIcon /> {translate("Mark as paid")}
          </DropdownMenuItem>
        )}
        <DropdownMenuItem onSelect={duplicate}>
          <CopyIcon /> {translate("Duplicate")}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => deleteInvoice(invoice.id)}>
          <Trash2Icon />{translate("Delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
