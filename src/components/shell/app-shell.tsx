import { GlobalDialogs } from "@/components/dialogs/global-dialogs";
import { FloatingTimerIsland } from "./floating-timer-island";
import { GlobalSearch } from "./global-search";
import { QuickCapture } from "./quick-capture";
import { KnownClients } from "./known-clients";
import { KeyboardShortcuts } from "./keyboard-shortcuts";
import { Sidebar } from "./sidebar";
import { TitleBar } from "./title-bar";
import { LastRoute } from "./last-route";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col bg-app">
      <FloatingTimerIsland />
      <LastRoute />
      <TitleBar />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <Sidebar />
        <main className="relative flex min-w-0 flex-1 flex-col overflow-hidden">{children}</main>
      </div>
      <GlobalSearch />
      <QuickCapture />
      <KnownClients />
      <GlobalDialogs />
      <KeyboardShortcuts />
    </div>
  );
}
