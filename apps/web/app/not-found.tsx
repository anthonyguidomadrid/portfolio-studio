import { NotFoundView } from "@/components/not-found-view";
import { getSiteConfig } from "@/lib/site-config";

export default async function NotFound() {
  const settings = await getSiteConfig();
  return <NotFoundView image={settings.notFoundBackgroundImage ?? null} />;
}