import {
  FaEnvelope,
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
import { CookieSettingsButton } from "@/components/consent/interface";

const socialPlatforms = [
  {
    key: "instagram",
    label: messages.footer.platforms.instagram,
    Icon: FaInstagram,
  },
  {
    key: "facebook",
    label: messages.footer.platforms.facebook,
    Icon: FaFacebookF,
  },
  {
    key: "twitter",
    label: messages.footer.platforms.twitter,
    Icon: FaXTwitter,
  },
  { key: "youtube", label: messages.footer.platforms.youtube, Icon: FaYoutube },
  {
    key: "pinterest",
    label: messages.footer.platforms.pinterest,
    Icon: FaPinterestP,
  },
  { key: "tumblr", label: messages.footer.platforms.tumblr, Icon: FaTumblr },
  { key: "flickr", label: messages.footer.platforms.flickr, Icon: FaFlickr },
] as const;

type SiteFooterProps = Pick<SiteConfig, "name" | "contactEmail" | "socialUrls">;

export function SocialLinks({
  socialUrls,
  variant = "footer",
}: {
  socialUrls: Partial<SiteConfig["socialUrls"]>;
  variant?: "footer" | "contact";
}) {
  const availableSocials = socialPlatforms.filter(({ key }) => socialUrls[key]);
  if (availableSocials.length === 0) return null;
  const isContact = variant === "contact";

  return (
    <nav aria-label={messages.footer.socialMediaLabel}>
      <ul
        className={
          isContact
            ? "contact-social-list m-0 flex list-none flex-wrap items-center justify-start gap-3 p-0"
            : "m-0 flex flex-nowrap items-center justify-center gap-0 p-0 sm:gap-1"
        }
      >
        {availableSocials.map(({ key, label, Icon }) => (
          <li className="list-none" key={key}>
            <a
              aria-label={label}
              className={
                isContact
                  ? "flex size-12 shrink-0 items-center justify-center text-foreground transition-colors hover:text-muted-foreground motion-reduce:transition-none"
                  : "flex h-11 w-8 shrink-0 items-center justify-center text-foreground transition-colors hover:text-muted-foreground motion-reduce:transition-none sm:size-11"
              }
              href={socialUrls[key]}
              rel="noopener noreferrer"
              target="_blank"
              title={label}
            >
              <Icon
                aria-hidden="true"
                focusable="false"
                size={isContact ? 28 : 19}
              />
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function SiteFooter({
  name,
  contactEmail,
  socialUrls,
}: SiteFooterProps) {
  const availableSocials = socialPlatforms.filter(({ key }) => socialUrls[key]);

  return (
    <footer className="mt-auto border-t border-border bg-background">
      <div className="mx-auto flex w-full max-w-content flex-col items-center gap-5 px-page-gutter py-6 sm:flex-row sm:justify-between sm:gap-6">
        <div className="flex w-full min-w-0 flex-row items-center justify-center gap-1 sm:w-auto sm:gap-4">
          {contactEmail && (
            <a
              aria-label={messages.footer.emailAddressLabel(contactEmail)}
              className="flex h-11 w-8 shrink-0 items-center justify-center text-foreground transition-colors hover:text-muted-foreground motion-reduce:transition-none sm:size-11"
              href={`mailto:${contactEmail}`}
              title={messages.footer.emailLinkLabel}
            >
              <FaEnvelope aria-hidden="true" focusable="false" size={19} />
            </a>
          )}

          {contactEmail && availableSocials.length > 0 && (
            <span
              aria-hidden="true"
              className="hidden bg-border sm:block sm:h-6 sm:w-px"
            />
          )}

          <SocialLinks socialUrls={socialUrls} />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-muted-foreground sm:ml-auto sm:justify-end">
          <CookieSettingsButton />
          <p className="m-0 text-center text-small sm:text-right">
            {messages.footer.copyright(new Date().getFullYear(), name)}
          </p>
        </div>
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
