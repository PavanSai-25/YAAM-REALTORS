import { ImageResponse } from "next/og"

export const alt = "Yaam Realtors & Consultants — property in Hyderabad & Secunderabad"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: "linear-gradient(120deg, #04112e 0%, #062b67 60%, #0645a5 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div style={{ width: 64, height: 64, borderRadius: 14, background: "#1597e5", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36, fontWeight: 700 }}>Y</div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 36, fontWeight: 700 }}>Yaam</div>
            <div style={{ fontSize: 16, letterSpacing: 4, opacity: 0.7 }}>REALTORS &amp; CONSULTANTS</div>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 76, fontWeight: 700, lineHeight: 1.05, letterSpacing: -2 }}>Find a place that feels right.</div>
          <div style={{ marginTop: 24, fontSize: 30, opacity: 0.8 }}>Buy · Rent · Commercial · Land — Hyderabad &amp; Secunderabad · Est. 2006</div>
        </div>
      </div>
    ),
    size,
  )
}
