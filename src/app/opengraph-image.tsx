import { ImageResponse } from "next/og";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/seo/site";

export const alt = `${SITE_NAME} — task manager, notes, vault and money tracker`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const HIGHLIGHTS = ["Tasks", "Notes", "Vault", "Money", "Custom Sections"];

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
          padding: "72px 80px",
          background: "linear-gradient(135deg, #060a16 0%, #0b1220 45%, #10203a 100%)",
          color: "#e8eefc",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -180,
            left: -120,
            width: 620,
            height: 620,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(56,189,248,0.35) 0%, rgba(56,189,248,0) 70%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -220,
            right: -140,
            width: 640,
            height: 640,
            borderRadius: 9999,
            background: "radial-gradient(circle, rgba(99,102,241,0.30) 0%, rgba(99,102,241,0) 70%)",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "linear-gradient(135deg, #38bdf8 0%, #6366f1 100%)",
              color: "#05070f",
              fontSize: 34,
              fontWeight: 700,
            }}
          >
            M
          </div>
          <div style={{ fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>{SITE_NAME}</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 66, fontWeight: 700, lineHeight: 1.08, letterSpacing: -1.5 }}>
            Every part of your life, in one workspace
          </div>
          <div style={{ fontSize: 28, color: "#9db2d6", lineHeight: 1.35, maxWidth: 900 }}>
            {SITE_TAGLINE}
          </div>
        </div>

        <div style={{ display: "flex", gap: 14 }}>
          {HIGHLIGHTS.map((item) => (
            <div
              key={item}
              style={{
                display: "flex",
                padding: "12px 22px",
                borderRadius: 9999,
                border: "1px solid rgba(157,178,214,0.35)",
                background: "rgba(255,255,255,0.05)",
                fontSize: 22,
                color: "#c8d7f0",
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    size
  );
}
