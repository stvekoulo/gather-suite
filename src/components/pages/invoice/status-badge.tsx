import { AlertCircleIcon, Clock3Icon, PencilLineIcon } from "lucide-react";
import { Icon } from "@/components/icon";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types";
import { translate } from "@/lib/i18n/ui-text";

const STYLES: Record<InvoiceStatus, { labelKey: string; tone: string }> = {
  draft: { labelKey: "Draft", tone: "neutral" },
  sent: { labelKey: "Sent", tone: "warning" },
  paid: { labelKey: "Paid", tone: "success" },
  overdue: { labelKey: "Overdue", tone: "danger" },
};

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: translate("Draft"),
  sent: translate("Sent"),
  paid: translate("Paid"),
  overdue: translate("Overdue"),
};

export function InvoiceStatusBadge({ status, className }: { status: InvoiceStatus; className?: string }) {
  const { labelKey, tone } = STYLES[status];
  const label = translate(labelKey);
  return (
    <span
      className={cn("inline-flex h-[22px] shrink-0 items-center gap-1 rounded-[6px] border pr-1.5 pl-1", className)}
      style={{
        background: `var(--status-${tone}-tint)`,
        borderColor: `var(--status-${tone}-border)`,
        color: `var(--status-${tone})`,
      }}
    >
      {status === "paid" && <Icon name="status-approved" className="text-success" />}
      {status === "sent" && <Clock3Icon className="size-3.5" strokeWidth={2.25} />}
      {status === "overdue" && <AlertCircleIcon className="size-3.5" strokeWidth={2.25} />}
      {status === "draft" && <PencilLineIcon className="size-3.5" strokeWidth={2.25} />}
      <span className="salt text-[12px] leading-none tracking-[-0.24px] whitespace-nowrap">{label}</span>
    </span>
  );
}
