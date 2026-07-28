import { ImageResponse } from "next/og";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          alignItems: "center",
          background: "#14613f",
          color: "#fbf7ef",
          display: "flex",
          fontFamily: "sans-serif",
          fontSize: 104,
          fontWeight: 900,
          height: "100%",
          justifyContent: "center",
          width: "100%",
        }}
      >
        Y
        <span
          style={{
            background: "#ef7929",
            borderRadius: 999,
            height: 24,
            position: "absolute",
            right: 28,
            top: 28,
            width: 24,
          }}
        />
      </div>
    ),
    size,
  );
}
