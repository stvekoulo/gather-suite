"use client";

import { usePathname } from "next/navigation";
import { KeyboardIcon, LifeBuoyIcon } from "lucide-react";
import { ThemeToggle } from "@/components/beui/theme-toggle";
import { Icon } from "@/components/icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { pageTitle } from "@/lib/nav";
import { translate } from "@/lib/i18n/ui-text";
import { openOverlay } from "@/stores/overlay-store";
import { useAppStore } from "@/stores/app-store";
import { GlobalSearchTrigger } from "./global-search";
import { MobileNav } from "./mobile-nav";
import { NotificationsPopover } from "./notifications-popover";
import { WindowControls } from "./window-controls";
import { Brand } from "./workspace-switcher";

// Menu d'aide épuré avec raccourcis et présentation de Gather
function HelpMenu() {
  const language = useAppStore((s) => s.settings.language);
  return (
    <DropdownMenu>
      <Tooltip>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button size="icon" aria-label={translate("Help", language)}>
              <Icon name="help" />
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent>{translate("Help & Shortcuts", language)}</TooltipContent>
      </Tooltip>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuItem onSelect={() => openOverlay({ kind: "shortcuts" })}>
          <KeyboardIcon /> {translate("Keyboard shortcuts", language)}
          <DropdownMenuShortcut>?</DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => openOverlay({ kind: "about" })}>
          <LifeBuoyIcon /> {translate("About Gather", language)}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Barre de titre principale de Gather
export function TitleBar() {
  const pathname = usePathname();
  const language = useAppStore((s) => s.settings.language);
  return (
    <header
      data-tauri-drag-region
      className="apple-glass sticky top-0 z-50 flex h-[53px] w-full shrink-0 select-none items-center overflow-hidden border-b border-hairline pr-3 pt-[env(safe-area-inset-top)] sm:pr-4"
    >
      <div className="flex items-center gap-1.5" data-tauri-drag-region="false">
        <WindowControls placement="left" />
        <Brand className="hidden lg:flex" />
      </div>
      <MobileNav />
      <div
        data-tauri-drag-region
        className="flex h-full min-w-0 flex-1 cursor-default items-center overflow-hidden pl-2 lg:pl-4"
      >
        <h1 className="t-16 min-w-0 flex-1 truncate font-medium text-fg">{pageTitle(pathname, language)}</h1>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2" data-tauri-drag-region="false">
        <GlobalSearchTrigger />
        <div className="hidden md:contents">
          <HelpMenu />
        </div>
        <ThemeToggle className="size-[30px]" iconClassName="size-3.5" />
        <NotificationsPopover />
      </div>
      <WindowControls placement="right" />
    </header>
  );
}
