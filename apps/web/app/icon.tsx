import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site-config";

export const size = {
  width: 32,
  height: 32,
};

export const contentType = "image/png";

export default async function Icon() {
  const { name } = await getSiteConfig();
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toLocaleUpperCase())
      .join("") || "S";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#111111",
          color: "#ffffff",
          fontFamily: "Montserrat, sans-serif",
          fontSize: initials.length > 1 ? 15 : 21,
          fontWeight: 600,
          lineHeight: 1,
          boxShadow: "inset 0 0 0 1px #626262",
        }}
      >
        {initials}
      </div>
    ),
    size,
  );
}
