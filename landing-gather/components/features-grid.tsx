"use client";

interface Feature {
  title: string;
  description: string;
  tag: string;
  utility: string;
}

const features: Feature[] = [
  {
    tag: "Today",
    title: "See your whole day on one screen",
    description:
      "Events, tasks due, overdue invoices and reminders from every part of your life, in one list.",
    utility:
      "Drag a task onto the calendar, start a timer from it, and get an alert before your next meeting.",
  },
  {
    tag: "Clients & invoices",
    title: "Go from hours worked to invoice paid",
    description:
      "Track time against a client, turn the billable hours into invoice lines, and export a PDF with your VAT and legal details.",
    utility:
      "Each client gets a page with their invoices, hours, tasks, notes and documents.",
  },
  {
    tag: "Money",
    title: "Rent in euros, software in dollars, one total",
    description:
      "Record income, expenses and subscriptions in any of eight currencies, including CFA francs.",
    utility:
      "Pick your currency in settings. Gather downloads exchange rates and converts every total, and keeps the last rates for when you are offline.",
  },
  {
    tag: "Notes",
    title: "Write things down and find your way back",
    description:
      "Markdown notes with nested tags, links between notes, attachments, reminders and version history.",
    utility:
      "Turn any note into a task or a calendar event. The two stay linked.",
  },
  {
    tag: "Documents, sheets & slides",
    title: "Write, calculate and present in the same app",
    description:
      "A document editor, a spreadsheet with formulas and charts, presentations and a whiteboard.",
    utility:
      "Open and export DOCX, XLSX and PPTX files. Complex layouts may not import perfectly.",
  },
  {
    tag: "PDF tools",
    title: "Handle private PDFs without uploading them",
    description:
      "Merge, split, compress, redact, watermark and digitally sign, with 21 tools in total.",
    utility:
      "OCR for French and English turns scans into searchable PDFs, and all of it runs on your computer.",
  },
  {
    tag: "Search & capture",
    title: "Find anything. Save anything from anywhere.",
    description:
      "Ctrl+K searches file names and the words inside your files, notes, tasks, invoices and clients as you type.",
    utility:
      "Press Ctrl+Shift+Space in any app to drop a note, task or event into Gather without losing your place.",
  },
  {
    tag: "AI agents",
    title: "Let your AI assistant use your planner",
    description:
      "Connect Claude, Cursor or any other MCP client running on your computer, and ask it what is due this week.",
    utility:
      "Agents can only read until you allow changes. Then they can add tasks, log time or draft invoices. The server is off by default.",
  },
];

// Grille de fonctionnalites orientee utilite reelle et principes Apple
export function FeaturesGrid() {
  return (
    <section id="features" className="w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-16 sm:py-24 border-t border-black/[0.04]">
      <div className="max-w-2xl mb-12 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Everything connected
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] tracking-tight mt-2">
          Everything you plan, write and bill, in one app.
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
