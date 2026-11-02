import { renderSiteIcon } from "@/lib/site-icons";

export async function GET() {
  return renderSiteIcon(180);
}
