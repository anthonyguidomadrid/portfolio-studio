import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("contact");
  return { title: page?.title ?? messages.pages.contact };
}

export default async function ContactPage() {
  const page = await getPage("contact");

  return (
    <CmsPage
      contactSocialUrls={page?.socialUrls}
      html={page?.html}
      title={page?.title ?? messages.pages.contact}
    />
  );
}
