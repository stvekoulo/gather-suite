"use client";

interface PlatformPackage {
  os: string;
  badge: string;
  filename: string;
  downloadUrl: string;
  requirements: string;
  arch: string;
}

const packages: PlatformPackage[] = [
  {
    os: "Windows",
    badge: "Installer",
    filename: "GatherSuite-Setup.exe",
    downloadUrl: "/downloads/GatherSuite-Setup.exe",
    requirements: "Windows 10 / 11 (64-bit)",
    arch: "x86_64",
  },
  {
    os: "macOS",
    badge: "Universal Disk Image",
    filename: "GatherSuite-macOS.dmg",
    downloadUrl: "/downloads/GatherSuite-macOS.dmg",
    requirements: "macOS 12 Monterey or newer",
    arch: "Apple Silicon (M1+) & Intel",
  },
  {
    os: "Linux",
    badge: "AppImage & Deb",
    filename: "GatherSuite.AppImage",
    downloadUrl: "/downloads/GatherSuite.AppImage",
    requirements: "Ubuntu 20+, Debian 11+, Fedora 36+",
    arch: "x86_64",
  },
];

// Section de telechargement autonome avec boutons monochromes Apple
export function PlatformDownloads() {
  return (
    <section id="downloads" className="w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-14 sm:py-24 border-t border-black/[0.04]">
      <div className="max-w-xl mb-10 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Direct Downloads
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] tracking-tight mt-2">
          Download once. Keep it forever.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {packages.map((pkg, i) => (
          <div
            key={i}
            className="flex flex-col justify-between p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] bg-white border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] transition-all"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg sm:text-xl font-semibold text-[#111113]">
                  {pkg.os}
                </h3>
                <span className="text-[11px] font-medium px-2.5 py-1 rounded-full bg-[#f4f4f5] text-[#52525b]">
                  {pkg.badge}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-mono text-[#18181b] bg-[#f9f9fa] p-2.5 rounded-lg border border-black/[0.04] mb-4 break-all">
                {pkg.filename}
              </p>
              <p className="text-xs text-[#71717a] mb-2">
                <span className="font-medium text-[#111113]">Requirements:</span>{" "}
                {pkg.requirements}
              </p>
              <p className="text-xs text-[#71717a]">
                <span className="font-medium text-[#111113]">Architecture:</span>{" "}
                {pkg.arch}
              </p>
            </div>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-black/[0.04]">
              <a
                href={pkg.downloadUrl}
                download
                className="apple-button w-full inline-flex items-center justify-center py-3 rounded-full text-xs font-medium text-white bg-[#111113] hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
              >
                Download for {pkg.os}
              </a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
