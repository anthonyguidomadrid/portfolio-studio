import {
  FaFacebookF,
  FaFlickr,
  FaInstagram,
  FaPinterestP,
  FaTumblr,
  FaXTwitter,
  FaYoutube,
} from "react-icons/fa6";
import { getSiteConfig, type SiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

const socialPlatforms = [
  { key: "instagram", label: "Instagram", Icon: FaInstagram },
  { key: "facebook", label: "Facebook", Icon: FaFacebookF },
  { key: "twitter", label: "X (Twitter)", Icon: FaXTwitter },
  { key: "youtube", label: "YouTube", Icon: FaYoutube },
  { key: "pinterest", label: "Pinterest", Icon: FaPinterestP },
  { key: "tumblr", label: "Tumblr", Icon: FaTumblr },
  { key: "flickr", label: "Flickr", Icon: FaFlickr },
] as const;

type SiteFooterProps = Pick<SiteConfig, "name" | "contactEmail" | "socialUrls">;

export function SiteFooter({
  name,
  contactEmail,
  socialUrls,
}: SiteFooterProps) {
  const availableSocials = socialPlatforms.filter(({ key }) => socialUrls[key]);

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-5 px-page-gutter py-6 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:gap-6">
          {contactEmail && (
            <a
              className="flex min-h-11 items-center text-small text-foreground underline decoration-border underline-offset-4 transition-colors hover:decoration-foreground motion-reduce:transition-none"
              href={`mailto:${contactEmail}`}
            >
              {contactEmail}
            </a>
          )}

          {availableSocials.length > 0 && (
            <nav aria-label={messages.footer.socialMediaLabel}>
              <ul className="m-0 flex flex-wrap items-center justify-center gap-1 p-0">
                {availableSocials.map(({ key, label, Icon }) => (
                  <li className="list-none" key={key}>
                    <a
                      aria-label={label}
                      className="flex size-11 items-center justify-center text-foreground transition-colors hover:text-muted-foreground motion-reduce:transition-none"
                      href={socialUrls[key]}
                      rel="noopener noreferrer"
                      target="_blank"
                      title={label}
                    >
                      <Icon aria-hidden="true" focusable="false" size={19} />
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          )}
        </div>

        <p className="m-0 text-center text-small text-muted-foreground sm:text-right">
          © {new Date().getFullYear()} {name}
        </p>
      </div>
    </footer>
  );
}

export async function Footer() {
  const siteConfig = await getSiteConfig();

  return (
    <SiteFooter
      contactEmail={siteConfig.contactEmail}
      name={siteConfig.name}
      socialUrls={siteConfig.socialUrls}
    />
  );
}
