"use client";
import { translate } from "@/lib/i18n/ui-text";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useCallback, useRef, useSyncExternalStore } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PanelLeftCloseIcon, PanelLeftIcon, SettingsIcon, UserIcon } from "lucide-react";
import { motion } from "motion/react";
import { Icon } from "@/components/icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { NAV_GROUPS, SETTINGS_ITEM, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/stores/app-store";
import { useSidebarStore } from "@/stores/sidebar-store";

const noopSubscribe = () => () => {};

function NavLink({ item, active, collapsed }: { item: NavItem; active: boolean; collapsed?: boolean }) {
  const content = (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative flex h-8 w-full items-center gap-2 rounded-lg outline-none transition-colors duration-150 max-lg:h-10",
        collapsed ? "justify-center px-0" : "px-2",
        "focus-visible:ring-2 focus-visible:ring-brand/40",
        active ? "text-fg" : "text-fg-2 hover-fine:bg-hover hover-fine:text-fg",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-active-pill"
          transition={{ type: "spring", damping: 30, stiffness: 400 }}
          className="absolute inset-0 rounded-lg bg-selected"
        />
      )}
      <span className={cn("relative z-10 flex min-w-0 items-center gap-2", collapsed ? "justify-center" : "flex-1")}>
        <Icon name={item.icon} className={cn("size-4 shrink-0", active && item.icon === "nav-calendar" ? "text-brand" : undefined)} />
        {!collapsed && <span className="t-14 salt min-w-0 flex-1 truncate">{translate(item.label)}</span>}
      </span>
    </Link>
  );

  if (!collapsed) return content;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      <TooltipContent side="right" sideOffset={12}>
        {translate(item.label)}
      </TooltipContent>
    </Tooltip>
  );
}

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) return <div className="my-1.5 h-px w-full bg-hairline/60" />;
  return (
    <div className="flex h-7 items-center px-2">
      <span className="salt font-mono text-[11px] font-medium uppercase tracking-wider text-section">{children}</span>
    </div>
  );
}

function ThemeRow({ collapsed }: { collapsed?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const dark = mounted && resolvedTheme === "dark";

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setTheme(dark ? "light" : "dark")}
            className="w-full text-fg-2 hover:text-fg"
            aria-label={translate("Dark mode")}
          >
            <Icon name="moon" className="size-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="right" sideOffset={12}>
          {translate("Dark mode")} ({dark ? "Activé" : "Désactivé"})
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <label className="flex h-8 w-full cursor-pointer items-center gap-2 overflow-hidden rounded-lg px-2 text-fg-2 transition-colors duration-150 hover-fine:bg-hover max-lg:h-10">
      <Icon name="moon" />
      <span className="t-14 salt min-w-0 flex-1">{translate("Dark mode")}</span>
      <Switch
        checked={dark}
        onCheckedChange={(v) => setTheme(v ? "dark" : "light")}
        aria-label={translate("Dark mode")}
        className="mr-0"
      />
    </label>
  );
}

function AccountMenu({ collapsed }: { collapsed?: boolean }) {
  const profile = useAppStore((s) => s.profile);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "flex w-full items-center overflow-hidden border-t border-hairline pt-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
            collapsed ? "justify-center px-0" : "gap-2.5 px-2"
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-brand-tint p-2">
            <span className="font-inter text-[13px] leading-none font-semibold tracking-[-0.21px] whitespace-nowrap text-brand">
              {profile.initials || "AU"}
            </span>
          </span>
          {!collapsed && (
            <span className="flex min-w-0 flex-1 flex-col gap-1 overflow-hidden leading-none whitespace-nowrap">
              <span className="truncate text-[13px] font-medium tracking-[-0.21px] text-fg">{profile.name || "Utilisateur local"}</span>
              <span className="salt truncate text-[11px] tracking-[-0.12px] text-fg-2">{profile.email || "local@gather"}</span>
            </span>
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent side={collapsed ? "right" : "top"} align="start" sideOffset={10} className="w-[215px]">
        <DropdownMenuLabel className="t-12 text-fg-2">Profil local : {profile.name || "Utilisateur local"}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/personal-details">
            <UserIcon />{translate("Personal details")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings">
            <SettingsIcon />{translate("Settings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function SidebarBody({ className, collapsed }: { className?: string; collapsed?: boolean }) {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href || pathname.startsWith(href + "/");

  return (
    <div className={cn("flex min-h-0 flex-1 flex-col justify-between gap-6 overflow-y-auto p-2.5 [scrollbar-width:none]", className)}>
      <nav aria-label="Navigation principale" className="flex w-full flex-col gap-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="flex w-full flex-col gap-0.5">
            <SectionLabel collapsed={collapsed}>{translate(group.label)}</SectionLabel>
            {group.items.map((item) => (
              <NavLink key={item.href} item={item} active={isActive(item.href)} collapsed={collapsed} />
            ))}
          </div>
        ))}
      </nav>
      <div className="flex w-full flex-col gap-2.5">
        <div className="flex w-full flex-col gap-0.5">
          <ThemeRow collapsed={collapsed} />
          <NavLink item={SETTINGS_ITEM} active={isActive(SETTINGS_ITEM.href)} collapsed={collapsed} />
        </div>
        <AccountMenu collapsed={collapsed} />
      </div>
    </div>
  );
}

export function Sidebar() {
  const isCollapsed = useSidebarStore((s) => s.isCollapsed);
  const width = useSidebarStore((s) => s.width);
  const toggleCollapse = useSidebarStore((s) => s.toggleCollapse);
  const setWidth = useSidebarStore((s) => s.setWidth);
  const isDragging = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      isDragging.current = true;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const onMouseMove = (moveEvent: MouseEvent) => {
        if (!isDragging.current) return;
        setWidth(moveEvent.clientX);
      };

      const onMouseUp = () => {
        isDragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
        window.removeEventListener("mousemove", onMouseMove);
        window.removeEventListener("mouseup", onMouseUp);
      };

      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    },
    [setWidth]
  );

  return (
    <aside
      style={{ width: isCollapsed ? 64 : width }}
      className={cn(
        "relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-hairline bg-app transition-[width] duration-200 ease-(--ease-out) lg:flex",
        isCollapsed ? "w-16" : ""
      )}
    >
      {/* Top Collapse Button Header */}
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-hairline px-3">
        {!isCollapsed ? (
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="Gather" className="size-5 rounded-md object-contain select-none" />
            <span className="text-[12px] font-semibold text-fg-2 tracking-wide uppercase">Menu</span>
          </div>
        ) : (
          <button
            type="button"
            onClick={toggleCollapse}
            title="Agrandir le menu"
            className="mx-auto flex size-7 items-center justify-center rounded-md hover:bg-hover transition-colors"
          >
            <img src="/logo.png" alt="Gather" className="size-5 rounded-md object-contain select-none" />
          </button>
        )}
        {!isCollapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleCollapse}
            title="Réduire le menu"
            aria-label="Réduire le menu"
            className="text-icon hover:text-fg"
          >
            <PanelLeftCloseIcon className="size-4" />
          </Button>
        )}
      </div>

      <SidebarBody collapsed={isCollapsed} />

      {/* Draggable Resize Rail */}
      {!isCollapsed && (
        <div
          onMouseDown={onMouseDown}
          onDoubleClick={toggleCollapse}
          title="Glisser pour redimensionner / Double-cliquer pour réduire"
          className="absolute top-0 right-0 z-20 h-full w-1.5 cursor-col-resize transition-colors hover:bg-brand/40 active:bg-brand"
        />
      )}
    </aside>
  );
}
