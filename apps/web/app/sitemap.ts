import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: absoluteUrl("/").toString(),
      changeFrequency: "monthly",
    },
    {
      url: absoluteUrl("/portfolio").toString(),
      changeFrequency: "weekly",
    },
  ];
}
