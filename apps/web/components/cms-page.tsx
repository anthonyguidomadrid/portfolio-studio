import parse, { Element } from "html-react-parser";
import { messages } from "@/messages/en";
import { BookingCta } from "@/components/booking-cta";
import { SocialLinks } from "@/components/footer";
import type { SocialUrls } from "@/lib/site-config";

interface CmsPageProps {
  title: string;
  /** Sanitized HTML; undefined means the page could not be loaded. */
  html?: string;
  showBookingCta?: boolean;
  contactSocialUrls?: Partial<SocialUrls>;
}

const contentClasses = [
  "mt-8 text-body text-foreground",
  "[&>:first-child]:mt-0",
  "[&_blockquote]:my-6 [&_blockquote]:border-l [&_blockquote]:border-border [&_blockquote]:pl-5 [&_blockquote]:text-muted-foreground",
  "[&_h1]:mb-5 [&_h1]:mt-0 [&_h1]:text-heading-1",
  "[&_h2]:mb-4 [&_h2]:mt-10 [&_h2]:text-heading-2",
  "[&_h3]:mb-3 [&_h3]:mt-6 [&_h3]:text-heading-3",
  "[&_h4]:mt-6 [&_h4]:font-semibold",
  "[&_p.eyebrow]:text-xl [&_p.eyebrow]:uppercase",
  "[&_figure]:my-6 [&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full",
  "[&_img]:my-6 [&_img]:h-auto [&_img]:max-w-full",
  "[&_li]:my-1 [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_p]:my-5 [&_ul]:my-5",
].join(" ");

export function CmsPage({
  title,
  html,
  showBookingCta = false,
  contactSocialUrls,
}: CmsPageProps) {
  return (
    <main className="mx-auto w-full max-w-content flex-1 px-page-gutter py-section">
      <article aria-label={title} className="max-w-3xl">
        {html === undefined ? (
          <p className="mt-7 text-body text-muted-foreground">
            {messages.pages.unavailable}
          </p>
        ) : (
          <div className={`cms-page-content ${contentClasses}`}>
            {parse(html, {
              replace: (node) => {
                if (
                  contactSocialUrls &&
                  node instanceof Element &&
                  node.name === "ul" &&
                  node.attribs.class
                    ?.split(/\s+/)
                    .includes("wp-block-social-links")
                ) {
                  return (
                    <SocialLinks
                      socialUrls={contactSocialUrls}
                      variant="contact"
                    />
                  );
                }
              },
            })}
          </div>
        )}
      </article>
      {showBookingCta && <BookingCta />}
    </main>
  );
}
