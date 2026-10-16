import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("about");
  return { title: page?.title ?? messages.pages.about };
}

export default async function AboutPage() {
  const page = await getPage("about");

  return (
    <CmsPage
      html={page?.html}
      showBookingCta
      title={page?.title ?? messages.pages.about}
    />
  );
}
