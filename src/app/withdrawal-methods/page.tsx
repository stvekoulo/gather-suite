import type { Metadata } from "next";
import { WithdrawalMethodsPage } from "@/components/pages/withdrawal-methods/withdrawal-methods-page";

export const metadata: Metadata = { title: "Revenus & Dépenses · Gather" };

export default function Page() {
  return <WithdrawalMethodsPage />;
}
