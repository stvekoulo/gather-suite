"use client";

import { useEffect, useState } from "react";

type Platform = "windows" | "mac" | "linux";

// Bouton monochrome Apple avec retour tactile immediat et detection d'OS
export function DownloadButton() {
  const [platform, setPlatform] = useState<Platform>("windows");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const ua = window.navigator.userAgent.toLowerCase();
    if (ua.includes("mac") || ua.includes("darwin")) {
      setPlatform("mac");
    } else if (ua.includes("linux") && !ua.includes("android")) {
      setPlatform("linux");
    } else {
      setPlatform("windows");
    }
    setMounted(true);
  }, []);

  const buttonDetails: Record<Platform, { label: string; ext: string }> = {
    windows: { label: "Download for Windows", ext: ".exe (64-bit)" },
    mac: { label: "Download for macOS", ext: ".dmg (Universal)" },
    linux: { label: "Download for Linux", ext: ".AppImage / .deb" },
  };

  const current = buttonDetails[platform];

  return (
    <div className="flex flex-col items-center gap-3 w-full px-4 select-none">
      <a
        href="#downloads"
        className="apple-button inline-flex items-center justify-center gap-2.5 w-full sm:w-auto px-8 py-3.5 rounded-full text-xs sm:text-sm font-medium text-white bg-[#111113] hover:bg-black shadow-[0_4px_16px_rgba(0,0,0,0.14)]"
      >
        <span>{mounted ? current.label : "Download Gather"}</span>
        <span className="text-[#a1a1aa] text-[11px] sm:text-xs font-normal">
          {mounted ? current.ext : ""}
        </span>
      </a>

      <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-[#71717a]">
        <span>Also available for</span>
        {platform !== "windows" && (
          <a
            href="#downloads"
            className="underline underline-offset-2 hover:text-[#111113] transition-colors"
          >
            Windows (.exe)
          </a>
        )}
        {platform !== "mac" && (
          <a
            href="#downloads"
            className="underline underline-offset-2 hover:text-[#111113] transition-colors"
          >
            macOS (.dmg)
          </a>
        )}
        {platform !== "linux" && (
          <a
            href="#downloads"
            className="underline underline-offset-2 hover:text-[#111113] transition-colors"
          >
            Linux (.AppImage / .deb)
          </a>
        )}
      </div>
    </div>
  );
}
