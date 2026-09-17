'use client';

import React from 'react';
import type { Locale, TranslationKeys } from '../../i18n/types';

interface RoleSelectionLandingProps {
  onSelectRole: (role: 'patient' | 'doctor') => void;
  locale: Locale;
  setLocale: (l: Locale) => void;
  tr: TranslationKeys;
}

const LOCALES = [
  { code: 'en-IN' as Locale, label: 'English' },
  { code: 'hi-IN' as Locale, label: 'हिन्दी' },
  { code: 'kn-IN' as Locale, label: 'ಕನ್ನಡ' },
];

export default function RoleSelectionLanding({ onSelectRole, locale, setLocale }: RoleSelectionLandingProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-16 animate-fadeIn">
      {/* Brand */}
      <div className="text-center space-y-3 mb-14">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
          <span className="text-emerald-400 font-extrabold text-lg tracking-tighter">VX</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-none">
          VITAL-X
        </h1>
        <p className="text-xl sm:text-2xl font-semibold text-[var(--text-secondary)] tracking-tight mt-2">
          Let&apos;s understand your health.
        </p>
        <p className="text-sm text-[var(--text-tertiary)] font-normal max-w-xs mx-auto">
          Tell us what brings you here. You can speak or tap.
        </p>
      </div>

      {/* Primary Actions */}
      <div className="w-full max-w-xs space-y-3">
        <button
          onClick={() => onSelectRole('patient')}
          className="w-full py-4 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-lg tracking-tight transition-clinical shadow-lg shadow-emerald-950/30 hover:shadow-emerald-950/50 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-app)]"
        >
          I&apos;m a patient
        </button>

        <button
          onClick={() => onSelectRole('doctor')}
          className="w-full py-3.5 px-6 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-clinical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]"
        >
          Practitioner Workstation →
        </button>
      </div>

      {/* Language Switcher */}
      <div className="mt-12 flex items-center space-x-1 text-sm text-[var(--text-tertiary)]">
        {LOCALES.map((loc, idx) => (
          <React.Fragment key={loc.code}>
            <button
              onClick={() => setLocale(loc.code)}
              aria-label={`Switch language to ${loc.label}`}
              className={`px-2 py-1 rounded-md transition-clinical font-medium ${
                locale === loc.code
                  ? 'text-[var(--text-primary)] font-semibold'
                  : 'hover:text-[var(--text-secondary)]'
              }`}
            >
              {loc.label}
            </button>
            {idx < LOCALES.length - 1 && (
              <span className="text-[var(--border-medium)] select-none">·</span>
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Quiet SIH attribution */}
      <p className="mt-8 text-xs text-[var(--text-tertiary)] text-center">
        SIH 2026 · Problem SIH26047 · Ministry of Ayush
      </p>
    </div>
  );
}
