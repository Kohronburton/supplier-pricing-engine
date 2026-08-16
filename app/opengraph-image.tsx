import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Supplier Pricing Engine CPQ Architecture Case Study";
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
          padding: "68px",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "62px",
                height: "62px",
                borderRadius: "18px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#2dd4bf",
                color: "#04111f",
                fontWeight: 900,
                fontSize: "23px",
              }}
            >
              SP
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: "24px", fontWeight: 800 }}>Supplier Pricing Engine</span>
              <span style={{ fontSize: "17px", color: "#91a5bb", marginTop: "5px" }}>CPQ architecture case study + live quote studio</span>
            </div>
          </div>
          <div style={{ fontSize: "18px", color: "#5eead4", fontWeight: 700 }}>cpq.kohronburton.com</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", maxWidth: "1020px" }}>
          <div style={{ fontSize: "18px", letterSpacing: "3px", color: "#5eead4", fontWeight: 800 }}>
            DIFFERENT SUPPLIER RULEBOOKS. ONE QUOTING WORKFLOW.
          </div>
          <div style={{ fontSize: "62px", lineHeight: 1.02, letterSpacing: "-3px", fontWeight: 900, marginTop: "18px" }}>
            Deterministic pricing. Multi-line quotes. Explainable decisions.
          </div>
          <div style={{ fontSize: "23px", lineHeight: 1.42, color: "#a8b9ca", marginTop: "22px" }}>
            Problem → constraints → architecture tradeoffs → executable proof → customer-ready quote.
          </div>
        </div>

        <div style={{ display: "flex", gap: "14px" }}>
          {["3 supplier rule sets", "9 product programs", "9 automated tests", "No LLM in price path"].map((label) => (
            <div
              key={label}
              style={{
                display: "flex",
                border: "1px solid #29405a",
                borderRadius: "999px",
                padding: "10px 15px",
                color: "#c8d7e5",
                fontSize: "15px",
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
