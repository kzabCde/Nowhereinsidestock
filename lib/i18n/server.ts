import { cookies, headers } from "next/headers";
import { createTranslator, defaultLocale, LOCALE_COOKIE, normalizeLocale, type Locale } from "./config";

export async function getLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
  if (cookieLocale) return cookieLocale;

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language") ?? "";
  for (const candidate of acceptLanguage.split(",")) {
    const locale = normalizeLocale(candidate.split(";")[0]?.trim());
    if (locale) return locale;
  }
  return defaultLocale;
}

export async function getServerI18n() {
  const locale = await getLocale();
  return { locale, t: createTranslator(locale) };
}
