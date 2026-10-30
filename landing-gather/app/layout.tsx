import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://gather.stevenkoulo.com"),
  title: "gather. — A desktop workspace that takes care of the small stuff",
  description:
    "A fast, local-first desktop app for notes, calendar, and documents. Runs offline, stores data locally on your disk, and respects your privacy.",
  authors: [{ name: "Steven KOULO" }],
  keywords: [
    "desktop app",
    "local-first",
    "note taking",
    "calendar",
    "pdf signer",
    "offline notes",
    "tauri",
    "gather suite",
  ],
  openGraph: {
    title: "gather. — A desktop workspace that takes care of the small stuff",
    description:
      "A fast, local-first desktop app for notes, calendar, and documents. Runs offline and keeps your data on your disk.",
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
    title: "gather. — A desktop workspace that takes care of the small stuff",
    description:
      "A fast, local-first desktop app for notes, calendar, and documents. Runs offline on your disk.",
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
      "A fast local-first desktop productivity suite for notes, calendar, and documents.",
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
