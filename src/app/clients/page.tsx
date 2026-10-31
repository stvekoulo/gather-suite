import type { Metadata } from "next";
import { ClientsPage } from "@/components/pages/clients/clients-page";

export const metadata: Metadata = { title: "Clients" };

export default function Page() {
  return <ClientsPage />;
}
