'use client';

import React from 'react';

interface TruthEngineBannerProps {
  truthState: any;
}

export default function TruthEngineBanner({ truthState }: TruthEngineBannerProps) {
  if (!truthState) return null;

  const caseIntegrity = truthState.case_integrity || truthState.status || 'UNKNOWN';
  const exportBlocked = truthState.export_blocked ?? false;
  const unresolvedConflicts = truthState.unresolved_conflicts || 0;

  type BannerConfig = {
    bg: string;
    border: string;
    text: string;
    icon: string;
    label: string;
    labelStyle: string;
    headline: string;
    description: string;
  };

  let config: BannerConfig = {
    bg: 'bg-[var(--bg-surface-elevated)]',
    border: 'border-[var(--border-subtle)]',
    text: 'text-[var(--text-secondary)]',
    icon: '🔄',
    label: 'Reviewing',
    labelStyle: 'bg-[var(--bg-app)] text-[var(--text-tertiary)] border-[var(--border-medium)]',
    headline: 'Reviewing this case',
    description: 'Analyzing clinical claims from patient intake.',
  };

  if (caseIntegrity === 'CONFLICT' || exportBlocked) {
    config = {
      bg: 'bg-red-950/25',
      border: 'border-red-500/50',
      text: 'text-red-200',
      icon: '⚠️',
      label: 'Conflict',
      labelStyle: 'bg-red-500/15 text-red-400 border-red-500/30',
      headline: `This case has ${unresolvedConflicts > 0 ? `${unresolvedConflicts} ` : 'a '}conflict${unresolvedConflicts !== 1 ? 's' : ''} that need${unresolvedConflicts === 1 ? 's' : ''} your review.`,
      description: 'The patient\'s statement and previous records do not agree. Review the Timeline below and verify each conflict before exporting.',
    };
  } else if (caseIntegrity === 'REVIEW_REQUIRED') {
    config = {
      bg: 'bg-amber-950/20',
      border: 'border-amber-800/50',
      text: 'text-amber-200',
      icon: '🔍',
      label: 'Needs Review',
      labelStyle: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
      headline: 'Unverified information is waiting for your review.',
      description: 'No direct contradictions found. Review and verify the clinical claims below to release the record.',
    };
  } else if (caseIntegrity === 'VERIFIED' || caseIntegrity === 'CLEAR') {
    config = {
      bg: 'bg-emerald-950/20',
      border: 'border-emerald-800/50',
      text: 'text-emerald-200',
      icon: '✓',
      label: 'Verified',
      labelStyle: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      headline: 'All information verified. Record is ready to export.',
      description: 'All clinical claims have been verified by a practitioner. The FHIR record is ready for export.',
    };
  }

  return (
    <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${config.bg} ${config.border} transition-clinical`}>
      <div className="flex items-start space-x-3">
        <span className="text-lg leading-none mt-0.5 shrink-0">{config.icon}</span>
        <div>
          <p className="text-sm font-bold tracking-tight text-[var(--text-primary)]">{config.headline}</p>
          <p className="text-xs mt-0.5 text-[var(--text-secondary)] leading-relaxed">{config.description}</p>
        </div>
      </div>

      <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wide border shrink-0 font-mono-code ${config.labelStyle}`}>
        {config.label}
      </span>
    </div>
  );
}
