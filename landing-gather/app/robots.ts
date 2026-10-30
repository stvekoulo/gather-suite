import type { MetadataRoute } from "next";

// Fichier robots.txt genere pour le referencement
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: "https://gather.stevenkoulo.com/sitemap.xml",
  };
}
