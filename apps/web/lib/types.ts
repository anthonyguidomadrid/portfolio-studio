export interface PortfolioTag {
  id: number | string;
  name: string;
  slug: string;
}

export interface PortfolioImage {
  src: string;
  alt: string;
  caption?: string;
}

export interface PortfolioItem {
  id: number | string;
  slug: string;
  name: string;
  description: string;
  cover: PortfolioImage;
  gallery: PortfolioImage[];
  videoUrl?: string;
  credits?: string;
  displayOrder: number;
  tags: PortfolioTag[];
}

export interface PortfolioCollection {
  items: PortfolioItem[];
  tags: PortfolioTag[];
  source: "cms" | "preview";
}

export interface ContentPage {
  slug: string;
  title: string;
  contentHtml: string;
}

export interface ContentPageResult {
  page: ContentPage;
  source: "cms" | "preview";
}
