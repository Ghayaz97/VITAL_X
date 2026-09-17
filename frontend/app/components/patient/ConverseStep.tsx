'use client';
import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import { AudioButton } from '../shared/index';
import { useAudioPrompt, CLINICAL_PROMPTS, SupportedLanguage } from '../../hooks/useAudioPrompt';
import type { TranslationKeys, Locale } from '../../i18n/types';

interface ConverseStepProps {
  sessionId: string;
  locale: Locale;
  tr: TranslationKeys;
  statement: string;
  setStatement: (v: string) => void;
  micState: string;
  onStartVoiceInput: () => void;
  onSubmitAnswer: (text: string, mode: 'voice' | 'touch' | 'text') => void;
  redFlags: any[];
  routingState: string;
  onBack?: () => void;
}

const TOUCH_OPTIONS = [
  { label: 'Joint pain', icon: '🦴' },
  { label: 'Chest pain', icon: '💛' },
  { label: 'Fever', icon: '🌡️' },
  { label: 'No diabetes history', icon: '❌' },
  { label: 'Taking Metformin', icon: '💊' },
  { label: 'Unknown surgical history', icon: '🏥' },
];

export default function ConverseStep({
  locale, statement, setStatement,
  micState, onStartVoiceInput, onSubmitAnswer,
  redFlags, routingState, onBack,
}: ConverseStepProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'touch' | 'text'>('voice');
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showChestPainBranch, setShowChestPainBranch] = useState(false);
  const [dyspnoeaAnswer, setDyspnoeaAnswer] = useState('');
  const [onsetAnswer, setOnsetAnswer] = useState('');
  const [locationAnswer, setLocationAnswer] = useState('');
  const [radiationAnswer, setRadiationAnswer] = useState('');
  const { speak } = useAudioPrompt();

  const playAudioPrompt = async () => {
    setIsPlayingAudio(true);
    const lang = (locale as SupportedLanguage) in CLINICAL_PROMPTS ? (locale as SupportedLanguage) : 'en-IN';
    await speak({ text: CLINICAL_PROMPTS[lang].converse, lang: locale });
    setIsPlayingAudio(false);
  };

  const handleTextSubmit = (textVal: string, modeVal: 'voice' | 'touch' | 'text') => {
    const lower = textVal.toLowerCase();
    const isChestPain = lower.includes('chest pain') || lower.includes('chest') || lower.includes('hridshoola');
    if (isChestPain && !showChestPainBranch) {
      setShowChestPainBranch(true);
      return;
    }
    onSubmitAnswer(textVal, modeVal);
  };

  const handleChestPainBranchSubmit = () => {
    const fullStatement = `${statement || 'Chest Pain'} (Shortness of breath: ${dyspnoeaAnswer || 'Yes'}, Onset: ${onsetAnswer || 'Today'}, Location: ${locationAnswer || 'Center'}, Radiation: ${radiationAnswer || 'Arm'})`;
    setShowChestPainBranch(false);
    onSubmitAnswer(fullStatement, inputMode);
  };

  const isUrgent = routingState === 'URGENT' || redFlags.length > 0;

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
      {/* URGENT Safety Banner — calm but firm */}
      {isUrgent && (
        <div className="bg-red-950/80 border-2 border-red-500/80 rounded-2xl p-6 text-center space-y-4 shadow-xl">
          <div className="text-4xl">🔴</div>
          <div>
            <h3 className="text-xl font-bold text-white">Please wait — we need to check something important.</h3>
            <p className="text-sm text-red-200 mt-2 leading-relaxed max-w-sm mx-auto">
              The information you shared needs urgent attention. Your case has been marked for immediate review.
            </p>
          </div>
          <button
            type="button"
            className="py-3 px-8 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-base transition-clinical touch-target"
          >
            Alert the clinic staff
          </button>
        </div>
      )}

      {/* Main Conversation Card */}
      {!isUrgent && (
        <Card className="p-6 space-y-6">
          {/* Question */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
                What brings you here today?
              </h2>
              <p className="text-sm text-[var(--text-secondary)]">
                {inputMode === 'voice'
                  ? 'Tap the microphone and speak naturally.'
                  : inputMode === 'touch'
                  ? 'Tap the option that best describes your concern.'
                  : 'Type what you are experiencing.'}
              </p>
            </div>
            <AudioButton
              onClick={playAudioPrompt}
              isPlaying={isPlayingAudio}
              label="Hear question"
              playingLabel="Speaking…"
            />
          </div>

          {/* Input Mode Selector */}
          <div className="flex items-center gap-2 bg-[var(--bg-surface-elevated)] p-1 rounded-xl border border-[var(--border-subtle)]">
            {(['voice', 'touch', 'text'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setInputMode(m)}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-clinical ${
                  inputMode === m
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {m === 'voice' ? '🎙 Speak' : m === 'touch' ? '👆 Tap' : '⌨ Type'}
              </button>
            ))}
          </div>

          {/* VOICE MODE */}
          {inputMode === 'voice' && (
            <div className="space-y-5">
              <div className="flex flex-col items-center space-y-4 py-4">
                {/* Large mic button */}
                <button
                  type="button"
                  onClick={onStartVoiceInput}
                  aria-label={micState === 'LISTENING' ? 'Listening — tap to stop' : 'Tap to start speaking'}
                  className={`w-32 h-32 rounded-full flex flex-col items-center justify-center transition-clinical focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-emerald-500/40 ${
                    micState === 'LISTENING'
                      ? 'bg-red-600 text-white mic-recording shadow-xl shadow-red-950'
                      : 'bg-emerald-600/10 text-emerald-400 border-2 border-emerald-500/40 hover:bg-emerald-600/20 hover:border-emerald-500 hover:scale-105'
                  }`}
                >
                  <span className="text-5xl leading-none">{micState === 'LISTENING' ? '⏹' : '🎙️'}</span>
                  <span className="text-xs font-bold mt-2 tracking-wider">
                    {micState === 'LISTENING' ? 'Listening…' : 'TAP'}
                  </span>
                </button>
                <p className="text-xs text-[var(--text-tertiary)]">
                  Language: {locale === 'kn-IN' ? 'ಕನ್ನಡ' : locale === 'hi-IN' ? 'हिंदी' : 'English'}
                </p>
              </div>

              {/* Fallback notice */}
              {micState === 'FALLBACK' && (
                <div className="p-4 bg-amber-950/30 border border-amber-800/50 rounded-xl text-sm text-amber-200 text-center space-y-3">
                  <p>Microphone not available on this device.</p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" size="sm" onClick={onStartVoiceInput}>Try again</Button>
                    <Button variant="secondary" size="sm" onClick={() => setInputMode('touch')}>Tap instead</Button>
                  </div>
                </div>
              )}

              {/* Transcript — shown as a quote after speaking */}
              {(micState === 'COMPLETE' || micState === 'PROCESSING' || statement) && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">
                    {micState === 'PROCESSING' ? 'Processing…' : 'You said:'}
                  </p>
                  <blockquote className="border-l-4 border-emerald-500 pl-4 py-1">
                    <p className="text-base font-semibold text-[var(--text-primary)] leading-relaxed italic">
                      &ldquo;{statement || '…'}&rdquo;
                    </p>
                  </blockquote>
                  {/* Allow correction */}
                  <details className="group">
                    <summary className="text-xs text-[var(--text-tertiary)] cursor-pointer hover:text-[var(--text-primary)] transition-clinical select-none">
                      Not quite right? Edit →
                    </summary>
                    <textarea
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      rows={3}
                      className="mt-2 w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg p-3 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none"
                      placeholder="Edit what you said…"
                    />
                  </details>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full text-base py-3.5 rounded-xl"
                onClick={() => handleTextSubmit(statement, 'voice')}
                disabled={!statement && micState !== 'COMPLETE'}
              >
                Continue →
              </Button>
            </div>
          )}

          {/* TOUCH MODE */}
          {inputMode === 'touch' && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {TOUCH_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => { setStatement(opt.label); handleTextSubmit(opt.label, 'touch'); }}
                    className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] hover:bg-emerald-600/10 border border-[var(--border-medium)] hover:border-emerald-500/60 text-left transition-clinical touch-target flex items-center space-x-3"
                  >
                    <span className="text-2xl shrink-0">{opt.icon}</span>
                    <span className="text-sm font-semibold text-[var(--text-primary)]">{opt.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TEXT MODE */}
          {inputMode === 'text' && (
            <div className="space-y-3">
              <textarea
                value={statement}
                onChange={(e) => setStatement(e.target.value)}
                rows={4}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-4 text-base text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 resize-none transition-colors placeholder:text-[var(--text-tertiary)]"
                placeholder="Describe what you are feeling…"
                aria-label="Describe your symptoms"
              />
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base py-3.5 rounded-xl"
                onClick={() => handleTextSubmit(statement, 'text')}
                disabled={!statement.trim()}
              >
                Continue →
              </Button>
            </div>
          )}
        </Card>
      )}

      {/* CHEST PAIN SAFETY BRANCH MODAL */}
      {showChestPainBranch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-[var(--bg-surface)] border-2 border-red-500/80 rounded-2xl p-6 shadow-2xl space-y-5 animate-scaleIn">
            <div className="text-center space-y-1">
              <div className="text-3xl">⚠️</div>
              <h3 className="text-xl font-bold text-[var(--text-primary)]">A few quick questions</h3>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                Chest pain sometimes needs prompt attention. Let&apos;s check a few important things.
              </p>
            </div>

            <div className="space-y-4">
              {/* Q1 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Are you having difficulty breathing?</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Yes', 'No', 'Not sure'].map((opt) => (
                    <button key={opt} onClick={() => setDyspnoeaAnswer(opt)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-clinical ${
                        dyspnoeaAnswer === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-red-400'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q2 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">When did the pain start?</p>
                <div className="grid grid-cols-2 gap-2">
                  {['Just now', 'Today', 'A few days ago', 'Longer ago'].map((opt) => (
                    <button key={opt} onClick={() => setOnsetAnswer(opt)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-clinical ${
                        onsetAnswer === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-red-400'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q3 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Where is the pain?</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Center', 'Left side', 'Right side'].map((opt) => (
                    <button key={opt} onClick={() => setLocationAnswer(opt)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-clinical ${
                        locationAnswer === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-red-400'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>

              {/* Q4 */}
              <div className="space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">Does it spread to your arm, jaw, or back?</p>
                <div className="grid grid-cols-3 gap-2">
                  {['Arm', 'Jaw', 'No'].map((opt) => (
                    <button key={opt} onClick={() => setRadiationAnswer(opt)}
                      className={`py-2.5 rounded-lg text-sm font-semibold border transition-clinical ${
                        radiationAnswer === opt ? 'bg-red-600 text-white border-red-500' : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)] text-[var(--text-secondary)] hover:border-red-400'
                      }`}>{opt}</button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              variant="danger"
              size="lg"
              className="w-full text-sm font-bold py-3 rounded-xl"
              onClick={handleChestPainBranchSubmit}
            >
              Send to doctor →
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
