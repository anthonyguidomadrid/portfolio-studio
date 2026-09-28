import type { Metadata } from "next";
import "@fontsource-variable/montserrat";
import "./globals.css";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { absoluteUrl, getSiteConfig } from "@/lib/site-config";

export async function generateMetadata(): Promise<Metadata> {
  const siteConfig = await getSiteConfig();
  return {
    metadataBase: absoluteUrl("/"),
    title: {
      default: siteConfig.name,
      template: `%s | ${siteConfig.name}`,
    },
    description: siteConfig.description,
    alternates: { canonical: "/" },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: siteConfig.name,
      description: siteConfig.description,
      url: absoluteUrl("/"),
    },
  };
}

export default function RootLayout({ children }: LayoutProps<"/">) {
  return renderLayout(children);
}

async function renderLayout(children: React.ReactNode) {
  const locale = await getLocale();
  const messages = await getMessages();
  const siteConfig = await getSiteConfig();

  return (
    <html lang={locale} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader siteConfig={siteConfig} />
          {children}
          <SiteFooter siteConfig={siteConfig} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
