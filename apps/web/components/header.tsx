import { getSiteConfig } from "@/lib/site-config";
import { HeaderNavigation } from "@/components/header-navigation";

export async function Header() {
  const siteConfig = await getSiteConfig();

  return (
    <HeaderNavigation
      name={siteConfig.name}
      navigation={siteConfig.navigation}
    />
  );
}
