"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// En-tete responsive avec menu mobile escamotable et position fixe
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 15);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 ${
        scrolled
          ? "bg-white/95 backdrop-blur-md border-b border-black/[0.06] shadow-[0_4px_20px_rgba(0,0,0,0.02)] py-3 sm:py-4"
          : "bg-white/80 backdrop-blur-sm py-4 sm:py-6"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-5 sm:px-10 lg:px-16">
        <Link
          href="/"
          className="flex items-center select-none group"
          aria-label="Gather Suite Home"
        >
          <span className="text-xl sm:text-2xl font-black tracking-tight text-[#111113]">
            gather.
          </span>
        </Link>

        {/* Navigation Bureau */}
        <nav
          className="hidden md:flex items-center gap-6 lg:gap-8 text-xs sm:text-sm font-medium text-[#6e6e73]"
          aria-label="Desktop Navigation"
        >
          <a
            href="#features"
            className="hover:text-[#111113] transition-colors py-1"
          >
            Features
          </a>
          <a
            href="#downloads"
            className="hover:text-[#111113] transition-colors py-1"
          >
            Downloads
          </a>
          <a
            href="#faq"
            className="hover:text-[#111113] transition-colors py-1"
          >
            FAQ
          </a>
          <a
            href="#downloads"
            className="ml-2 inline-flex items-center justify-center px-4 py-2 rounded-full text-xs font-medium text-white bg-[#18181b] hover:bg-black transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Get App
          </a>
        </nav>

        {/* Boutons Mobiles */}
        <div className="flex md:hidden items-center gap-2">
          <a
            href="#downloads"
            className="inline-flex items-center justify-center px-3.5 py-1.5 rounded-full text-xs font-medium text-white bg-[#18181b]"
          >
            Get App
          </a>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#111113] hover:bg-black/5 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {mobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Menu d'extension sur mobile */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-black/[0.06] bg-white px-6 py-5 flex flex-col gap-4 animate-in slide-in-from-top-2">
          <a
            href="#features"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#111113] py-1"
          >
            Features
          </a>
          <a
            href="#downloads"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#111113] py-1"
          >
            Downloads
          </a>
          <a
            href="#faq"
            onClick={() => setMobileMenuOpen(false)}
            className="text-sm font-medium text-[#111113] py-1"
          >
            FAQ
          </a>
        </div>
      )}
    </header>
  );
}
