import type { Metadata } from "next";
import { TimeOffView } from "@/components/time-off/time-off-view";

export const metadata: Metadata = { title: "Calendrier & Gestion du Temps · Gather" };

export default function TimeOffPage() {
  return <TimeOffView />;
}
