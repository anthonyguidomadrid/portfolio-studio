const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set(["youtube.com", "youtube-nocookie.com"]);

export function getYouTubeVideoId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;

  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    return undefined;
  }

  if (url.protocol !== "https:" || url.username || url.port) return undefined;

  const host = url.hostname.toLowerCase().replace(/^(www|m)\./, "");
  let id: string | null | undefined;

  if (host === "youtu.be") {
    id = url.pathname.split("/")[1];
  } else if (YOUTUBE_HOSTS.has(host)) {
    id =
      url.pathname === "/watch"
        ? url.searchParams.get("v")
        : /^\/(?:embed|shorts|live)\/([^/]+)/.exec(url.pathname)?.[1];
  }

  return id && VIDEO_ID.test(id) ? id : undefined;
}

export function youTubeBackgroundEmbedUrl(videoId: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    loop: "1",
    playlist: videoId,
    playsinline: "1",
    modestbranding: "1",
    rel: "0",
    disablekb: "1",
    iv_load_policy: "3",
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params}`;
}
