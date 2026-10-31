import { DOWNLOADS, RELEASES_PAGE, VERSION } from "@/lib/site";

interface PlatformPackage {
  os: string;
  requirements: string;
  note?: string;
  files: { label: string; href: string }[];
}

const packages: PlatformPackage[] = [
  {
    os: "Windows",
    requirements: "Windows 10 or 11, 64-bit",
    note: "Windows may show a SmartScreen warning because the installer is not code-signed yet. Choose More info, then Run anyway.",
    files: [{ label: "Download .exe", href: DOWNLOADS.windows }],
  },
  {
    os: "macOS",
    requirements: "macOS 11 Big Sur or newer",
    note: "Not notarized yet, so macOS blocks the first launch. Move Gather to Applications, then run: xattr -cr /Applications/Gather.app",
    files: [
      { label: "Apple Silicon (M1 and newer)", href: DOWNLOADS.macSilicon },
      { label: "Intel", href: DOWNLOADS.macIntel },
    ],
  },
  {
    os: "Linux",
    requirements: "Ubuntu 22.04 or newer, x86_64",
    files: [
      { label: "Download .AppImage", href: DOWNLOADS.linuxAppImage },
      { label: "Download .deb", href: DOWNLOADS.linuxDeb },
    ],
  },
];

// Section de telechargement autonome avec boutons monochromes Apple
export function PlatformDownloads() {
  return (
    <section id="downloads" className="w-full max-w-7xl mx-auto px-5 sm:px-10 lg:px-16 py-14 sm:py-24 border-t border-black/[0.04]">
      <div className="max-w-xl mb-10 sm:mb-16">
        <span className="text-xs font-semibold text-[#111113] uppercase tracking-wider">
          Download · Version {VERSION}
        </span>
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold text-[#111113] tracking-tight mt-2">
          Download Gather for your computer.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
        {packages.map((pkg) => (
          <div
            key={pkg.os}
            className="flex flex-col justify-between p-6 sm:p-8 rounded-[24px] sm:rounded-[28px] bg-white border border-black/[0.08] shadow-[0_8px_24px_rgba(0,0,0,0.02)] hover:shadow-[0_16px_36px_rgba(0,0,0,0.06)] transition-all"
          >
            <div>
              <h3 className="text-lg sm:text-xl font-semibold text-[#111113] mb-4">
                Gather for {pkg.os}
              </h3>
              <p className="text-xs text-[#71717a] mb-2">
                <span className="font-medium text-[#111113]">Requirements:</span>{" "}
                {pkg.requirements}
              </p>
              {pkg.note && <p className="text-xs leading-relaxed text-[#71717a] break-words">{pkg.note}</p>}
            </div>

            <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-black/[0.04] flex flex-col gap-2">
              {pkg.files.map((file) => (
                <a key={file.href} href={file.href} className="apple-button w-full inline-flex items-center justify-center py-3 rounded-full text-xs font-medium text-white bg-[#111113] hover:bg-black shadow-[0_2px_8px_rgba(0,0,0,0.1)]">
                  {file.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <p className="mt-8 text-xs text-[#71717a]">
        Looking for an older version?{" "}
        <a href={RELEASES_PAGE} className="underline underline-offset-2 hover:text-[#111113]">See all releases</a>.
      </p>
    </section>
  );
}
