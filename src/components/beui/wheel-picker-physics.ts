import { useMemo } from "react";

export const DEG = Math.PI / 180;
export const DECELERATION = 0.00042;
export const MAX_VELOCITY = 0.18;
export const WHEEL_SENS = 0.012;
export const WHEEL_SETTLE = 110;

export const easeOutCubic = (p: number) => 1 - (1 - p) ** 3;
export const BACK = 1.35;
export const easeOutBack = (p: number) => 1 + (BACK + 1) * (p - 1) ** 3 + BACK * (p - 1) ** 2;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

// Calcule la vélocité de lancer du tambour 3D
export function calculateReleaseVelocity(pts: [number, number][], itemHeight: number): number {
  if (pts.length < 2) return 0;
  const latest = pts[pts.length - 1];
  const dt = latest[1] - pts[0][1];
  if (dt <= 0) return 0;
  return clamp((pts[0][0] - latest[0]) / itemHeight / dt, -MAX_VELOCITY, MAX_VELOCITY);
}

// Calcule la géométrie 3D et le rayon du tambour circulaire
export function useWheelGeometry(visibleCount: number, itemHeight: number) {
  return useMemo(() => {
    const rowsEachSide = Math.max(1, Math.floor(visibleCount / 2));
    const cutoff = rowsEachSide + 1;
    const angle = 90 / cutoff;
    const r = itemHeight / Math.tan(angle * DEG);
    return {
      itemAngle: angle,
      radius: r,
      hideBeyond: cutoff,
      height: Math.round(2 * r * Math.sin(rowsEachSide * angle * DEG) + itemHeight),
    };
  }, [visibleCount, itemHeight]);
}
