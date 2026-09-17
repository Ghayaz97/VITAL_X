'use client';

import React from 'react';
import ThemeToggle from '../ui/ThemeToggle';
import type { Locale } from '../../i18n/types';
import type { PractitionerSession } from '../../lib/auth';

interface AppHeaderProps {
  mode: 'patient' | 'doctor';
  setMode: (mode: 'patient' | 'doctor') => void;
  queueCount: number;
  onResetSession: () => void;
  sessionId: string;
  locale: Locale;
  setLocale: (l: Locale) => void;
  session: PractitionerSession | null;
  onLogout: () => void;
}

const LOCALES: { code: Locale; label: string }[] = [
  { code: 'en-IN', label: 'EN' },
  { code: 'hi-IN', label: 'हि' },
  { code: 'kn-IN', label: 'ಕ' },
];

export default function AppHeader({
  mode,
  setMode,
  queueCount,
  onResetSession,
  sessionId,
  locale,
  setLocale,
  session,
  onLogout,
}: AppHeaderProps) {
  return (
    <header className="border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]/90 backdrop-blur-md sticky top-0 z-30 px-4 md:px-8 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-emerald-600 flex items-center justify-center shrink-0">
              <span className="text-white text-[10px] font-extrabold leading-none">VX</span>
            </div>
            <span className="text-sm font-bold tracking-tight text-[var(--text-primary)]">VITAL-X</span>
          </div>
          {/* Mode indicator — subtle, not a tab switcher */}
          <span className="text-[var(--border-medium)] text-sm select-none hidden sm:inline">/</span>
          <span className="text-xs text-[var(--text-tertiary)] hidden sm:inline font-medium">
            {mode === 'patient' ? 'Patient Kiosk' : 'Practitioner Workstation'}
          </span>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          {/* Language selector — compact */}
          <div className="flex items-center bg-[var(--bg-app)] border border-[var(--border-subtle)] p-0.5 rounded-lg">
            {LOCALES.map((loc) => (
              <button
                key={loc.code}
                onClick={() => setLocale(loc.code)}
                aria-label={`Language: ${loc.label}`}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-clinical ${
                  locale === loc.code
                    ? 'bg-emerald-600 text-white'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {loc.label}
              </button>
            ))}
          </div>

          <ThemeToggle />

          {/* Switch view — only visible after landing */}
          {mode === 'patient' ? (
            <button
              onClick={() => setMode('doctor')}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-clinical"
            >
              <span>Practitioner</span>
              {queueCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {queueCount}
                </span>
              )}
            </button>
          ) : (
            <button
              onClick={() => setMode('patient')}
              className="hidden sm:inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-transparent hover:border-[var(--border-subtle)] transition-clinical"
            >
              ← Patient Kiosk
            </button>
          )}

          {/* Context-sensitive actions */}
          {session && mode === 'doctor' && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-950/20 transition-clinical border border-transparent hover:border-red-900/40"
              title="Sign out practitioner"
            >
              Sign Out
            </button>
          )}

          {sessionId && mode === 'patient' && (
            <button
              onClick={onResetSession}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-[var(--text-tertiary)] hover:text-red-400 hover:bg-red-950/20 transition-clinical border border-transparent hover:border-red-900/40"
              title="Reset session"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
