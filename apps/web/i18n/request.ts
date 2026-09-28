import { cookies } from "next/headers";
import { getRequestConfig } from "next-intl/server";

const messages = {
  en: () => import("../messages/en.json").then((module) => module.default),
  es: () => import("../messages/es.json").then((module) => module.default),
};

export default getRequestConfig(async () => {
  const preferredLocale = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = preferredLocale === "es" ? "es" : "en";

  return {
    locale,
    messages: await messages[locale](),
  };
});
