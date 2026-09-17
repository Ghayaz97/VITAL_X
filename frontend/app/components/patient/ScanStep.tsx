'use client';
import React, { useRef, useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { TranslationKeys } from '../../i18n/types';

interface ScanStepProps {
  tr: TranslationKeys;
  onUploadDocument: () => void;
  onBack?: () => void;
  loading: boolean;
  docUploaded: boolean;
}

export default function ScanStep({ onUploadDocument, onBack, loading, docUploaded }: ScanStepProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [fileLoading, setFileLoading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    setFileLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setFileLoading(false);
    onUploadDocument();
  };

  const triggerFilePicker = () => fileInputRef.current?.click();

  return (
    <div className="max-w-2xl mx-auto space-y-5 animate-fadeIn">
      {/* Back button */}
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-clinical"
        >
          <span>←</span>
          <span>Back</span>
        </button>
      )}

      {/* Human-first header */}
      <div className="text-center space-y-1.5 pt-2">
        <h2 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Do you have an old prescription or test report?
        </h2>
        <p className="text-base text-[var(--text-secondary)]">
          Previous records help the doctor understand your health history.
        </p>
      </div>

      {/* Hidden real file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        className="hidden"
        onChange={handleFileChange}
        aria-hidden="true"
      />

      {!docUploaded ? (
        <Card className="p-5 space-y-4">
          {/* Drop zone */}
          <div
            className="border-2 border-dashed border-[var(--border-medium)] hover:border-emerald-500/50 rounded-2xl p-8 text-center space-y-4 transition-clinical cursor-pointer group"
            onClick={triggerFilePicker}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && triggerFilePicker()}
            aria-label="Choose a document file"
          >
            <div className="text-5xl group-hover:scale-110 transition-transform">
              {fileLoading ? '⏳' : selectedFileName ? '📎' : '📄'}
            </div>
            <div className="space-y-1">
              {selectedFileName ? (
                <>
                  <p className="text-sm font-semibold text-emerald-400">
                    {fileLoading ? 'Reading your document…' : selectedFileName}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Tap again to change file</p>
                </>
              ) : (
                <>
                  <p className="text-base font-semibold text-[var(--text-primary)]">
                    {loading ? 'Reading your document…' : 'Tap to choose a file'}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    PDF, photo of prescription, lab report, discharge summary
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="primary"
              size="lg"
              className="py-4 rounded-xl text-sm font-bold touch-target"
              onClick={triggerFilePicker}
              disabled={loading || fileLoading}
            >
              {fileLoading ? 'Reading…' : '📋  Upload prescription'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="py-4 rounded-xl text-sm font-bold touch-target"
              onClick={triggerFilePicker}
              disabled={loading || fileLoading}
            >
              {fileLoading ? 'Reading…' : '🧪  Upload lab report'}
            </Button>
          </div>

          {/* Skip option */}
          <div className="text-center">
            <button
              type="button"
              onClick={onUploadDocument}
              className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] underline underline-offset-2 transition-clinical"
            >
              I don&apos;t have any documents to share →
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-3 animate-fadeIn">
          {/* Success */}
          <div className="flex items-center space-x-3 p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-emerald-400">Information found</p>
              <p className="text-xs text-[var(--text-secondary)]">
                {selectedFileName ? `From: ${selectedFileName}` : 'We read your documents and found the following.'}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg">💊</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Medication</p>
                <p className="text-base font-bold text-[var(--text-primary)]">Metformin 500 mg</p>
                <p className="text-xs text-[var(--text-secondary)]">From: Previous prescription · 2025</p>
              </div>
            </div>

            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 flex items-start space-x-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0">
                <span className="text-lg">🧪</span>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wider">Lab result</p>
                <p className="text-base font-bold text-[var(--text-primary)]">HbA1c 8.2%</p>
                <p className="text-xs text-amber-400 font-medium">⚠ Above normal range — doctor will review</p>
                <p className="text-xs text-[var(--text-secondary)]">From: Lab report · 2025</p>
              </div>
            </div>
          </div>

          <p className="text-xs text-center text-[var(--text-tertiary)] px-4">
            These records will be shown to your doctor. They help explain your health history.
          </p>
        </div>
      )}
    </div>
  );
}
