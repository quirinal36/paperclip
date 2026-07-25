import i18n, { type InitOptions, type TOptions } from "i18next";
import { initReactI18next, useTranslation as useReactI18nextTranslation } from "react-i18next";

import { DEFAULT_LOCALE, i18nextResources, supportedLocales, type SupportedLocale } from "./locales";

const LOCALE_STORAGE_KEY = "paperclip.locale";

function isSupportedLocale(value: string | null | undefined): boolean {
  return typeof value === "string" && supportedLocales.includes(value);
}

/**
 * Map an arbitrary BCP-47 tag (e.g. `en-US`, `pt`, `ko-KR`) onto a locale we
 * actually ship. Tries the exact tag, then its base language, then any shipped
 * locale that shares the base language (so `pt` can resolve to `pt-BR`).
 */
function resolveSupportedLocale(candidate: string | null | undefined): SupportedLocale | null {
  if (!candidate) return null;
  if (isSupportedLocale(candidate)) return candidate;
  const base = candidate.split("-")[0];
  if (isSupportedLocale(base)) return base;
  const regionMatch = supportedLocales.find((locale) => locale.split("-")[0] === base);
  return regionMatch ?? null;
}

function readStoredLocale(): SupportedLocale | null {
  try {
    return resolveSupportedLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
  } catch {
    // localStorage can throw in private mode or sandboxed frames.
    return null;
  }
}

function detectBrowserLocale(): SupportedLocale | null {
  if (typeof navigator === "undefined") return null;
  const candidates = [navigator.language, ...(navigator.languages ?? [])];
  for (const candidate of candidates) {
    const resolved = resolveSupportedLocale(candidate);
    if (resolved) return resolved;
  }
  return null;
}

/**
 * Initial locale precedence: an explicit stored choice wins, otherwise fall
 * back to the browser's preferred languages, otherwise English.
 */
function resolveInitialLocale(): SupportedLocale {
  return readStoredLocale() ?? detectBrowserLocale() ?? DEFAULT_LOCALE;
}

function syncDocumentLang(locale: string) {
  try {
    document.documentElement.lang = locale;
  } catch {
    // No document (e.g. non-DOM test runners) — nothing to sync.
  }
}

const i18nextOptions: InitOptions = {
  resources: i18nextResources,
  lng: resolveInitialLocale(),
  fallbackLng: DEFAULT_LOCALE,
  supportedLngs: supportedLocales,
  defaultNS: "translation",
  interpolation: { escapeValue: false },
  returnObjects: false,
  initAsync: false,
};

void i18n.use(initReactI18next).init(i18nextOptions).catch((error: unknown) => {
  console.error("Failed to initialize i18next", error);
});

i18n.on("languageChanged", syncDocumentLang);
syncDocumentLang(i18n.language ?? DEFAULT_LOCALE);

export function t(key: string, options: TOptions = {}) {
  return i18n.t(key, options);
}

/** The active locale, always narrowed to one we actually ship. */
export function getLocale(): SupportedLocale {
  return resolveSupportedLocale(i18n.language) ?? DEFAULT_LOCALE;
}

/** Switch the active locale and persist the choice for future visits. */
export async function setLocale(locale: SupportedLocale): Promise<void> {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // Persistence is best-effort; still switch the in-memory language below.
  }
  await i18n.changeLanguage(locale);
}

export const useTranslation = useReactI18nextTranslation;
export { i18n, supportedLocales, DEFAULT_LOCALE };
export type { SupportedLocale };
