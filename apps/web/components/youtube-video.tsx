"use client";

import { useState } from "react";
import { useConsent } from "@/components/consent/provider";
import { youTubeCover } from "@/lib/youtube";
import { messages } from "@/messages/en";

interface YouTubeVideoProps {
  videoId: string;
  title: string;
  aspectRatio?: string;
  startSeconds?: number;
}

export function YouTubeVideo({
  videoId,
  title,
  aspectRatio = "16 / 9",
  startSeconds = 0,
}: YouTubeVideoProps) {
  const { ready, choices, savePreferences } = useConsent();
  const [play, setPlay] = useState(false);
  const source = new URL(`https://www.youtube-nocookie.com/embed/${videoId}`);
  if (play) source.searchParams.set("autoplay", "1");
  if (startSeconds > 0)
    source.searchParams.set("start", String(Math.floor(startSeconds)));

  return (
    <div className="my-6 w-full">
      <div
        className="relative w-full overflow-hidden bg-primary"
        style={{ aspectRatio }}
      >
        {ready && choices.youtube ? (
          <iframe
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
            referrerPolicy="strict-origin-when-cross-origin"
            src={source.toString()}
            style={{ aspectRatio, width: "100%", height: "100%" }}
            title={title}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={messages.youtube.coverAlt(title)}
            className="absolute inset-0 m-0! size-full! max-w-none object-cover"
            src={youTubeCover(videoId)}
          />
        )}
      </div>
      {(!ready || !choices.youtube) && (
        <div className="border border-t-0 border-border bg-background p-4 text-foreground">
          <p className="m-0! font-semibold">{title}</p>
          <p className="my-2! text-small">{messages.youtube.blocked}</p>
          <div className="flex flex-wrap items-center gap-4">
            <button
              className="min-h-11 border border-foreground px-4 py-2 text-small"
              disabled={!ready}
              onClick={() => {
                setPlay(true);
                savePreferences({ ...choices, youtube: true });
              }}
              type="button"
            >
              {messages.youtube.allowAndPlay}
            </button>
            <a
              className="text-small underline underline-offset-4"
              href={`https://www.youtube.com/watch?v=${videoId}`}
              rel="noopener noreferrer"
              target="_blank"
            >
              {messages.youtube.watch}
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
