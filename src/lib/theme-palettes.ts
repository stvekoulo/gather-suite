export type PaletteId = "monochrome" | "blue" | "indigo" | "emerald" | "rose" | "amber" | "violet";

export interface PaletteDefinition {
  id: PaletteId;
  name: string;
  light: {
    brand: string;
    brandTint: string;
    selected: string;
  };
  dark: {
    brand: string;
    brandTint: string;
    selected: string;
  };
}

export const PALETTES: Record<PaletteId, PaletteDefinition> = {
  monochrome: {
    id: "monochrome",
    name: "Monochrome (White/Black)",
    light: { brand: "#18181b", brandTint: "#f4f4f5", selected: "#e4e4e7" },
    dark: { brand: "#ffffff", brandTint: "#27272a", selected: "#27272a" },
  },
  blue: {
    id: "blue",
    name: "Apple Blue",
    light: { brand: "#0071e3", brandTint: "#eff6ff", selected: "#dbeafe" },
    dark: { brand: "#60a5fa", brandTint: "#172554", selected: "#1e3a8a" },
  },
  indigo: {
    id: "indigo",
    name: "Indigo",
    light: { brand: "#4f46e5", brandTint: "#eef2ff", selected: "#e0e7ff" },
    dark: { brand: "#818cf8", brandTint: "#1e1b4b", selected: "#312e81" },
  },
  emerald: {
    id: "emerald",
    name: "Emerald Mint",
    light: { brand: "#059669", brandTint: "#ecfdf5", selected: "#d1fae5" },
    dark: { brand: "#34d399", brandTint: "#064e3b", selected: "#065f46" },
  },
  rose: {
    id: "rose",
    name: "Rose Coral",
    light: { brand: "#e11d48", brandTint: "#fff1f2", selected: "#ffe4e6" },
    dark: { brand: "#fb7185", brandTint: "#4c0519", selected: "#881337" },
  },
  amber: {
    id: "amber",
    name: "Warm Amber",
    light: { brand: "#d97706", brandTint: "#fffbeb", selected: "#fef3c7" },
    dark: { brand: "#f59e0b", brandTint: "#451a03", selected: "#78350f" },
  },
  violet: {
    id: "violet",
    name: "Royal Violet",
    light: { brand: "#7c3aed", brandTint: "#f5f3ff", selected: "#ede9fe" },
    dark: { brand: "#a78bfa", brandTint: "#2e1065", selected: "#4c1d95" },
  },
};

// Applies custom accent CSS variables to document root
export function applyThemePalette(paletteId: PaletteId, isDark: boolean) {
  if (typeof document === "undefined") return;
  const palette = PALETTES[paletteId] || PALETTES.monochrome;
  const colors = isDark ? palette.dark : palette.light;
  const root = document.documentElement;

  root.style.setProperty("--color-brand", colors.brand);
  root.style.setProperty("--color-brand-tint", colors.brandTint);
  root.style.setProperty("--color-selected", colors.selected);
  root.style.setProperty("--brand", colors.brand);
  root.style.setProperty("--brand-strong", colors.brand);
  root.style.setProperty("--brand-tint", colors.brandTint);
  root.style.setProperty("--bg-selected", colors.selected);
  const hex = colors.brand.replace("#", "");
  const rgb = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const luminance = rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
  root.style.setProperty("--primary-foreground", luminance > 0.179 ? "#18181b" : "#ffffff");
  root.style.setProperty("--on-brand", luminance > 0.179 ? "#18181b" : "#ffffff");
}
