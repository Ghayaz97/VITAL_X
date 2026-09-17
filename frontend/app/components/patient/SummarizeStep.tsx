'use client';
import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import type { TranslationKeys } from '../../i18n/types';

interface SummarizeStepProps {
  tr: TranslationKeys;
  truthState: any;
  routingState: string;
  onGoToConsult: () => void;
  onBack?: () => void;
}

export default function SummarizeStep({ truthState, routingState, onGoToConsult, onBack }: SummarizeStepProps) {
  const isLoading = !truthState;
  const caseIntegrity = truthState?.case_integrity || 'REVIEW_REQUIRED';
  const hasConflict = caseIntegrity === 'CONFLICT' || (truthState?.unresolved_conflicts ?? 0) > 0;
  const isUrgent = routingState === 'URGENT';

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto py-16 flex flex-col items-center justify-center space-y-4 animate-fadeIn">
        <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
        <p className="text-base font-semibold text-[var(--text-primary)]">Preparing your case…</p>
        <p className="text-sm text-[var(--text-secondary)] text-center max-w-xs">
          We are organizing the information you shared with us.
        </p>
        <Button variant="outline" size="lg" className="mt-4" onClick={onGoToConsult}>
          Continue anyway →
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
      {/* Central outcome message */}
      <div className="text-center space-y-2 pt-4">
        {isUrgent ? (
          <>
            <div className="text-4xl">🔴</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-red-400">
              Urgent attention needed.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              The clinic has been notified. Please wait and a staff member will come to you.
            </p>
          </>
        ) : hasConflict ? (
          <>
            <div className="text-4xl">📋</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Your health information is ready.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Some information needs clarification — your doctor will check this with you.
            </p>
          </>
        ) : (
          <>
            <div className="text-4xl">✅</div>
            <h2 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">
              Your health information is ready.
            </h2>
            <p className="text-base text-[var(--text-secondary)]">
              Everything looks good. Your doctor will review this shortly.
            </p>
          </>
        )}
      </div>

      {/* What was collected — simple summary */}
      <Card className="p-5 space-y-4">
        <p className="text-sm font-bold text-[var(--text-secondary)]">What we collected</p>
        <div className="space-y-3">
          <div className="flex items-center space-x-3 py-2.5 border-b border-[var(--border-subtle)]">
            <span className="text-lg shrink-0">🗣</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">What you told us</p>
              <p className="text-xs text-[var(--text-secondary)]">Your description of your health concern</p>
            </div>
            <span className="ml-auto text-emerald-400 text-sm shrink-0">✓</span>
          </div>

          <div className="flex items-center space-x-3 py-2.5 border-b border-[var(--border-subtle)]">
            <span className="text-lg shrink-0">📄</span>
            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">Previous records</p>
              <p className="text-xs text-[var(--text-secondary)]">Prescription and lab report from 2025</p>
            </div>
            <span className="ml-auto text-emerald-400 text-sm shrink-0">✓</span>
          </div>

          {hasConflict && (
            <div className="flex items-start space-x-3 py-2.5">
              <span className="text-lg shrink-0 mt-0.5">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-amber-400">Needs clarification</p>
                <p className="text-xs text-[var(--text-secondary)]">Some information between your statement and old records does not match. Your doctor will ask you about this.</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Primary CTA */}
      <Button
        variant="primary"
        size="lg"
        className="w-full text-base py-4 rounded-xl touch-target"
        onClick={onGoToConsult}
        aria-label="Confirm case is ready for practitioner"
      >
        {isUrgent ? 'Alert has been sent ✓' : 'I\'m ready →'}
      </Button>

      <p className="text-xs text-center text-[var(--text-tertiary)] px-4">
        Your case file is now with the doctor&apos;s queue.
      </p>
    </div>
  );
}
