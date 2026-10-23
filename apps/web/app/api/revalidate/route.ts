import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { cmsPageCacheTag, isCmsPageSlug } from "@/lib/cms-pages";

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
  if (event.type === "page" && isCmsPageSlug(event.slug)) {
    revalidateTag(cmsPageCacheTag(event.slug), "max");
    revalidatePath(`/${event.slug}`);
    return NextResponse.json({
      revalidated: true,
      paths: [`/${event.slug}`],
    });
  }

  if (event.type === "site_settings") {
    revalidateTag("site-settings", "max");
    revalidatePath("/");
    return NextResponse.json({
      revalidated: true,
      paths: ["/"],
    });
  }

  if (event.type === "portfolio_item" && event.slug === "") {
    revalidateTag("wp-portfolio-photos", "max");
    revalidatePath("/portfolio");
    return NextResponse.json({
      revalidated: true,
      paths: ["/portfolio"],
    });
  }

  if (event.type === "portfolio_item" && event.slug === "") {
    revalidateTag("wp-portfolio-photos", "max");
    revalidatePath("/portfolio");
    return NextResponse.json({
      revalidated: true,
      paths: ["/portfolio"],
    });
  }

  return NextResponse.json(
    { error: "Unsupported revalidation event." },
    { status: 400 },
  );
}
