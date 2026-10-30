import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("legal");
  return {
    title: page?.title ?? messages.pages.legal,
    alternates: { canonical: "/legal" },
  };
}

export default async function LegalPage() {
  const page = await getPage("legal");
  return (
    <CmsPage html={page?.html} title={page?.title ?? messages.pages.legal} />
  );
}
