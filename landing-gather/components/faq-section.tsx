"use client";

interface QuestionItem {
  q: string;
  a: string;
}

const items: QuestionItem[] = [
  {
    q: "What is Gather for?",
    a: "Planning and running your personal and professional life from one app: calendar, tasks, notes, documents, time tracking, invoices, expenses and PDFs. You can keep separate spaces, for example one for work and one for home.",
  },
  {
    q: "Where is my data stored?",
    a: "On your computer, in a local database. If you create an account, your notes, tasks, events, finances, invoices and preferences are also copied to your account so they can reach your other computers.",
  },
  {
    q: "Do my files sync too?",
    a: "Not yet. Imported files and attachments stay on the computer where you added them. Their names and details sync, and documents you write in Gather sync in full.",
  },
  {
    q: "Can I use Gather offline?",
    a: "Yes. You only need a connection to sync, update exchange rates and import public holidays. Changes you make offline sync when you reconnect.",
  },
  {
    q: "Does Gather use AI?",
    a: "Gather has no AI built in, and nothing is sent to an AI service by default. If you want an assistant, you can connect your own through MCP and decide whether it can only read or can also make changes.",
  },
  {
    q: "How much does Gather cost?",
    a: "Gather is free to download and use.",
  },
];

// Section FAQ avec typographie sobre conforme a l'esthetique Apple
export function FaqSection() {
  return (
    <section id="faq" className="w-full max-w-4xl mx-auto px-6 sm:px-10 py-16 sm:py-24 border-t border-black/[0.04]">
      <div className="text-center mb-12 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Questions
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
