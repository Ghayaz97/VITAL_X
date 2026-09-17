'use client';

import { useCallback, useRef } from 'react';

export interface AudioPromptOptions {
  text: string;
  lang?: string; // BCP-47 language code e.g. 'kn-IN', 'hi-IN', 'en-IN'
  rate?: number;
  pitch?: number;
  volume?: number;
}

export interface AudioProvider {
  speak(options: AudioPromptOptions): Promise<void>;
  cancel(): void;
  isSupported(): boolean;
}

// ── BrowserSpeechProvider ────────────────────────────────────────────────────
// Uses Web Speech API (SpeechSynthesis). Available in all modern browsers.
class BrowserSpeechProvider implements AudioProvider {
  private utterance: SpeechSynthesisUtterance | null = null;

  isSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  speak({ text, lang = 'en-IN', rate = 0.9, pitch = 1.0, volume = 1.0 }: AudioPromptOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported()) {
        reject(new Error('SpeechSynthesis not available'));
        return;
      }
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = rate;
      utterance.pitch = pitch;
      utterance.volume = volume;
      utterance.onend = () => resolve();
      utterance.onerror = () => reject(new Error('SpeechSynthesis error'));
      this.utterance = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

// ── LocalFallbackProvider ────────────────────────────────────────────────────
// Silent no-op provider for environments without speech synthesis.
// Used as fallback when BrowserSpeechProvider is not available.
class LocalFallbackProvider implements AudioProvider {
  isSupported(): boolean {
    return true; // always available (silent)
  }

  speak(_options: AudioPromptOptions): Promise<void> {
    // Silent — no TTS hardware available. Gracefully degrades.
    return Promise.resolve();
  }

  cancel(): void {
    // No-op
  }
}

// ── Singleton provider resolution ────────────────────────────────────────────
let _provider: AudioProvider | null = null;

function getAudioProvider(): AudioProvider {
  if (_provider) return _provider;
  const browser = new BrowserSpeechProvider();
  _provider = browser.isSupported() ? browser : new LocalFallbackProvider();
  return _provider;
}

// ── useAudioPrompt hook ──────────────────────────────────────────────────────
// Drop-in replacement for all `setTimeout(() => setIsPlayingAudio(false), 2500)` 
// placeholder patterns throughout the app.
//
// Usage:
//   const { speak, isPlaying, cancel } = useAudioPrompt();
//   speak({ text: 'What brings you here today?', lang: 'en-IN' });

export function useAudioPrompt() {
  const isPlayingRef = useRef(false);
  const provider = getAudioProvider();

  const speak = useCallback(
    async (options: AudioPromptOptions) => {
      if (isPlayingRef.current) {
        provider.cancel();
      }
      isPlayingRef.current = true;
      try {
        await provider.speak(options);
      } catch {
        // Silent failure — audio is enhancement, not required functionality
      } finally {
        isPlayingRef.current = false;
      }
    },
    [provider]
  );

  const cancel = useCallback(() => {
    provider.cancel();
    isPlayingRef.current = false;
  }, [provider]);

  return { speak, cancel, isSupported: provider.isSupported() };
}

// ── Clinical Prompt Templates ────────────────────────────────────────────────
// Multilingual patient-facing prompts used across all 5 intake steps.
export const CLINICAL_PROMPTS = {
  'kn-IN': {
    welcome: 'VITAL-X ಗೆ ಸ್ವಾಗತ. ನಿಮ್ಮ ಭಾಷೆ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಒಪ್ಪಿಗೆ ನೀಡಿ.',
    converse: 'ಇಂದು ನಿಮಗೆ ಏನು ತೊಂದರೆ ಇದೆ? ಮೈಕ್ ಟ್ಯಾಪ್ ಮಾಡಿ ಮಾತನಾಡಿ.',
    scan: 'ನಿಮ್ಮ ಹಿಂದಿನ ಪ್ರಿಸ್ಕ್ರಿಪ್ಷನ್ ಅಥವಾ ಲ್ಯಾಬ್ ರಿಪೋರ್ಟ್ ಇದ್ದರೆ ಅಪ್ಲೋಡ್ ಮಾಡಿ.',
    consent:
      'VITAL-X ನಿಮ್ಮ ಆರೋಗ್ಯ ಮಾಹಿತಿಯನ್ನು ವೈದ್ಯರಿಗೆ ಸಿದ್ಧಪಡಿಸಲು ಸಂಗ್ರಹಿಸುತ್ತದೆ. ನೀವು ಒಪ್ಪುತ್ತೀರಾ?',
  },
  'hi-IN': {
    welcome: 'VITAL-X में आपका स्वागत है। अपनी भाषा चुनें और अनुमति दें।',
    converse: 'आज आप किस समस्या के लिए आए हैं? माइक टैप करके बोलें।',
    scan: 'यदि आपके पास पुराना प्रेस्क्रिप्शन या लैब रिपोर्ट है तो अपलोड करें।',
    consent: 'VITAL-X आपकी स्वास्थ्य जानकारी डॉक्टर के लिए एकत्र करेगा। क्या आप सहमत हैं?',
  },
  'en-IN': {
    welcome: 'Welcome to VITAL-X. Please select your language and provide consent to begin.',
    converse: 'What brings you here today? Tap the microphone and speak naturally.',
    scan: 'Please upload any previous prescriptions, lab reports, or discharge summaries.',
    consent:
      'VITAL-X will collect information about your health to prepare a clinical history for your doctor. Do you agree?',
  },
} as const;

export type SupportedLanguage = keyof typeof CLINICAL_PROMPTS;
