"use client";

interface WordcraftRulerProps {
  orientation: "portrait" | "landscape";
  marginMm: number;
}

// Règle graduée horizontale style Wordcraft et Microsoft Word
export function WordcraftRuler({ orientation, marginMm }: WordcraftRulerProps) {
  const totalCm = orientation === "landscape" ? 29.7 : 21.0;
  const leftMarginCm = marginMm / 10;
  const rightMarginCm = totalCm - leftMarginCm;

  const marks = Array.from({ length: Math.floor(totalCm) + 1 }, (_, i) => i);

  return (
    <div
      className="relative mb-3 h-5 w-full select-none overflow-hidden rounded border border-hairline/70 bg-surface-2/60 text-[9px] text-fg-2 shadow-2xs"
      style={{ maxWidth: orientation === "landscape" ? "297mm" : "210mm" }}
      aria-hidden="true"
    >
      {/* Zone de marge gauche grisée */}
      <div
        className="absolute inset-y-0 left-0 bg-slate-300/40 dark:bg-zinc-800/60"
        style={{ width: `${(leftMarginCm / totalCm) * 100}%` }}
      />

      {/* Zone de marge droite grisée */}
      <div
        className="absolute inset-y-0 right-0 bg-slate-300/40 dark:bg-zinc-800/60"
        style={{ width: `${(leftMarginCm / totalCm) * 100}%` }}
      />

      {/* Graduations en centimètres */}
      <div className="relative flex h-full w-full items-end justify-between px-1">
        {marks.map((cm) => {
          const pct = (cm / totalCm) * 100;
          const isMarginBoundary = Math.abs(cm - leftMarginCm) < 0.2 || Math.abs(cm - rightMarginCm) < 0.2;

          return (
            <div
              key={cm}
              className="absolute flex flex-col items-center"
              style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
            >
              {cm > 0 && cm < totalCm && (
                <span className={`text-[9px] font-mono leading-none ${isMarginBoundary ? "font-bold text-brand" : ""}`}>
                  {cm}
                </span>
              )}
              <div
                className={`w-px ${isMarginBoundary ? "h-3.5 bg-brand" : cm % 5 === 0 ? "h-2.5 bg-fg-2" : "h-1.5 bg-hairline"}`}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
