import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/site-config";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/").toString(), changeFrequency: "monthly" },
    { url: absoluteUrl("/about").toString(), changeFrequency: "yearly" },
    { url: absoluteUrl("/portfolio").toString(), changeFrequency: "weekly" },
    { url: absoluteUrl("/videos").toString(), changeFrequency: "monthly" },
    { url: absoluteUrl("/contact").toString(), changeFrequency: "yearly" },
    { url: absoluteUrl("/legal").toString(), changeFrequency: "yearly" },
  ];
}
