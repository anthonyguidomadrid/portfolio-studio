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
