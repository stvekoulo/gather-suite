import type { Metadata, Viewport } from "next";
import { SITE_DESCRIPTION, SITE_TITLE, SITE_URL, VERSION } from "@/lib/site";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  applicationName: "Gather",
  authors: [{ name: "Steven KOULO" }],
  alternates: { canonical: "/" },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: "Gather",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
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
    name: "Gather",
    alternateName: "Gather Suite",
    url: SITE_URL,
    image: `${SITE_URL}/gather-logo.png`,
    softwareVersion: VERSION,
    downloadUrl: `${SITE_URL}/#downloads`,
    operatingSystem: "Windows, macOS, Linux",
    applicationCategory: "ProductivityApplication",
    description: SITE_DESCRIPTION,
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
