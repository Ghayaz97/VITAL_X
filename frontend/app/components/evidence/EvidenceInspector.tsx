'use client';

import React from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';

interface EvidenceInspectorProps {
  truthState: any;
  claims: any[];
}

export default function EvidenceInspector({ truthState, claims }: EvidenceInspectorProps) {
  if (!truthState) return null;

  const conflicts = truthState.conflicts || [];
  const relationships = truthState.relationships || [];

  return (
    <Card
      title={
        <div className="flex items-center space-x-2">
          <span>Clinical Truth Timeline & Provenance Inspector</span>
          <Badge variant="neutral">{claims.length} Claims</Badge>
          <Badge variant="neutral">{relationships.length} Relationships</Badge>
        </div>
      }
      subtitle="Signature VITAL-X clinical provenance matrix and contradiction detector"
    >
      {/* Contradiction Inspector */}
      {conflicts.length > 0 ? (
        <div className="space-y-4 mb-6">
          <div className="text-xs font-semibold text-red-500 uppercase tracking-wider flex items-center justify-between">
            <span>Detected Clinical Contradictions ({conflicts.length})</span>
            <span className="text-[11px] text-[var(--text-tertiary)] font-mono-code">TruthEngine::ContradictionGraph</span>
          </div>

          {conflicts.map((conf: any, idx: number) => (
            <div key={idx} className="bg-[var(--bg-surface-elevated)] border border-red-500/30 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-red-500/20">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-red-500 font-mono-code">{conf.conflict_id}</span>
                  <span className="text-xs text-[var(--text-secondary)] font-medium font-mono-code">
                    Concept: {conf.concept_code}
                  </span>
                </div>
                <Badge variant={conf.resolution_status === 'RESOLVED' ? 'verified' : 'conflict'}>
                  {conf.resolution_status}
                </Badge>
              </div>

              {/* Contradiction Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                <div className="hidden md:flex absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                  <span className="px-2.5 py-1 rounded bg-red-600 text-white font-mono-code text-[10px] font-bold shadow-lg border border-red-400 uppercase tracking-wider">
                    ↔ CONTRADICTS ↔
                  </span>
                </div>

                {conf.evidence?.map((ev: any, evIdx: number) => (
                  <div
                    key={evIdx}
                    className={`bg-[var(--bg-surface)] border rounded-xl p-4 space-y-2.5 text-xs transition-clinical ${
                      evIdx === 0 ? 'border-amber-500/40' : 'border-blue-500/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-bold text-[var(--text-primary)] uppercase font-mono-code">
                          {ev.source_type === 'patient_voice' ? '🗣️ PATIENT VOICE' : '📄 PREVIOUS DOCUMENT'}
                        </span>
                        <Badge variant="neutral">{ev.source_type}</Badge>
                      </div>
                      <span className="text-[10px] text-[var(--text-tertiary)] font-mono-code">{ev.claim_id}</span>
                    </div>

                    <div className="bg-[var(--bg-app)] p-3 rounded-lg border border-[var(--border-subtle)] space-y-1">
                      <div className="text-[var(--text-tertiary)] text-[11px] font-medium">Extracted Claim Value:</div>
                      <div className="text-emerald-500 font-bold text-sm">{ev.value}</div>
                    </div>

                    <div className="space-y-1">
                      <div className="text-[11px] text-[var(--text-tertiary)]">Raw Verbatim Evidence:</div>
                      <div className="text-[var(--text-secondary)] italic text-[11px] bg-[var(--bg-app)]/80 p-2.5 rounded-lg border border-[var(--border-subtle)]">
                        &quot;{ev.evidence_text}&quot;
                      </div>
                    </div>

                    <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[10px] text-[var(--text-tertiary)] font-mono-code">
                      <span>Status: <strong className="text-[var(--text-primary)]">{ev.status}</strong></span>
                      <span>Verified: <strong>NO</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 mb-6 flex items-center space-x-2">
          <span>✓</span>
          <span>No unresolved evidence contradictions. All clinical claims aligned.</span>
        </div>
      )}

      {/* Persisted Claims Graph Matrix */}
      <div>
        <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wider">
          Persisted Clinical Claims Matrix ({claims.length})
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {claims.map((c: any) => (
            <div key={c.claim_id} className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono-code text-[var(--text-secondary)] font-semibold text-xs">{c.concept_code}</span>
                <Badge
                  variant={
                    c.claim_state === 'VERIFIED'
                      ? 'verified'
                      : c.claim_state === 'REJECTED'
                      ? 'conflict'
                      : 'review'
                  }
                >
                  {c.claim_state}
                </Badge>
              </div>

              <div className="text-[var(--text-primary)] font-semibold text-sm">{c.value}</div>

              <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--text-tertiary)] bg-[var(--bg-surface)] p-2.5 rounded-lg border border-[var(--border-subtle)]">
                <div>Source: <strong className="text-[var(--text-secondary)]">{c.source_type}</strong></div>
                <div>Modality: <strong className="text-[var(--text-secondary)]">{c.input_mode}</strong></div>
                <div>Confidence: <strong className="text-[var(--text-secondary)]">{c.confidence}</strong></div>
                <div>Captured: <strong className="text-[var(--text-secondary)]">{c.captured_at?.slice(11, 19)}</strong></div>
              </div>

              {c.evidence_text && (
                <div className="text-[11px] text-[var(--text-secondary)] italic bg-[var(--bg-surface)]/60 p-2 rounded border border-[var(--border-subtle)]">
                  Raw Evidence: &quot;{c.evidence_text}&quot;
                </div>
              )}

              {c.namaste_term && (
                <div className="text-[11px] text-indigo-400 font-mono-code bg-indigo-950/40 p-2 rounded border border-indigo-800/40">
                  NAMASTE Candidate: {c.namaste_term} ({c.namaste_code})
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
