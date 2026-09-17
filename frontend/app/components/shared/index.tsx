'use client';
import React from 'react';

interface ProgressProps {
  current: number;
  total: number;
  labels?: string[];
}

export function Progress({ current, total, labels }: ProgressProps) {
  return (
    <div className="flex items-center justify-center space-x-2 py-2">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const done = step < current;
        const active = step === current;
        return (
          <React.Fragment key={step}>
            <div className={`flex flex-col items-center space-y-1`}>
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  active
                    ? 'bg-emerald-600 text-white ring-2 ring-emerald-400 ring-offset-2 ring-offset-[var(--bg-app)] scale-110'
                    : done
                    ? 'bg-emerald-900 text-emerald-400 border border-emerald-700'
                    : 'bg-[var(--bg-surface)] text-[var(--text-tertiary)] border border-[var(--border-subtle)]'
                }`}
              >
                {done ? '✓' : step}
              </div>
              {labels && labels[i] && (
                <span className={`text-[9px] font-medium hidden sm:block ${active ? 'text-emerald-400' : 'text-[var(--text-tertiary)]'}`}>
                  {labels[i]}
                </span>
              )}
            </div>
            {i < total - 1 && (
              <div className={`h-0.5 w-6 sm:w-10 rounded-full transition-all duration-300 ${done ? 'bg-emerald-700' : 'bg-[var(--border-subtle)]'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4">
      <div className="text-3xl">⚠️</div>
      <div>
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-500 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-3">
      <div className="w-8 h-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-[var(--text-secondary)]">{message}</p>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({ open, title, body, confirmLabel = 'Confirm', cancelLabel = 'Cancel', danger = false, onConfirm, onCancel }: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-2xl p-6 shadow-2xl space-y-4">
        <h3 className="text-base font-semibold text-[var(--text-primary)]">{title}</h3>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{body}</p>
        <div className="flex items-center space-x-3 pt-1">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg border border-[var(--border-medium)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-surface-elevated)] transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-lg text-white text-sm font-semibold transition-colors ${
              danger ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

interface AudioButtonProps {
  onClick: () => void;
  isPlaying: boolean;
  label?: string;
  playingLabel?: string;
}

export function AudioButton({ onClick, isPlaying, label = 'Hear Question', playingLabel = 'Speaking…' }: AudioButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={isPlaying ? playingLabel : label}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-clinical flex items-center space-x-1.5 ${
        isPlaying
          ? 'bg-amber-600 text-white animate-pulse'
          : 'bg-[var(--bg-surface-elevated)] hover:bg-[var(--bg-surface)] text-amber-400 border border-amber-500/30'
      }`}
    >
      <span>🔊</span>
      <span>{isPlaying ? playingLabel : label}</span>
    </button>
  );
}
