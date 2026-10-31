import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gather.stevenkoulo.com"),
  title: "Gather: plan your work and your life in one place",
  description:
    "Gather is a desktop planner that keeps your calendar, tasks, notes, documents, invoices and money in one app, and connects them to each other.",
  authors: [{ name: "Steven KOULO" }],
  keywords: [
    "planner app",
    "personal planner",
    "work and life planner",
    "calendar and tasks",
    "invoicing",
    "expense tracking",
    "notes",
    "offline desktop app",
  ],
  openGraph: {
    title: "Gather: plan your work and your life in one place",
    description:
      "Gather is a desktop planner that keeps your calendar, tasks, notes, documents, invoices and money in one app, and connects them to each other.",
    url: "https://gather.stevenkoulo.com",
    siteName: "gather.",
    images: [
      {
        url: "/gather-logo.png",
        width: 1024,
        height: 1024,
        alt: "Gather Suite Desktop Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Gather: plan your work and your life in one place",
    description:
      "Gather is a desktop planner that keeps your calendar, tasks, notes, documents, invoices and money in one app, and connects them to each other.",
    images: ["/gather-logo.png"],
  },
};

// Layout avec donnees structurees Schema.org pour le referencement
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Gather Suite",
    operatingSystem: "Windows, macOS, Linux",
    applicationCategory: "ProductivityApplication",
    description:
      "Gather is a desktop planner that keeps your calendar, tasks, notes, documents, invoices and money in one app, and connects them to each other.",
    author: {
      "@type": "Person",
      name: "Steven KOULO",
    },
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
  };

  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="min-h-screen bg-white text-[#111113] antialiased">
        {children}
      </body>
    </html>
  );
}
