import { HomeHero } from "@/components/home-hero";
import { getSiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

export default async function HomePage() {
  const siteConfig = await getSiteConfig();
  return (
    <HomeHero eyebrow={messages.pages.portfolio} siteConfig={siteConfig} />
  );
}
