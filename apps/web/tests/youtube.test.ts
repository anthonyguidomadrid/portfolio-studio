import { describe, expect, it } from "vitest";
import { getYouTubeVideoId, youTubeBackgroundEmbedUrl } from "@/lib/youtube";

const ID = "dQw4w9WgXcQ";

describe("getYouTubeVideoId", () => {
  it.each([
    `https://www.youtube.com/watch?v=${ID}`,
    `https://youtube.com/watch?v=${ID}&t=10s`,
    `https://m.youtube.com/watch?v=${ID}`,
    `https://youtu.be/${ID}`,
    `https://youtu.be/${ID}?si=abc`,
    `https://www.youtube.com/embed/${ID}`,
    `https://www.youtube-nocookie.com/embed/${ID}`,
    `https://www.youtube.com/shorts/${ID}`,
    `https://www.youtube.com/live/${ID}`,
    `  https://youtu.be/${ID}  `,
  ])("extracts the ID from %s", (url) => {
    expect(getYouTubeVideoId(url)).toBe(ID);
  });

  it.each([
    "",
    "not a url",
    `http://www.youtube.com/watch?v=${ID}`,
    `javascript:alert("${ID}")`,
    `https://evil.example/watch?v=${ID}`,
    `https://youtube.com.evil.example/watch?v=${ID}`,
    `https://user@www.youtube.com/watch?v=${ID}`,
    `https://www.youtube.com:8443/watch?v=${ID}`,
    "https://www.youtube.com/watch?v=short",
    `https://www.youtube.com/watch?v=${ID}extra`,
    `https://www.youtube.com/watch?v="><script>`,
    "https://www.youtube.com/playlist?list=PL123",
    "https://www.youtube.com/embed/",
  ])("rejects %s", (url) => {
    expect(getYouTubeVideoId(url)).toBeUndefined();
  });

  it("rejects non-string values", () => {
    expect(getYouTubeVideoId(null)).toBeUndefined();
    expect(getYouTubeVideoId(42)).toBeUndefined();
  });
});

describe("youTubeBackgroundEmbedUrl", () => {
  it("builds a muted, looping, control-free privacy-enhanced embed", () => {
    const url = new URL(youTubeBackgroundEmbedUrl(ID));

    expect(url.origin).toBe("https://www.youtube-nocookie.com");
    expect(url.pathname).toBe(`/embed/${ID}`);
    expect(url.searchParams.get("autoplay")).toBe("1");
    expect(url.searchParams.get("mute")).toBe("1");
    expect(url.searchParams.get("controls")).toBe("0");
    expect(url.searchParams.get("loop")).toBe("1");
    expect(url.searchParams.get("playlist")).toBe(ID);
    expect(url.searchParams.get("playsinline")).toBe("1");
  });
});
