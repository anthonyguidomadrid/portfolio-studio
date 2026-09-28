import { getTranslations } from "next-intl/server";

export async function PreviewNotice() {
  const t = await getTranslations("preview");

  return (
    <p className="preview-notice" role="status">
      {t("notice")}
    </p>
  );
}
