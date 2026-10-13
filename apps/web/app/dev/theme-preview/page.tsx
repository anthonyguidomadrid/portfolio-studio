import { notFound } from "next/navigation";
import { ThemePreview } from "@/components/theme-preview";

export default function ThemePreviewPage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="mx-auto w-full max-w-content px-page-gutter">
      <ThemePreview />
    </main>
  );
}
