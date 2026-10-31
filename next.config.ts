import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  images: {
    unoptimized: true,
  },
  devIndicators: false,
  // The release script has already run the tests; type-checking again needs more RAM than a small VPS has.
  typescript: { ignoreBuildErrors: process.env.LOW_MEMORY_BUILD === "1" },
};

export default nextConfig;
