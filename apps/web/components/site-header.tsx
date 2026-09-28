import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { LocaleSwitcher } from "@/components/locale-switcher";
import type { Locale } from "@/lib/i18n";
import type { SiteConfig } from "@/lib/site-config";

const navigation = [
  { href: "/", key: "home" },
  { href: "/about", key: "about" },
  { href: "/portfolio", key: "portfolio" },
  { href: "/contact", key: "contact" },
] as const;

export async function SiteHeader({ siteConfig }: { siteConfig: SiteConfig }) {
  const t = await getTranslations("common");
  const locale = (await getLocale()) as Locale;
  const links = navigation.map((item) => ({ ...item, label: t(item.key) }));

  return (
    <header className="site-header">
      <Link
        className="brand"
        href="/"
        aria-label={t("brandHome", { name: siteConfig.name })}
      >
        <span className="brand-mark" aria-hidden="true">
          {siteConfig.name.charAt(0)}
        </span>
        <span>{siteConfig.name}</span>
      </Link>
      <div className="header-actions">
        <nav className="desktop-nav" aria-label={t("mainNavigation")}>
          {links.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>
        <details className="mobile-nav">
          <summary aria-label={t("mobileNavigation")}>
            <span className="menu-icon" aria-hidden="true">
              <span />
              <span />
            </span>
            <span>{t("menu")}</span>
          </summary>
          <nav className="mobile-menu" aria-label={t("mobileNavigation")}>
            {links.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
        </details>
        <LocaleSwitcher locale={locale} />
      </div>
    </header>
  );
}
