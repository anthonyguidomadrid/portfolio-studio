import type { MetadataRoute } from "next";
import { getSiteConfig } from "@/lib/site-config";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const { name, description } = await getSiteConfig();
  return {
    id: "/",
    name,
    short_name: name,
    description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#111111",
    theme_color: "#111111",
    icons: [192, 512].map((size) => ({
      src: `/favicons/web-app-manifest-${size}x${size}.png`,
      sizes: `${size}x${size}`,
      type: "image/png",
      purpose: "any",
    })),
  };
}
