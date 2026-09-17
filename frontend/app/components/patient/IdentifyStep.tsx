'use client';
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AudioButton } from '../shared/index';
import { useAudioPrompt, CLINICAL_PROMPTS, SupportedLanguage } from '../../hooks/useAudioPrompt';
import type { TranslationKeys } from '../../i18n/types';
import type { Locale } from '../../i18n/types';

interface IdentifyStepProps {
  patientId: string;
  setPatientId: (v: string) => void;
  abhaId: string;
  setAbhaId: (v: string) => void;
  locale: Locale;
  setLocale: (v: Locale) => void;
  tr: TranslationKeys;
  consentGiven: boolean;
  setConsentGiven: (v: boolean) => void;
  onInitializeSession: () => void;
  loading: boolean;
}

const LOCALES: { code: Locale; label: string; native: string }[] = [
  { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'hi-IN', label: 'Hindi', native: 'हिंदी' },
  { code: 'en-IN', label: 'English', native: 'English' },
];

export default function IdentifyStep({
  patientId, setPatientId, abhaId, setAbhaId,
  locale, setLocale, consentGiven, setConsentGiven,
  onInitializeSession, loading,
}: IdentifyStepProps) {
  const [isPlayingConsentAudio, setIsPlayingConsentAudio] = useState(false);
  const [useAbhaScanner, setUseAbhaScanner] = useState(true);
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);
  const { speak } = useAudioPrompt();

  const playConsentAudio = async () => {
    setIsPlayingConsentAudio(true);
    const lang = (locale as SupportedLanguage) in CLINICAL_PROMPTS ? (locale as SupportedLanguage) : 'en-IN';
    await speak({ text: CLINICAL_PROMPTS[lang].consent, lang: locale });
    setIsPlayingConsentAudio(false);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Human-first header */}
      <div className="text-center space-y-2 pt-4">
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Who are you?
        </h2>
        <p className="text-base text-[var(--text-secondary)]">
          Enter your ABHA health ID, or continue as a new patient.
        </p>
      </div>

      {/* Language choice */}
      <Card className="p-5 space-y-3">
        <p className="text-sm font-semibold text-[var(--text-secondary)]">
          Choose your language
        </p>
        <div className="grid grid-cols-3 gap-2">
          {LOCALES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLocale(lang.code)}
              className={`py-4 rounded-xl border text-base font-bold transition-clinical touch-target flex flex-col items-center justify-center space-y-0.5 ${
                locale === lang.code
                  ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/40 ring-offset-2 ring-offset-[var(--bg-app)]'
                  : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-primary)] hover:border-emerald-500/60'
              }`}
            >
              <span className="text-lg">{lang.native}</span>
              <span className={`text-[10px] font-medium ${locale === lang.code ? 'text-emerald-100' : 'text-[var(--text-tertiary)]'}`}>
                {lang.label}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Identity */}
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold text-[var(--text-secondary)]">
            {useAbhaScanner ? 'Enter your ABHA ID' : 'Continue as new patient'}
          </p>
          <button
            type="button"
            onClick={() => setUseAbhaScanner(!useAbhaScanner)}
            className="text-xs text-emerald-400 hover:underline font-medium transition-clinical"
          >
            {useAbhaScanner ? 'No ABHA ID →' : '← Have ABHA ID'}
          </button>
        </div>

        {useAbhaScanner ? (
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
              Your ABHA (Ayushman Bharat Health Account) is a 14-digit health ID provided by the government.
            </p>
            <input
              type="text"
              value={abhaId}
              onChange={(e) => { setAbhaId(e.target.value); setPatientId(e.target.value || 'PT-SIH-042'); }}
              placeholder="e.g. 91-042-4242-88"
              className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl px-4 py-3 text-base text-[var(--text-primary)] text-center font-mono tracking-widest focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-[var(--text-tertiary)] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
              aria-label="ABHA ID"
            />
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              You can continue without an ABHA ID. A temporary case number will be assigned.
            </p>
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-lg px-4 py-3 text-sm text-[var(--text-secondary)] font-mono">
              {patientId || 'PT-SIH-042'}
            </div>
          </div>
        )}
      </Card>

      {/* Consent — human-first framing */}
      <Card className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-[var(--text-primary)]">Before we begin</p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Your health information stays private.</p>
          </div>
          <AudioButton
            onClick={playConsentAudio}
            isPlaying={isPlayingConsentAudio}
            label="Hear this"
            playingLabel="Playing…"
          />
        </div>

        <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 space-y-2">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Your health information will be used to prepare your case for the doctor. It will not be shared outside this session without your knowledge.
          </p>
          <button
            type="button"
            onClick={() => setShowPrivacyDetails(!showPrivacyDetails)}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline underline-offset-2 transition-clinical"
          >
            {showPrivacyDetails ? 'Hide details' : 'View full privacy details'}
          </button>
          {showPrivacyDetails && (
            <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] leading-relaxed space-y-1.5 animate-fadeIn">
              <p>Data is stored locally for this prototype session and is not transmitted to external services beyond the demonstration backend.</p>
              <p>VITAL-X prototype uses deterministic synthetic data only. ABHA IDs in this demo are illustrative and are not connected to the production ABDM system.</p>
              <p>Not for clinical use. SIH 2026 demonstration prototype only.</p>
            </div>
          )}
        </div>

        {/* Single primary consent action */}
        <button
          type="button"
          onClick={() => setConsentGiven(!consentGiven)}
          className={`w-full py-4 rounded-xl border-2 font-bold text-base transition-clinical flex items-center justify-center space-x-3 touch-target ${
            consentGiven
              ? 'bg-emerald-600 text-white border-emerald-500 ring-2 ring-emerald-400/30 ring-offset-2 ring-offset-[var(--bg-app)]'
              : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-emerald-500/60'
          }`}
        >
          <span className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 ${
            consentGiven ? 'bg-white border-white' : 'border-[var(--border-medium)]'
          }`}>
            {consentGiven && <span className="text-emerald-600 text-xs font-black">✓</span>}
          </span>
          <span>{consentGiven ? 'I agree — ready to continue' : 'I agree to share my information'}</span>
        </button>

        {!consentGiven && (
          <p className="text-xs text-center text-[var(--text-tertiary)]">
            You must agree to continue. Your doctor needs this information to help you.
          </p>
        )}
      </Card>

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full text-base py-4 rounded-xl touch-target"
        onClick={onInitializeSession}
        disabled={loading || !consentGiven}
        aria-label="Continue to health conversation"
      >
        {loading ? 'Setting up your session…' : 'Continue →'}
      </Button>
    </div>
  );
}
