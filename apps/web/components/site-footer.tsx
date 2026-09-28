import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { SiteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/contact", key: "contact" },
];

export async function SiteFooter({ siteConfig }: { siteConfig: SiteConfig }) {
  const t = await getTranslations("common");

  return (
    <footer className="site-footer">
      <div>
        <Link className="footer-brand" href="/">
          {siteConfig.name}
        </Link>
        <p className="footer-note">
          {t("copyright", {
            year: new Date().getFullYear(),
            name: siteConfig.name,
          })}
        </p>
      </div>
      <nav className="footer-nav" aria-label={t("footerNavigation")}>
        {navigation.map((item) => (
          <Link key={item.href} href={item.href}>
            {t(item.key)}
          </Link>
        ))}
        {siteConfig.socialLinks.map((item) => (
          <a key={item.href} href={item.href} target="_blank" rel="noreferrer">
            {item.label}
          </a>
        ))}
      </nav>
    </footer>
  );
}
