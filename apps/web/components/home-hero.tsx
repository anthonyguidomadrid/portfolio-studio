import { HomeVideo } from "@/components/home-video";
import type { SiteConfig } from "@/lib/site-config";
import { messages } from "@/messages/en";

interface HomeHeroProps {
  eyebrow: string;
  siteConfig: SiteConfig;
}

export function HomeHero({ eyebrow, siteConfig }: HomeHeroProps) {
  return (
    <main className="relative isolate flex flex-1 overflow-hidden bg-primary">
      <HomeVideo
        startSeconds={siteConfig.homeVideoStart}
        title={messages.home.videoTitle}
        videoId={siteConfig.homeVideoId}
      />
      <div aria-hidden="true" className="absolute inset-0 bg-primary/60" />

      <section
        aria-labelledby="profile-title"
        className="relative z-10 mx-auto flex w-full max-w-content items-center px-page-gutter py-section text-primary-foreground text-shadow-lg text-shadow-black/40"
      >
        <div className="w-full">
          <p className="mb-5 text-small font-medium uppercase tracking-wide text-primary-foreground/80">
            {eyebrow}
          </p>
          <h1 id="profile-title" className="max-w-[12ch] text-heading-1">
            {siteConfig.name}
          </h1>
          <p className="mt-7 max-w-prose text-heading-3 font-normal normal-case text-primary-foreground/90">
            {siteConfig.description}
          </p>
        </div>
      </section>
    </main>
  );
}
