import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.REVALIDATION_SECRET;
  const authorization = request.headers.get("authorization");
  if (!secret || !authorization?.startsWith("Bearer ")) return false;

  const provided = Buffer.from(authorization.slice("Bearer ".length));
  const expected = Buffer.from(secret);
  return (
    provided.length === expected.length && timingSafeEqual(provided, expected)
  );
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Expected a JSON request body." },
      { status: 400 },
    );
  }

  if (typeof payload !== "object" || payload === null) {
    return NextResponse.json(
      { error: "Invalid revalidation event." },
      { status: 400 },
    );
  }

  const event = payload as { type?: unknown; slug?: unknown };
  const slug = typeof event.slug === "string" ? event.slug : "";

  if (event.type === "portfolio_item" && /^[a-z0-9][a-z0-9-]*$/.test(slug)) {
    revalidateTag("portfolio", "max");
    revalidateTag("portfolio-tags", "max");
    revalidateTag("portfolio-media", "max");
    revalidatePath("/");
    revalidatePath("/portfolio");
    revalidatePath(`/portfolio/${slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({
      revalidated: true,
      paths: ["/", "/portfolio", `/portfolio/${slug}`, "/sitemap.xml"],
    });
  }

  if (event.type === "page" && ["about", "contact"].includes(slug)) {
    revalidateTag(`page-${slug}`, "max");
    revalidatePath(`/${slug}`);
    return NextResponse.json({ revalidated: true, paths: [`/${slug}`] });
  }

  if (event.type === "site_settings") {
    revalidateTag("site-settings", "max");
    revalidatePath("/");
    revalidatePath("/contact");
    return NextResponse.json({
      revalidated: true,
      paths: ["/", "/contact"],
    });
  }

  return NextResponse.json(
    { error: "Unsupported revalidation event." },
    { status: 400 },
  );
}
