import type { MetadataRoute } from "next";
import { getPortfolioCollection } from "@/lib/cms";
import { absoluteUrl } from "@/lib/site-config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const collection = await getPortfolioCollection();
  const routes = ["/", "/about", "/portfolio", "/contact"];

  return [
    ...routes.map((path) => ({
      url: absoluteUrl(path).toString(),
      changeFrequency: "monthly" as const,
    })),
    ...collection.items.map((item) => ({
      url: absoluteUrl(`/portfolio/${item.slug}`).toString(),
      changeFrequency: "monthly" as const,
    })),
  ];
}
