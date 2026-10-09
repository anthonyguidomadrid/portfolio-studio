import { ComingSoonPage } from "@/components/coming-soon-page";
import { getSiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

export default async function PortfolioPage() {
  const siteConfig = await getSiteConfig();
  return (
    <ComingSoonPage
      eyebrow={messages.pages.portfolio}
      siteConfig={siteConfig}
      title={messages.pages.portfolio}
    />
  );
}
