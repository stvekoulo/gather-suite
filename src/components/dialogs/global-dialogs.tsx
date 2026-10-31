"use client";

import { useState } from "react";
import { useOverlayStore, type Overlay } from "@/stores/overlay-store";
import { EventDialog } from "./event-dialog";
import { ShortcutsDialog } from "./info-dialogs";
import { AboutDialog } from "./about-dialog";

type Kind = Exclude<Overlay["kind"], "none" | "search" | "capture">;
type Latest = { [K in Kind]?: Extract<Overlay, { kind: K }> };

/**
 * Gestionnaire central des boîtes de dialogue globales de l'application.
 */
export function GlobalDialogs() {
  const overlay = useOverlayStore((s) => s.overlay);
  const close = useOverlayStore((s) => s.close);
  const [latest, setLatest] = useState<Latest>({});
  const [session, setSession] = useState(0);
  const [prev, setPrev] = useState<Overlay>(overlay);

  if (overlay !== prev) {
    setPrev(overlay);
    if (overlay.kind !== "none" && overlay.kind !== "search" && overlay.kind !== "capture") {
      setLatest((l) => ({ ...l, [overlay.kind]: overlay }));
      setSession((n) => n + 1);
    }
  }

  const is = (k: Kind) => overlay.kind === k;

  return (
    <>
      <EventDialog
        open={is("event")}
        session={session}
        onClose={close}
        eventId={latest.event?.eventId}
        date={latest.event?.date}
        start={latest.event?.start}
        end={latest.event?.end}
        allDay={latest.event?.allDay}
      />
      <ShortcutsDialog open={is("shortcuts")} onClose={close} />
      <AboutDialog open={is("about")} onClose={close} />
    </>
  );
}
