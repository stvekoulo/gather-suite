"use client";

import Image from "next/image";

// Section 2 colonnes expliquant la genese du produit et sa valeur pratique
export function SplitSection() {
  return (
    <section className="w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-12 sm:py-20 border-t border-black/[0.04]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 sm:gap-12 md:gap-16 items-center">
        {/* Colonne visuelle avec ecrin noir et blanc Apple Pro */}
        <div className="relative aspect-[4/3] sm:aspect-[1/1] md:aspect-[4/5] w-full rounded-[28px] sm:rounded-[36px] overflow-hidden bg-[#121214] border border-black/[0.08] shadow-[0_24px_60px_rgba(0,0,0,0.14)] flex items-center justify-center p-6 sm:p-10">
          {/* Lueur blanche subtile de retroeclairage */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 sm:w-80 h-64 sm:h-80 bg-white/5 rounded-full blur-[90px] pointer-events-none" />

          {/* Boitier noir mat avec chanfrein net */}
          <div className="relative z-10 w-full max-w-[280px] sm:max-w-[340px] aspect-square rounded-[30px] sm:rounded-[36px] bg-gradient-to-b from-[#202024] to-[#0d0d0f] p-3 sm:p-4 shadow-[0_25px_60px_rgba(0,0,0,0.6)] border border-white/[0.08]">
            <div className="relative w-full h-full rounded-[24px] sm:rounded-[28px] bg-[#09090b] border border-white/10 shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)] flex items-center justify-center p-4 sm:p-6 overflow-hidden">
              <div className="relative w-full h-full">
                <Image
                  src="/gather-logo.png"
                  alt="Gather Suite Device Close-up"
                  fill
                  className="object-contain scale-105 drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                />
              </div>

              {/* Reflet de vitre diagonale */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Colonne texte : Pourquoi Gather a ete cree et pourquoi c'est utile */}
        <div className="flex flex-col justify-center text-left max-w-lg md:pl-4">
          <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider mb-3 sm:mb-4">
            Why Gather
          </span>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] leading-snug tracking-tight mb-5">
            Your week is split between a calendar, a to-do app, a notes app, a spreadsheet and a folder of PDFs. None of them know about the others.
          </h2>

          <p className="text-sm sm:text-base text-[#52525b] leading-relaxed mb-4">
            In Gather, an invoice&apos;s due date shows up on your calendar. A note becomes a task in one click. A client&apos;s page lists their invoices, hours, tasks and notes.
          </p>

          <p className="text-sm sm:text-base text-[#52525b] leading-relaxed">
            Your data lives on your computer and works with no connection. Create an account only if you want the same planner on another computer.
          </p>
        </div>
      </div>
    </section>
  );
}
