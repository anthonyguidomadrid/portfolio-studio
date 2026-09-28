import Link from "next/link";
import { getTranslations } from "next-intl/server";

export default async function NotFound() {
  const t = await getTranslations("notFound");
  const common = await getTranslations("common");

  return (
    <main className="page-shell not-found">
      <p className="not-found-code">{t("code")}</p>
      <h1>
        {t("firstLine")}
        <br />
        {t("secondLine")}
      </h1>
      <Link className="text-link" href="/">
        {common("returnHome")} <span aria-hidden="true">↗</span>
      </Link>
    </main>
  );
}
