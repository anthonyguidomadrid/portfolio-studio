import type { ContentPage, PortfolioCollection } from "@/lib/types";

const image = (id: string, alt: string) => ({
  src: `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1800&q=85`,
  alt,
});

export const previewCollection: PortfolioCollection = {
  source: "preview",
  tags: [
    { id: "preview-video", name: "Video", slug: "video" },
    { id: "preview-image", name: "Image", slug: "image" },
  ],
  items: [
    {
      id: "preview-videobook",
      slug: "videobook",
      name: "Videobook",
      description:
        "Preview entry. Replace this text and image with published portfolio content.",
      cover: image(
        "photo-1485846234645-a62644f84728",
        "Monochrome cinema screen in a dark room",
      ),
      gallery: [
        image(
          "photo-1485846234645-a62644f84728",
          "Monochrome cinema screen in a dark room",
        ),
        image("photo-1478720568477-152d9b164e26", "Monochrome film equipment"),
      ],
      displayOrder: 1,
      tags: [{ id: "preview-video", name: "Video", slug: "video" }],
    },
    {
      id: "preview-study-01",
      slug: "study-01",
      name: "Study 01",
      description:
        "Preview entry. Replace this text and image with published portfolio content.",
      cover: image(
        "photo-1518005020951-eccb494ad742",
        "Abstract monochrome architectural forms",
      ),
      gallery: [
        image(
          "photo-1518005020951-eccb494ad742",
          "Abstract monochrome architectural forms",
        ),
      ],
      displayOrder: 2,
      tags: [{ id: "preview-image", name: "Image", slug: "image" }],
    },
    {
      id: "preview-study-02",
      slug: "study-02",
      name: "Study 02",
      description:
        "Preview entry. Replace this text and image with published portfolio content.",
      cover: image(
        "photo-1490481651871-ab68de25d43d",
        "Monochrome still life of clothing and fabric",
      ),
      gallery: [
        image(
          "photo-1490481651871-ab68de25d43d",
          "Monochrome still life of clothing and fabric",
        ),
      ],
      displayOrder: 3,
      tags: [{ id: "preview-image", name: "Image", slug: "image" }],
    },
  ],
};

export const previewPages: Record<string, ContentPage> = {
  about: {
    slug: "about",
    title: "About",
    contentHtml:
      "<p>An introduction will appear here when About copy is published in WordPress.</p>",
  },
  contact: {
    slug: "contact",
    title: "Contact",
    contentHtml:
      "<p>Contact information and any additional details can be added to the Contact page in WordPress.</p>",
  },
};
