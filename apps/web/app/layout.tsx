import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { absoluteUrl, getSiteConfig } from "@/lib/site-config";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-montserrat",
  display: "swap",
});

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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={montserrat.variable}
      data-scroll-behavior="smooth"
    >
      <body className="min-h-screen bg-background font-sans text-body text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
