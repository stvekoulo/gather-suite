"use client";

import Link from "next/link";

// Pied de page autonome sans liens vers des depots prives
export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-black/[0.06] bg-[#fafafa] py-10 sm:py-16">
      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <Link href="/" className="inline-block mb-2">
            <span className="text-xl font-black tracking-tight text-[#111113]">
              gather.
            </span>
          </Link>
          <p className="text-xs text-[#8e8e93] max-w-sm">
            A planner for your work and your life, designed and built by{" "}
            <span className="font-medium text-[#111113]">Steven KOULO</span>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-5 sm:gap-8 text-xs text-[#6e6e73]">
          <a
            href="#downloads"
            className="hover:text-[#111113] transition-colors"
          >
            Direct Downloads
          </a>
          <a
            href="#features"
            className="hover:text-[#111113] transition-colors"
          >
            Features
          </a>
          <a href="#faq" className="hover:text-[#111113] transition-colors">
            FAQ
          </a>
          <a href="/privacy" className="hover:text-[#111113] transition-colors">
            Privacy
          </a>
          <a
            href="mailto:contact@stevenkoulo.com"
            className="hover:text-[#111113] transition-colors font-medium text-[#111113]"
          >
            Support & Contact
          </a>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 mt-8 pt-8 border-t border-black/[0.04] flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#a1a1aa]">
        <p>© {currentYear} Steven KOULO. Gather Suite. All rights reserved.</p>
        <p>Works offline. Syncing is optional.</p>
      </div>
    </footer>
  );
}
