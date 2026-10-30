"use client";

interface QuestionItem {
  q: string;
  a: string;
}

const items: QuestionItem[] = [
  {
    q: "Why did you build Gather instead of using Notion or Obsidian?",
    a: "Most note applications force you into cloud subscriptions, slow web interfaces, or complex plugin management. Gather is designed as a single cohesive native desktop app that boots in 150ms, requires zero internet access, and combines daily scheduling with markdown notes without friction.",
  },
  {
    q: "Where is my data stored, and who can access it?",
    a: "Your data is stored strictly in your local user folder in an open SQLite database and standard files. Nobody—not even the creator of Gather—has access to your documents or notes.",
  },
  {
    q: "Can I use Gather completely offline?",
    a: "Yes. Every single capability in Gather (searching notes, planning dates, signing PDFs, running OCR on images) executes directly on your CPU without ever making a network request.",
  },
  {
    q: "How much does Gather cost?",
    a: "Gather is completely free to download and use on Windows, macOS, and Linux. There are no surprise paywalls or feature lockouts.",
  },
];

// Section FAQ avec typographie sobre conforme a l'esthetique Apple
export function FaqSection() {
  return (
    <section id="faq" className="w-full max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-black/[0.04]">
      <div className="text-center mb-12 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Transparency
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] tracking-tight mt-2">
          Frequently asked questions
        </h2>
      </div>

      <div className="flex flex-col divide-y divide-black/[0.06]">
        {items.map((item, idx) => (
          <div key={idx} className="py-6 sm:py-8 text-left">
            <h3 className="text-base sm:text-lg font-medium text-[#111113] mb-3">
              {item.q}
            </h3>
            <p className="text-sm text-[#6e6e73] leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
