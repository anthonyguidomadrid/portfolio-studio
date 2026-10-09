import { ComingSoonPage } from "@/components/coming-soon-page";
import { getSiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

interface PortfolioDetailPageProps {
  params: Promise<{ slug: string }>;
}

function formatTitle(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default async function PortfolioDetailPage({
  params,
}: PortfolioDetailPageProps) {
  const [{ slug }, siteConfig] = await Promise.all([params, getSiteConfig()]);

  return (
    <ComingSoonPage
      eyebrow={messages.pages.portfolio}
      siteConfig={siteConfig}
      title={formatTitle(slug) || messages.pages.project}
    />
  );
}
