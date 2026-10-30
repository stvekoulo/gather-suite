import type { MetadataRoute } from "next";

// Plan du site automatique pour indexation optimale
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: "https://gather.stevenkoulo.com",
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}
