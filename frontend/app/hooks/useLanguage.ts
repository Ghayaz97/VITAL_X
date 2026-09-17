'use client';
import { useState, useEffect, useCallback } from 'react';
import type { Locale } from '../i18n/types';
import { getTranslations } from '../i18n/registry';
import type { TranslationKeys } from '../i18n/types';

const STORAGE_KEY = 'vitalx-locale';
const DEFAULT_LOCALE: Locale = 'en-IN';

export function useLanguage() {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Locale | null;
      if (stored && ['en-IN', 'hi-IN', 'kn-IN'].includes(stored)) {
        setLocaleState(stored);
      }
    } catch {}
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {}
    // Update html lang attribute for accessibility
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale;
    }
  }, []);

  const tr: TranslationKeys = getTranslations(locale);

  return { locale, setLocale, tr };
}
