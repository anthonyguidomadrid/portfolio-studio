import { renderSiteIcon, renderSvgIcon } from "@/lib/site-icons";

const pngSizes: Record<string, number> = {
  "favicon-96x96.png": 96,
  "web-app-manifest-192x192.png": 192,
  "web-app-manifest-512x512.png": 512,
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ asset: string }> },
) {
  const { asset } = await params;
  if (asset === "favicon.svg") return renderSvgIcon();
  const size = Object.hasOwn(pngSizes, asset) ? pngSizes[asset] : undefined;
  if (!size) return new Response(null, { status: 404 });
  return renderSiteIcon(size);
}
