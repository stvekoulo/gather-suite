"use client";

import { useState } from "react";
import {
  BellIcon,
  CalendarDaysIcon,
  DatabaseIcon,
  PaletteIcon,
  SlidersHorizontalIcon,
} from "lucide-react";
import { APP_CONFIG } from "@/config/app-config";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { PageHeader, PageRoot } from "@/components/pages/shared/page-chrome";
import { useTranslate } from "@/lib/i18n/ui-text";
import { LanguageSetting } from "./language-setting";
import { PaletteSetting } from "./palette-setting";
import { AppearanceTab, GeneralTab, NotificationsTab, TimeOffTab } from "./settings-tabs";
import { DataTab } from "./data-tab";

const TABS = [
  { value: "general", label: "General", icon: SlidersHorizontalIcon },
  { value: "time-off", label: "Time off", icon: CalendarDaysIcon },
  { value: "notifications", label: "Notifications", icon: BellIcon },
  { value: "appearance", label: "Appearance", icon: PaletteIcon },
  { value: "data", label: "Data", icon: DatabaseIcon },
] as const;

export function SettingsPage() {
  const tr = useTranslate();
  const [tab, setTab] = useState<string>("general");
  return (
    <PageRoot>
      <PageHeader
        title={
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Gather Logo"
              className="size-8 rounded-lg object-contain select-none shadow-2xs"
            />
            <span>{tr("Settings")}</span>
          </div>
        }
        description={tr("Changes are saved automatically")}
      />
      <Tabs
        value={tab}
        onValueChange={setTab}
        orientation="vertical"
        className="mx-auto w-full max-w-[960px] flex-col gap-4 p-4 md:flex-row md:items-start md:gap-6"
      >
        <TabsList
          className={cn(
            "h-fit shrink-0 gap-0.5 bg-transparent p-0 md:sticky md:top-[84px] md:w-[200px]",
            "max-md:sticky max-md:top-0 max-md:z-10 max-md:-mx-4 max-md:-mt-4 max-md:w-auto max-md:flex-row! max-md:justify-start max-md:gap-1 max-md:overflow-x-auto max-md:overscroll-x-contain max-md:rounded-none max-md:border-b max-md:border-hairline max-md:bg-app max-md:px-4 max-md:py-2",
            "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          )}
        >
          {TABS.map(({ value, label, icon: Glyph }) => (
            <TabsTrigger
              key={value}
              value={value}
              onClick={(e) => e.currentTarget.scrollIntoView({ block: "nearest", inline: "nearest" })}
              className={cn(
                "t-14 salt h-8 w-full flex-none justify-start gap-2 rounded-lg border-0 px-2 text-[14px] text-fg-2 after:hidden",
                "max-md:h-10 max-md:w-auto! max-md:px-3",
                "hover-fine:bg-hover hover-fine:text-fg data-active:bg-selected data-active:text-fg data-active:shadow-none",
                "dark:data-active:border-transparent dark:data-active:bg-selected",
                "focus-visible:border-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
                "[&_svg]:size-3.5! [&_svg]:text-icon",
              )}
            >
              <Glyph /> {tr(label)}
            </TabsTrigger>
          ))}
          <div className="mt-4 hidden md:flex items-center gap-2.5 rounded-xl border border-hairline bg-surface/60 p-2.5">
            <img src="/logo.png" alt="Gather Suite" className="size-7 rounded-lg object-contain select-none shrink-0" />
            <div className="min-w-0 flex-1 leading-tight">
              <div className="text-[12px] font-semibold text-fg truncate">Gather Suite</div>
              <div className="text-[10px] text-fg-3 font-mono">v{APP_CONFIG.version}</div>
            </div>
          </div>
        </TabsList>
        <div className="min-w-0 md:flex-1">
          <TabsContent value="general" className="space-y-4">
            <LanguageSetting />
            <GeneralTab />
          </TabsContent>
          <TabsContent value="time-off">
            <TimeOffTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
          <TabsContent value="appearance" className="space-y-4">
            <AppearanceTab />
            <PaletteSetting />
          </TabsContent>
          <TabsContent value="data">
            <DataTab />
          </TabsContent>
        </div>
      </Tabs>
    </PageRoot>
  );
}
