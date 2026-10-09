import { ComingSoonPage } from "@/components/coming-soon-page";
import { getSiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

export default async function AboutPage() {
  const siteConfig = await getSiteConfig();
  return (
    <ComingSoonPage
      eyebrow={messages.pages.about}
      siteConfig={siteConfig}
      title={messages.pages.about}
    />
  );
}
