import { messages, type MessageKey } from "./messages";

export const locales = ["en", "th"] as const;
export type Locale = (typeof locales)[number];
export const LOCALE_COOKIE = "nis-locale";
export const defaultLocale: Locale = "en";

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const normalized = value.toLowerCase().split("-")[0];
  return locales.includes(normalized as Locale) ? (normalized as Locale) : null;
}

export function translate(locale: Locale, key: MessageKey, values?: Record<string, string | number>): string {
  let text: string = messages[locale][key] ?? messages.en[key] ?? key;
  if (!values) return text;
  for (const [name, value] of Object.entries(values)) {
    text = text.replaceAll(`{${name}}`, String(value));
  }
  return text;
}

export type Translator = (key: MessageKey, values?: Record<string, string | number>) => string;

export function createTranslator(locale: Locale): Translator {
  return (key, values) => translate(locale, key, values);
}
