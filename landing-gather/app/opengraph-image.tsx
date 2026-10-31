import { ImageResponse } from "next/og";

export const alt = "Gather, a desktop planner for your work and your life";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", padding: 88, background: "#ffffff", color: "#111113" }}>
        <div style={{ fontSize: 148, fontWeight: 800, letterSpacing: -6 }}>gather.</div>
        <div style={{ fontSize: 44, marginTop: 20 }}>One planner for your work and your life</div>
        <div style={{ fontSize: 28, marginTop: 28, color: "#71717a" }}>Calendar, tasks, notes, documents, invoices and money. Windows, macOS and Linux.</div>
      </div>
    ),
    size,
  );
}
