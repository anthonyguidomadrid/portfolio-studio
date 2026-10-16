import type { Metadata } from "next";
import { CmsPage } from "@/components/cms-page";
import { getPage } from "@/lib/wordpress-page";
import { messages } from "@/messages/en";

export async function generateMetadata(): Promise<Metadata> {
  const page = await getPage("videos");
  return { title: page?.title ?? messages.pages.videos };
}

export default async function VideosPage() {
  const page = await getPage("videos");

  return (
    <CmsPage html={page?.html} title={page?.title ?? messages.pages.videos} />
  );
}
