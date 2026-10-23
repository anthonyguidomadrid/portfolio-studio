import type { NextConfig } from "next";

const cmsUrl = process.env.CMS_URL?.trim();
let cmsImagePattern: NonNullable<NextConfig["images"]>["remotePatterns"] = [];

if (cmsUrl) {
  try {
    const url = new URL(cmsUrl);
    if (url.protocol === "https:" || url.protocol === "http:") {
      cmsImagePattern = [
        {
          protocol: url.protocol.slice(0, -1) as "http" | "https",
          hostname: url.hostname,
          port: url.port,
          pathname: "/wp-content/uploads/**",
        },
      ];
    }
  } catch {
    console.warn("CMS_URL is invalid; remote CMS images will not be enabled.");
  }
}

const nextConfig: NextConfig = {
  images: { remotePatterns: cmsImagePattern },
};

export default nextConfig;
