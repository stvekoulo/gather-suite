import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Privacy | Gather", description: "What Gather stores, where, and who can see it.", alternates: { canonical: "/privacy" } };

const sections: [string, string[]][] = [
  ["Without an account", ["Everything you create in Gather stays in a database on your computer. We receive none of it. Gather has no analytics or tracking."]],
  ["With an account", [
    "We store your e-mail address, your name and a hashed password so you can sign in.",
    "Your notes, tasks, events, invoices, clients, finance entries, time entries, spreadsheets, presentations, written documents and preferences are copied to our database so they can reach your other computers. Each account can only access its own rows.",
    "Imported files and attachments are not uploaded. Only their names and details are.",
    "The database and sign-in service are run by Neon, in the eu-west-2 region (London).",
  ]],
  ["Network requests", ["When online, Gather requests exchange rates from open.er-api.com, and public holidays from date.nager.at when you import them. These requests contain no personal data beyond what any web request reveals, such as your IP address. An image you insert by web address is loaded from that address."]],
  ["AI agents", ["Gather sends nothing to AI services. If you turn on the MCP server and connect an agent, that agent can read your data, and the provider's own privacy terms then apply to what it reads. The server is off by default."]],
  ["Your choices", ["You can export all your data from Settings > Data at any time. Deleting your account from the same screen erases your account and your synced data. Data on your computer stays until you uninstall Gather and delete it."]],
  ["Contact", ["Questions or requests: contact@stevenkoulo.com. Steven KOULO is responsible for this data."]],
];

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16 text-[#111113]">
      <Link href="/" className="text-xl font-black tracking-tight">gather.</Link>
      <h1 className="mt-10 text-3xl font-semibold tracking-tight">Privacy</h1>
      <p className="mt-2 text-sm text-[#71717a]">Last updated October 31, 2026</p>
      {sections.map(([title, paragraphs]) => (
        <section key={title} className="mt-8">
          <h2 className="text-lg font-medium">{title}</h2>
          {paragraphs.map((text) => <p key={text} className="mt-2 text-sm leading-relaxed text-[#52525b]">{text}</p>)}
        </section>
      ))}
    </main>
  );
}
