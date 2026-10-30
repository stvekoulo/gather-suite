"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { translate } from "@/lib/i18n/ui-text";
import { useAppStore } from "@/stores/app-store";
import { useInvoiceUi } from "./invoice-ui-store";

/** Opens the invoice named by `?open=<id>` (the global search links here), then clears the param. */
export function InvoiceDeepLink() {
  const router = useRouter();
  const openId = useSearchParams().get("open");
  const found = useAppStore((s) => (openId ? s.invoices.some((i) => i.id === openId) : false));

  useEffect(() => {
    if (!openId) return;
    if (found) {
      useInvoiceUi.getState().view(openId);
      router.replace("/invoice", { scroll: false });
    } else if (useAppStore.persist.hasHydrated()) {
      const lang = useAppStore.getState().settings.language || "fr";
      toast.error(translate("Invoice not found", lang), { description: translate("It may have been deleted.", lang) });
      router.replace("/invoice", { scroll: false });
    }
  }, [openId, found, router]);

  return null;
}
