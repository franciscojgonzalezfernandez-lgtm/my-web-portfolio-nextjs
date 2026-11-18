import type { Language } from "@/stores/useLanguageStore";

// Content keeps one field per language: `title` (English), `titleGerman`, `titleSpanish`.
export const localized = <T extends object, K extends keyof T & string>(
  item: T & Record<`${K}German` | `${K}Spanish`, T[K]>,
  key: K,
  language: Language,
): T[K] => {
  const fields = item as Record<`${K}German` | `${K}Spanish`, T[K]>;
  if (language === "german") return fields[`${key}German`];
  if (language === "spanish") return fields[`${key}Spanish`];
  return item[key];
};

// Inline copy that lives in a component rather than in data/.
export const byLanguage = <V>(
  language: Language,
  copy: { english: V; german: V; spanish: V },
): V => copy[language];

// BCP 47 tags for <html lang>, `lang` attributes and date formatting.
export const HTML_LANG: Record<Language, string> = {
  english: "en",
  german: "de",
  spanish: "es",
};

export const DATE_LOCALE: Record<Language, string> = {
  english: "en-GB",
  german: "de-CH",
  spanish: "es-ES",
};
