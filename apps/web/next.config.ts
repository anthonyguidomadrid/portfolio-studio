import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const remotePatterns: NonNullable<NextConfig["images"]>["remotePatterns"] = [
  { protocol: "https", hostname: "images.unsplash.com", pathname: "/**" },
];

try {
  if (process.env.CMS_URL) {
    const cmsUrl = new URL(process.env.CMS_URL);
    if (
      !remotePatterns.some((pattern) => pattern.hostname === cmsUrl.hostname)
    ) {
      remotePatterns.push({
        protocol: cmsUrl.protocol === "http:" ? "http" : "https",
        hostname: cmsUrl.hostname,
        pathname: "/**",
      });
    }
  }
} catch {
  console.warn(
    "CMS_URL is invalid; WordPress media images will not be optimized until it is corrected.",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
  },
};

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

export default withNextIntl(nextConfig);
