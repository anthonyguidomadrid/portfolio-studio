import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import "./globals.css";
import { absoluteUrl, getSiteConfig } from "@/lib/site-config";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Suspense } from "react";
import { ConsentProvider } from "@/components/consent/provider";
import { ConsentInterface } from "@/components/consent/interface";
import { Analytics } from "@/components/consent/analytics";

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
    applicationName: siteConfig.name,
    appleWebApp: {
      title: siteConfig.name,
      capable: true,
      statusBarStyle: "default",
    },
    icons: {
      icon: [
        { url: "/favicon.ico", type: "image/x-icon", sizes: "32x32" },
        {
          url: "/favicons/favicon-96x96.png",
          type: "image/png",
          sizes: "96x96",
        },
        { url: "/favicons/favicon.svg", type: "image/svg+xml", sizes: "any" },
      ],
      apple: [
        { url: "/apple-touch-icon.png", type: "image/png", sizes: "180x180" },
      ],
    },
    manifest: "/manifest.webmanifest",
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
      <body className="flex min-h-screen flex-col bg-background font-sans text-body text-foreground antialiased">
        <ConsentProvider>
          <Header />
          {children}
          <Footer />
          <ConsentInterface />
          <Suspense fallback={null}>
            <Analytics />
          </Suspense>
        </ConsentProvider>
      </body>
    </html>
  );
}
