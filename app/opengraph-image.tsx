import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Supplier Pricing Engine CPQ Demo";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#08111f",
          color: "#edf6ff",
          padding: "72px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#2dd4bf",
                color: "#04111f",
                fontWeight: 900,
                fontSize: "24px",
              }}
            >
              SP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "24px", fontWeight: 800 }}>Supplier Pricing Engine</span>
              <span style={{ fontSize: "17px", color: "#91a5bb", marginTop: "5px" }}>CPQ reference implementation</span>
            </div>
          </div>
          <div style={{ fontSize: "18px", color: "#5eead4", fontWeight: 700 }}>cpq.kohronburton.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "980px" }}>
          <div style={{ fontSize: "18px", letterSpacing: "3px", color: "#5eead4", fontWeight: 800 }}>
            DIFFERENT SUPPLIER RULES. ONE ENGINE.
          </div>
          <div style={{ fontSize: "66px", lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 900, marginTop: "18px" }}>
            Configure. Validate. Price. Quote.
          </div>
          <div style={{ fontSize: "25px", lineHeight: 1.45, color: "#a8b9ca", marginTop: "24px" }}>
            Supplier-specific product catalogs, price grids, compatibility checks, freight, margins, professional quotes, and explainable pricing.
          </div>
        </div>

        <div style={{ display: "flex", gap: "18px" }}>
          {["3 supplier rule sets", "9 product programs", "PDF quote export", "100% explainable"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                border: "1px solid #29405a",
                borderRadius: "999px",
                padding: "11px 16px",
                color: "#c8d7e5",
                fontSize: "16px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
