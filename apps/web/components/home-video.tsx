"use client";

import { useSyncExternalStore } from "react";
import { youTubeBackgroundEmbedUrl } from "@/lib/youtube";

const REDUCED_MOTION = "(prefers-reduced-motion: reduce)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(REDUCED_MOTION);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}

interface HomeVideoProps {
  videoId: string;
  startSeconds?: number;
  title: string;
}

export function HomeVideo({ videoId, startSeconds, title }: HomeVideoProps) {
  // Server snapshot is false so the iframe only loads after hydration.
  const canPlay = useSyncExternalStore(
    subscribe,
    () => !window.matchMedia(REDUCED_MOTION).matches,
    () => false,
  );

  if (!videoId || !canPlay) return null;

  return (
    <iframe
      allow="autoplay; encrypted-media"
      aria-hidden="true"
      className="pointer-events-none absolute left-1/2 top-1/2 h-[56.25vw] min-h-full w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
      referrerPolicy="strict-origin-when-cross-origin"
      src={youTubeBackgroundEmbedUrl(videoId, startSeconds)}
      tabIndex={-1}
      title={title}
    />
  );
}
