import { getTranslations } from "next-intl/server";

function embedSource(value: string): {
  src?: string;
  media?: string;
  external?: string;
} {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return {};

    if (["youtu.be", "www.youtu.be"].includes(url.hostname)) {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id
        ? {
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          }
        : {};
    }
    if (
      ["youtube.com", "www.youtube.com", "m.youtube.com"].includes(url.hostname)
    ) {
      const id =
        url.searchParams.get("v") ||
        url.pathname.match(/\/embed\/([\w-]+)/)?.[1];
      return id
        ? {
            src: `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}`,
          }
        : {};
    }
    if (["vimeo.com", "www.vimeo.com"].includes(url.hostname)) {
      const id = url.pathname.match(/\/(\d+)/)?.[1];
      return id ? { src: `https://player.vimeo.com/video/${id}` } : {};
    }
    if (/\.(mp4|webm|ogg)$/i.test(url.pathname))
      return { media: url.toString() };
    return { external: url.toString() };
  } catch {
    return {};
  }
}

export async function VideoEmbed({
  url,
  title,
}: {
  url?: string;
  title: string;
}) {
  const t = await getTranslations("video");

  if (!url) return <p className="video-placeholder">{t("missing")}</p>;
  const source = embedSource(url);

  if (source.media) {
    return (
      <div className="video-frame">
        <video controls playsInline preload="metadata">
          <source src={source.media} />
          {t("unsupported")}
        </video>
      </div>
    );
  }
  if (source.src) {
    return (
      <div className="video-frame">
        <iframe
          src={source.src}
          title={title}
          loading="lazy"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>
    );
  }
  if (source.external)
    return (
      <p className="video-placeholder">
        <a href={source.external} target="_blank" rel="noreferrer">
          {t("openExternal")}
        </a>
      </p>
    );
  return <p className="video-placeholder">{t("cannotEmbed")}</p>;
}
