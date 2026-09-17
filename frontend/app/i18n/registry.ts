// VITAL-X i18n Registry
import type { Locale, TranslationKeys } from './types';
import { translations } from './translations';
export function t(key: keyof TranslationKeys, locale: Locale): string {
  const dict = translations[locale] ?? translations['en-IN'];
  return (dict[key] as string) ?? (translations['en-IN'][key] as string) ?? key;
}
export function getTranslations(locale: Locale): TranslationKeys {
  return translations[locale] ?? translations['en-IN'];
}
export const SUPPORTED_LOCALES: Locale[] = ['en-IN', 'hi-IN', 'kn-IN'];
export const LOCALE_NAMES: Record<Locale, string> = { 'en-IN': 'English', 'hi-IN': 'हिंदी', 'kn-IN': 'ಕನ್ನಡ' };
export const LOCALE_TTS_CODE: Record<Locale, string> = { 'en-IN': 'en-IN', 'hi-IN': 'hi-IN', 'kn-IN': 'kn-IN' };
