'use client';

import React, { useState } from 'react';

interface TimelineEvent {
  id: string;
  year: string;
  dateStr: string;
  sourceType: 'patient_voice' | 'prescription' | 'lab_report' | 'hospital_record';
  sourceTitle: string;
  icon: string;
  claimText: string;
  extractedValue: string;
  status: 'SUPPORTED' | 'CONTRADICTS' | 'UNVERIFIED' | 'VERIFIED' | 'REJECTED';
  rawVerbatim?: string;
  claimId?: string;
}

interface ClinicalTruthTimelineProps {
  truthState: any;
  claims: any[];
  onVerifyClaim?: (claimId: string, action: string) => void;
}

const SOURCE_ICONS: Record<string, string> = {
  hospital_record: '🏥',
  prescription: '📋',
  lab_report: '🧪',
  patient_voice: '🗣️',
};

export default function ClinicalTruthTimeline({ truthState, claims, onVerifyClaim }: ClinicalTruthTimelineProps) {
  const [showWhyDrawer, setShowWhyDrawer] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);

  if (!truthState) return null;

  const caseIntegrity = truthState.case_integrity || 'REVIEW_REQUIRED';
  const conflicts = truthState.conflicts || [];
  const hasConflict = caseIntegrity === 'CONFLICT' || conflicts.length > 0;

  const timelineNodes: TimelineEvent[] = [
    {
      id: 'EV-2024-01',
      year: '2024',
      dateStr: '12 Oct 2024',
      sourceType: 'hospital_record',
      sourceTitle: 'Hospital Record',
      icon: SOURCE_ICONS.hospital_record,
      claimText: 'Diagnosed with Type 2 Diabetes Mellitus',
      extractedValue: 'Type 2 Diabetes (Active)',
      status: 'SUPPORTED',
      rawVerbatim: 'Diagnosed with Type 2 Diabetes Mellitus. Started on lifestyle modification.',
    },
    {
      id: 'EV-2025-01',
      year: '2025',
      dateStr: '15 Mar 2025',
      sourceType: 'prescription',
      sourceTitle: 'Prescription',
      icon: SOURCE_ICONS.prescription,
      claimText: 'Metformin 500mg BD after meals',
      extractedValue: 'Metformin 500mg BD',
      status: 'SUPPORTED',
      rawVerbatim: 'Rx: Tab Metformin 500mg BD after meals x 30 days.',
      claimId: 'CLM-DOC-METFORMIN',
    },
    {
      id: 'EV-2025-02',
      year: '2025',
      dateStr: '20 Mar 2025',
      sourceType: 'lab_report',
      sourceTitle: 'Lab Report',
      icon: SOURCE_ICONS.lab_report,
      claimText: 'HbA1c 8.2% — above normal range',
      extractedValue: 'HbA1c 8.2% ↑',
      status: 'SUPPORTED',
      rawVerbatim: 'HbA1c: 8.2% [HIGH]. Reference Range: 4.0–5.6%.',
      claimId: 'CLM-LAB-HBA1C',
    },
    {
      id: 'EV-2026-01',
      year: '2026',
      dateStr: 'Today',
      sourceType: 'patient_voice',
      sourceTitle: 'Patient Statement',
      icon: SOURCE_ICONS.patient_voice,
      claimText: '"I have joint pain and no history of diabetes."',
      extractedValue: 'Denies diabetes history',
      status: conflicts.length > 0 ? 'CONTRADICTS' : 'UNVERIFIED',
      rawVerbatim: 'I have joint pain and no history of diabetes.',
      claimId: 'CLM-PAT-DIABETES-DENIAL',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
          Clinical Truth Timeline
        </h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Where each part of this patient&apos;s health story came from.
        </p>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical connector line for mobile, hidden on desktop */}
        <div className="absolute top-6 bottom-6 left-5 w-px bg-[var(--border-medium)] md:hidden" />

        {/* Desktop horizontal line */}
        <div className="hidden md:block absolute top-7 left-[11%] right-[11%] h-px bg-[var(--border-medium)]" />

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative">
          {timelineNodes.map((node, idx) => {
            const isContradiction = node.status === 'CONTRADICTS';
            const isLast = idx === timelineNodes.length - 1;

            return (
              <div key={node.id} className="flex md:flex-col gap-4 md:gap-3 pl-10 md:pl-0 relative">
                {/* Node dot */}
                <div className="absolute left-0 md:left-1/2 md:-translate-x-1/2 top-0 md:top-0">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shadow-sm border-2 transition-clinical ${
                    isContradiction
                      ? 'bg-red-600 border-red-400 ring-4 ring-red-500/20 shadow-red-950'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-medium)]'
                  }`}>
                    {node.icon}
                  </div>
                </div>

                {/* Content */}
                <div className={`flex-1 md:mt-14 p-4 rounded-xl border transition-all ${
                  isContradiction
                    ? 'bg-red-950/20 border-red-500/60 ring-1 ring-red-500/20'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)]'
                }`}>
                  {/* Date + Source */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[11px] font-bold text-[var(--text-tertiary)] font-mono-code">{node.year}</span>
                      <span className="text-[11px] text-[var(--text-tertiary)] ml-1">· {node.dateStr}</span>
                    </div>
                    {isContradiction && (
                      <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider shrink-0">Conflicts</span>
                    )}
                  </div>

                  {/* Source label */}
                  <p className="text-xs font-semibold text-[var(--text-tertiary)] mb-1">{node.sourceTitle}</p>

                  {/* Main claim */}
                  <p className="text-sm font-bold text-[var(--text-primary)] leading-snug">{node.extractedValue}</p>

                  {/* Verbatim */}
                  <p className={`text-xs mt-1 leading-relaxed italic ${isContradiction ? 'text-red-200/80' : 'text-[var(--text-secondary)]'}`}>
                    {node.claimText}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Conflict / Verified Banner */}
      {hasConflict ? (
        <div className="p-5 rounded-2xl bg-red-950/30 border-2 border-red-500/60 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center space-x-2">
                <span className="text-red-400 font-bold text-sm uppercase tracking-widest font-mono-code">Conflict Detected</span>
              </div>
              <p className="text-base font-bold text-white">
                Two parts of this patient&apos;s history do not agree.
              </p>
              <p className="text-xs text-red-200/80 leading-relaxed">
                The patient&apos;s current statement differs from their prescription and lab results from 2025.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowWhyDrawer(true)}
            className="flex items-center space-x-2 py-2.5 px-5 rounded-xl bg-red-600 hover:bg-red-500 active:bg-red-700 text-white text-sm font-bold shadow-md transition-clinical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            <span>Why does this conflict?</span>
            <span>🔍</span>
          </button>
        </div>
      ) : caseIntegrity === 'VERIFIED' ? (
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/50 space-y-1">
          <div className="flex items-center space-x-2">
            <span className="text-emerald-400 text-lg">✓</span>
            <p className="text-base font-bold text-white">All evidence sources are aligned and verified.</p>
          </div>
          <p className="text-sm text-emerald-200/70 pl-7">The practitioner has reviewed and confirmed all clinical claims.</p>
        </div>
      ) : null}

      {/* WHY? Drawer Modal */}
      {showWhyDrawer && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-0 sm:px-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setShowWhyDrawer(false)}
          />

          <div className="relative w-full sm:max-w-lg bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-t-3xl sm:rounded-2xl p-6 shadow-2xl space-y-5 animate-slideUp max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                Why does this conflict?
              </h3>
              <button
                onClick={() => setShowWhyDrawer(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-surface-elevated)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-center text-sm font-bold transition-clinical"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Patient said */}
              <div>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Patient said today</p>
                <div className="p-4 rounded-xl bg-red-950/20 border border-red-500/30">
                  <p className="text-sm font-semibold text-[var(--text-primary)]">
                    &ldquo;I have joint pain and no history of diabetes.&rdquo;
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
                <span className="text-xs font-bold text-red-400 uppercase tracking-wider">disagrees with</span>
                <div className="flex-1 h-px bg-[var(--border-subtle)]" />
              </div>

              {/* Previous records show */}
              <div>
                <p className="text-xs font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-2">Previous records show</p>
                <div className="space-y-2">
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-start space-x-3">
                    <span className="text-lg shrink-0">📋</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)]">Prescription · 15 Mar 2025</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">Metformin 500mg BD</p>
                      <p className="text-xs text-[var(--text-secondary)]">A diabetes medication prescribed by a doctor</p>
                    </div>
                  </div>
                  <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-start space-x-3">
                    <span className="text-lg shrink-0">🧪</span>
                    <div>
                      <p className="text-xs font-semibold text-[var(--text-tertiary)]">Lab Report · 20 Mar 2025</p>
                      <p className="text-sm font-bold text-[var(--text-primary)]">HbA1c 8.2%</p>
                      <p className="text-xs text-amber-400">Elevated — consistent with diabetes</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Principle */}
              <div className="p-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] space-y-1">
                <p className="text-xs font-bold text-[var(--text-primary)]">How VITAL-X handles this</p>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  VITAL-X preserves both sources and flags the discrepancy. It does not decide which claim is true. Both are kept until the practitioner verifies.
                </p>
              </div>

              {/* Practitioner principle line */}
              <div className="flex items-center space-x-2 py-2 px-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)]">
                <span className="text-emerald-400 text-sm">→</span>
                <p className="text-xs font-semibold text-[var(--text-secondary)]">
                  AI proposes · <span className="text-[var(--text-primary)]">Practitioner decides</span>
                </p>
              </div>

              {/* Technical details — progressive disclosure */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                  className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline underline-offset-2 font-mono-code transition-clinical"
                >
                  {showTechnicalDetails ? 'Hide technical details' : 'View technical details (evidence hashes, concept codes)'}
                </button>
                {showTechnicalDetails && (
                  <div className="mt-3 p-3 rounded-lg bg-[var(--bg-app)] border border-[var(--border-subtle)] font-mono-code text-[11px] text-[var(--text-tertiary)] space-y-1 animate-fadeIn">
                    <div>Conflict ID: CNF-DIABETES-001</div>
                    <div>SNOMED Concept: SCT-44054006 (Type 2 Diabetes)</div>
                    <div>Document Provenance Hash: 8a9f42b10e...</div>
                    <div>Truth Engine Invariant: PRESERVE_UNRESOLVED</div>
                  </div>
                )}
              </div>

              {/* Verification actions if callback provided */}
              {onVerifyClaim && (
                <div className="pt-2 border-t border-[var(--border-subtle)] space-y-2">
                  <p className="text-xs font-semibold text-[var(--text-secondary)]">Your decision:</p>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => { onVerifyClaim('CLM-PAT-DIABETES-DENIAL', 'reject'); setShowWhyDrawer(false); }}
                      className="py-2.5 rounded-lg text-xs font-bold bg-[var(--bg-surface-elevated)] hover:bg-red-950/30 text-[var(--text-primary)] border border-[var(--border-medium)] hover:border-red-500/40 transition-clinical"
                    >
                      Reject patient claim
                    </button>
                    <button
                      onClick={() => { onVerifyClaim('CLM-PAT-DIABETES-DENIAL', 'accept'); setShowWhyDrawer(false); }}
                      className="py-2.5 rounded-lg text-xs font-bold bg-emerald-950/30 hover:bg-emerald-950/50 text-emerald-400 border border-emerald-800/50 transition-clinical"
                    >
                      Accept patient claim
                    </button>
                    <button
                      onClick={() => { onVerifyClaim('CLM-PAT-DIABETES-DENIAL', 'keep_both'); setShowWhyDrawer(false); }}
                      className="py-2.5 rounded-lg text-xs font-bold bg-[var(--bg-surface-elevated)] hover:bg-amber-950/20 text-[var(--text-secondary)] hover:text-amber-400 border border-[var(--border-medium)] hover:border-amber-800/40 transition-clinical"
                    >
                      Keep both
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
