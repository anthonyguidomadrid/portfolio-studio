import { ImageResponse } from "next/og";
import { getSiteConfig } from "@/lib/site-config";

export async function getSiteInitials() {
  const { name } = await getSiteConfig();
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => Array.from(word)[0]?.toLocaleUpperCase())
      .join("") || "S"
  );
}

export async function renderSiteIcon(size: number) {
  const initials = await getSiteInitials();
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#111111",
        color: "#ffffff",
        fontFamily: "sans-serif",
        fontSize: size * (initials.length > 1 ? 15 / 32 : 21 / 32),
        fontWeight: 600,
        lineHeight: 1,
        boxShadow: `inset 0 0 0 ${size / 32}px #626262`,
      }}
    >
      {initials}
    </div>,
    { width: size, height: size },
  );
}

export async function renderSvgIcon() {
  const initials = await getSiteInitials();
  const escapedInitials = initials.replace(/[<>&"']/g, (character) => {
    return `&#${character.charCodeAt(0)};`;
  });
  return new Response(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect width="32" height="32" fill="#111111"/><rect x="0.5" y="0.5" width="31" height="31" fill="none" stroke="#626262"/><text x="16" y="16" dy=".35em" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="${initials.length > 1 ? 15 : 21}" font-weight="600">${escapedInitials}</text></svg>`,
    { headers: { "Content-Type": "image/svg+xml" } },
  );
}

export async function renderIcoIcon() {
  const png = new Uint8Array(await (await renderSiteIcon(32)).arrayBuffer());
  const icon = new Uint8Array(22 + png.length);
  const header = new DataView(icon.buffer);
  header.setUint16(2, 1, true);
  header.setUint16(4, 1, true);
  header.setUint8(6, 32);
  header.setUint8(7, 32);
  header.setUint16(10, 1, true);
  header.setUint16(12, 32, true);
  header.setUint32(14, png.length, true);
  header.setUint32(18, 22, true);
  icon.set(png, 22);
  return new Response(icon, {
    headers: { "Content-Type": "image/x-icon" },
  });
}
