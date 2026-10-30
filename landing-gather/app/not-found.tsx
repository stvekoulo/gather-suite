"use client";

import Link from "next/link";

// Page 404 minimaliste pour l'application landing
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-white text-[#111113] p-6 text-center">
      <h1 className="text-4xl font-black mb-2">404</h1>
      <p className="text-sm text-[#71717a] mb-6">Page not found.</p>
      <Link
        href="/"
        className="px-5 py-2.5 rounded-full text-xs font-medium text-white bg-[#18181b] hover:bg-black transition-all"
      >
        Back to home
      </Link>
    </div>
  );
}
