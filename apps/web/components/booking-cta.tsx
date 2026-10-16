import Link from "next/link";
import { ROUTES } from "@/lib/site-config";
import { messages } from "@/messages/en";

export function BookingCta() {
  return (
    <section
      aria-labelledby="booking-cta-heading"
      className="mt-section mb-8 grid grid-cols-1 items-center gap-6 bg-primary px-4 py-6 text-center text-primary-foreground sm:grid-cols-2 sm:gap-8 sm:px-8 sm:py-8 sm:text-left"
    >
      <h3
        className="m-0 text-heading-3 font-light normal-case text-primary-foreground"
        id="booking-cta-heading"
      >
        {messages.bookingCta.heading}
      </h3>
      <div className="justify-self-center sm:justify-self-end">
        <Link
          className="inline-flex min-h-11 items-center justify-center border border-primary-foreground px-5 py-3 text-small font-medium text-primary-foreground no-underline transition-colors hover:bg-primary-foreground hover:text-primary focus-visible:outline-offset-4 motion-reduce:transition-none"
          href={ROUTES.contact}
        >
          {messages.bookingCta.action}
        </Link>
      </div>
    </section>
  );
}
