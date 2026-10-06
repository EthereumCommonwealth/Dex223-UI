import { ImageResponse } from "next/og";

import { brandMarkDataUri } from "./brand-mark";

export const alt = "DEX223: the decentralized exchange for ERC-20 and ERC-223 tokens";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FEATURES = ["Swap", "Convert 1:1", "Earn fees", "Borrow and lend"];

// Shared preview for every route (Open Graph and, by fallback, Twitter).
export default async function OpengraphImage() {
  const mark = await brandMarkDataUri();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          background: "linear-gradient(135deg, #0F0F0F 0%, #161E1C 60%, #283633 100%)",
          color: "#D1DEDF",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={mark} width={70} height={80} alt="" />
          <div style={{ fontSize: 44, fontWeight: 700, letterSpacing: -1 }}>DEX223</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.1, letterSpacing: -2 }}>
            Trade ERC-20 and ERC-223 tokens
          </div>
          <div style={{ fontSize: 30, color: "#A2AAA9", lineHeight: 1.4 }}>
            The decentralized exchange where tokens never get lost in failed transfers.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16 }}>
          {FEATURES.map((feature) => (
            <div
              key={feature}
              style={{
                display: "flex",
                padding: "12px 24px",
                borderRadius: 80,
                border: "1px solid #7DA491",
                color: "#7DA491",
                fontSize: 24,
              }}
            >
              {feature}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
