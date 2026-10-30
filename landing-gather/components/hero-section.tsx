"use client";

import Image from "next/image";
import { DownloadButton } from "./download-button";

// Hero principal avec le mot gather et le logo central agrandis avec presence monumentale
export function HeroSection() {
  return (
    <section className="w-full max-w-7xl mx-auto flex flex-col items-center justify-center pt-8 sm:pt-14 pb-16 sm:pb-24 px-4 text-center select-none overflow-hidden">
      {/* Surtitre en serif italique */}
      <div className="mb-4 sm:mb-6">
        <span className="font-serif italic text-xs sm:text-sm md:text-base text-[#71717a] tracking-wide">
          A quieter way to think, plan, and write
        </span>
      </div>

      {/* Titre monumental agrandi encadrant le logo 3D fixe */}
      <div className="relative flex items-center justify-center w-full max-w-6xl xl:max-w-7xl mx-auto my-2 sm:my-4">
        <span className="text-[62px] min-[380px]:text-[76px] min-[450px]:text-[94px] sm:text-[145px] md:text-[210px] lg:text-[280px] xl:text-[310px] font-black tracking-[-0.04em] text-[#1c1c1e] leading-none">
          gat
        </span>

        {/* Logo 3D central agrandi avec positionnement stable et ombre de surface */}
        <div className="relative z-10 mx-[-10px] min-[380px]:mx-[-14px] sm:mx-[-24px] md:mx-[-38px] lg:mx-[-50px] xl:mx-[-58px] w-[84px] h-[84px] min-[380px]:w-[102px] min-[380px]:h-[102px] min-[450px]:w-[126px] min-[450px]:h-[126px] sm:w-[190px] sm:h-[190px] md:w-[270px] md:h-[270px] lg:w-[350px] lg:h-[350px] xl:w-[390px] xl:h-[390px] flex-shrink-0">
          <Image
            src="/gather-logo.png"
            alt="Gather Suite Logo"
            fill
            priority
            className="object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.22)]"
          />
        </div>

        <span className="text-[62px] min-[380px]:text-[76px] min-[450px]:text-[94px] sm:text-[145px] md:text-[210px] lg:text-[280px] xl:text-[310px] font-black tracking-[-0.04em] text-[#1c1c1e] leading-none">
          her
        </span>
      </div>

      {/* Description lisible et bien proportionnee */}
      <p className="max-w-lg mx-auto text-xs sm:text-sm md:text-base text-[#52525b] font-normal leading-relaxed mt-5 sm:mt-8 mb-8 sm:mb-10 px-2">
        A fast, distraction-free desktop app that puts your notes, calendar, and documents into one quiet space. No subscriptions, no cloud lock-in, and zero lag.
      </p>

      {/* Bouton de telechargement monochrome noir et blanc */}
      <DownloadButton />

      {/* Reassurances directes */}
      <p className="text-[11px] sm:text-xs text-[#a1a1aa] mt-5">
        100% Offline · Native Rust & Tauri Speed · SQLite & Markdown locaux · Gratuit
      </p>
    </section>
  );
}
