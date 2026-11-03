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
      }}
    >
      <div
        style={{
          width: "87.5%",
          height: "87.5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
          color: "#111111",
          fontFamily: "sans-serif",
          fontSize: size * (initials.length > 1 ? 15 / 32 : 21 / 32),
          fontWeight: 400,
          lineHeight: 1,
        }}
      >
        {initials}
      </div>
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
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32"><rect x="2" y="2" width="28" height="28" fill="#ffffff"/><text x="16" y="16" dy=".35em" text-anchor="middle" fill="#111111" font-family="sans-serif" font-size="${initials.length > 1 ? 15 : 21}" font-weight="400">${escapedInitials}</text></svg>`,
    { headers: { "Content-Type": "image/svg+xml" } },
  );
}

export async function renderIcoIcon() {
  const sizes = [16, 32, 48];
  const images = await Promise.all(
    sizes.map(
      async (size) =>
        new Uint8Array(await (await renderSiteIcon(size)).arrayBuffer()),
    ),
  );
  const directorySize = 6 + sizes.length * 16;
  const icon = new Uint8Array(
    directorySize + images.reduce((total, image) => total + image.length, 0),
  );
  const header = new DataView(icon.buffer);
  header.setUint16(2, 1, true);
  header.setUint16(4, sizes.length, true);
  let imageOffset = directorySize;
  images.forEach((image, index) => {
    const entryOffset = 6 + index * 16;
    header.setUint8(entryOffset, sizes[index]);
    header.setUint8(entryOffset + 1, sizes[index]);
    header.setUint16(entryOffset + 4, 1, true);
    header.setUint16(entryOffset + 6, 32, true);
    header.setUint32(entryOffset + 8, image.length, true);
    header.setUint32(entryOffset + 12, imageOffset, true);
    icon.set(image, imageOffset);
    imageOffset += image.length;
  });
  return new Response(icon, {
    headers: { "Content-Type": "image/x-icon" },
  });
}
