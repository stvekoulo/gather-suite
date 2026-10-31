"use client";

import { DownloadButton } from "./download-button";

// Section finale d'appel a l'action fidele au design monochrome
export function CtaSection() {
  return (
    <section className="w-full max-w-5xl mx-auto px-6 sm:px-10 py-20 sm:py-28 text-center border-t border-black/[0.04]">
      <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
        Get started
      </span>
      <h2 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-[#111113] tracking-tight mt-3 mb-5">
        Put your whole week in one place.
      </h2>
      <p className="max-w-md mx-auto text-xs sm:text-sm md:text-base text-[#6e6e73] mb-10 leading-relaxed">
        Free to download. No credit card, and an account only if you want to sync.
      </p>

      <DownloadButton />
    </section>
  );
}
