import { ImageResponse } from "next/og";

export const socialImageSize = {
  width: 1200,
  height: 630,
};

export const socialImageContentType = "image/png";

export function renderSocialImage() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "stretch",
          background: "#fbf7ef",
          color: "#143b2d",
          display: "flex",
          fontFamily: "sans-serif",
          height: "100%",
          padding: 54,
          position: "relative",
          width: "100%",
        }}
      >
        <div
          style={{
            backgroundImage:
              "linear-gradient(#143b2d12 1px, transparent 1px), linear-gradient(90deg, #143b2d12 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            inset: 0,
            position: "absolute",
          }}
        />
        <div
          style={{
            background: "linear-gradient(135deg, #ef7929, #f1ad35)",
            borderRadius: 999,
            height: 360,
            opacity: 0.16,
            position: "absolute",
            right: -80,
            top: -100,
            width: 360,
          }}
        />
        <div
          style={{
            border: "2px solid #143b2d",
            borderRadius: 36,
            display: "flex",
            flex: 1,
            flexDirection: "column",
            justifyContent: "space-between",
            padding: "48px 54px",
            position: "relative",
          }}
        >
          <div style={{ alignItems: "center", display: "flex", fontSize: 34, fontWeight: 800 }}>
            <span
              style={{
                background: "#14613f",
                borderRadius: 14,
                color: "#fff",
                display: "flex",
                marginRight: 18,
                padding: "10px 15px",
              }}
            >
              Y
            </span>
            Yahnu
            <span style={{ color: "#ef7929", fontSize: 18, letterSpacing: 4, marginLeft: 18 }}>
              CÔTE D’IVOIRE
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", maxWidth: 960 }}>
            <span style={{ color: "#14613f", fontSize: 22, fontWeight: 800, letterSpacing: 3 }}>
              BE THE CHANGE
            </span>
            <span style={{ fontSize: 66, fontWeight: 800, letterSpacing: -3, lineHeight: 1.03, marginTop: 14 }}>
              Transformer la formation en insertion mesurée.
            </span>
          </div>
          <div style={{ alignItems: "center", display: "flex", fontSize: 22 }}>
            <span style={{ background: "#ef7929", borderRadius: 999, height: 14, marginRight: 12, width: 14 }} />
            Jeunes diplômés
            <span style={{ margin: "0 14px" }}>·</span>
            Entreprises
            <span style={{ margin: "0 14px" }}>·</span>
            Établissements
          </div>
        </div>
      </div>
    ),
    socialImageSize,
  );
}
