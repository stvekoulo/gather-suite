"use client";

interface Feature {
  title: string;
  description: string;
  tag: string;
  utility: string;
}

const features: Feature[] = [
  {
    tag: "Unified Workspace",
    title: "Notes, agenda, and canvas in one quiet window",
    description:
      "Stop switching between three separate browser tabs for your notes, calendar, and brainstorm drawings.",
    utility:
      "Gather integrates markdown writing, calendar scheduling, and visual canvases into one unified desktop tool.",
  },
  {
    tag: "Instant Startup & Search",
    title: "Sub-200ms launch with zero loading spinners",
    description:
      "Web-based note apps take 5 to 10 seconds to load and stall when your Wi-Fi is spotty.",
    utility:
      "Built with Rust and Tauri v2. Gather opens in a blink, searches thousands of files locally, and never buffers.",
  },
  {
    tag: "Local PDF Signing & OCR",
    title: "Sign documents and scan receipts on your device",
    description:
      "You no longer need to upload private contracts or financial invoices to random online converters.",
    utility:
      "Apply valid X.509 digital signatures and run optical character recognition locally on your own processor.",
  },
  {
    tag: "Data Durability",
    title: "Your files will still open 20 years from now",
    description:
      "SaaS tools lock your knowledge behind proprietary schemas and monthly paywalls.",
    utility:
      "Everything in Gather lives in standard Markdown and open SQLite files in your user folder. You own the raw files.",
  },
];

// Grille de fonctionnalites orientee utilite reelle et principes Apple
export function FeaturesGrid() {
  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-16 sm:py-24 border-t border-black/[0.04]">
      <div className="max-w-2xl mb-12 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Practical Utility
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] tracking-tight mt-2">
          Everything you actually need to do great work, with nothing you don&apos;t.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 lg:gap-10">
        {features.map((f, i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-7 sm:p-9 rounded-[28px] bg-[#fbfbfa] border border-black/[0.04] hover:border-black/[0.1] transition-all hover:bg-white hover:shadow-[0_12px_32px_rgba(0,0,0,0.04)]"
          >
            <div>
              <span className="text-[11px] font-semibold text-[#71717a] tracking-wider uppercase mb-3 block">
                {f.tag}
              </span>
              <h3 className="text-lg sm:text-xl font-medium text-[#111113] mb-3 leading-snug">
                {f.title}
              </h3>
              <p className="text-sm text-[#71717a] leading-relaxed mb-4">
                {f.description}
              </p>
            </div>

            <div className="pt-4 border-t border-black/[0.04]">
              <p className="text-xs text-[#111113] font-medium leading-relaxed">
                → {f.utility}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
