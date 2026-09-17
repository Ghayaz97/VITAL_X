'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import ClinicalTruthTimeline from '../truth/ClinicalTruthTimeline';
import TruthEngineBanner from '../truth/TruthEngineBanner';
import EvidenceInspector from '../evidence/EvidenceInspector';
import VerificationControl from '../verification/VerificationControl';
import AyushSection from '../ayush/AyushSection';
import FhirExportPanel from '../fhir/FhirExportPanel';
import OpdCaseSheet from './OpdCaseSheet';

interface PractitionerWorkspaceProps {
  queue: any[];
  selectedCase: any;
  onSelectCase: (sessionId: string) => void;
  onRefreshQueue: () => void;
  verifyComment: string;
  setVerifyComment: (val: string) => void;
  onVerifyClaim: (claimId: string, action: string) => void;
  ayushPrakriti: string;
  setAyushPrakriti: (v: string) => void;
  ayushVikriti: string;
  setAyushVikriti: (v: string) => void;
  ayushSara: string;
  setAyushSara: (v: string) => void;
  ayushSamhanana: string;
  setAyushSamhanana: (v: string) => void;
  ayushPramana: string;
  setAyushPramana: (v: string) => void;
  ayushSatmya: string;
  setAyushSatmya: (v: string) => void;
  ayushSattva: string;
  setAyushSattva: (v: string) => void;
  ayushAhara: string;
  setAyushAhara: (v: string) => void;
  ayushVyayama: string;
  setAyushVyayama: (v: string) => void;
  ayushVaya: string;
  setAyushVaya: (v: string) => void;
  onSaveAyush: () => void;
  fhirError: string;
  fhirBundle: any;
  onExportFhir: () => void;
  auditTrail: any[];
}

// Human-readable case status label
function caseStatusLabel(item: any): { label: string; variant: 'conflict' | 'review' | 'verified' | 'neutral' } {
  if (item.export_blocked || item.unresolved_conflicts > 0) {
    return { label: 'Conflict', variant: 'conflict' };
  }
  if (item.truth_status === 'REVIEW_REQUIRED') {
    return { label: 'Needs Review', variant: 'review' };
  }
  if (item.unresolved_conflicts === 0 && !item.export_blocked) {
    return { label: 'Verified', variant: 'verified' };
  }
  return { label: 'Reviewing', variant: 'neutral' };
}

export default function PractitionerWorkspace({
  queue,
  selectedCase,
  onSelectCase,
  onRefreshQueue,
  verifyComment,
  setVerifyComment,
  onVerifyClaim,
  ayushPrakriti,
  setAyushPrakriti,
  ayushVikriti,
  setAyushVikriti,
  ayushSara,
  setAyushSara,
  ayushSamhanana,
  setAyushSamhanana,
  ayushPramana,
  setAyushPramana,
  ayushSatmya,
  setAyushSatmya,
  ayushSattva,
  setAyushSattva,
  ayushAhara,
  setAyushAhara,
  ayushVyayama,
  setAyushVyayama,
  ayushVaya,
  setAyushVaya,
  onSaveAyush,
  fhirError,
  fhirBundle,
  onExportFhir,
  auditTrail,
}: PractitionerWorkspaceProps) {
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'conflict' | 'verified'>('all');
  const [showAyush, setShowAyush] = useState(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false);
  const [showOpdModal, setShowOpdModal] = useState(false);

  const filteredQueue = queue.filter((item) => {
    if (sidebarFilter === 'conflict') return item.export_blocked || item.unresolved_conflicts > 0;
    if (sidebarFilter === 'verified') return !item.export_blocked && item.unresolved_conflicts === 0;
    return true;
  });

  const conflictCount = queue.filter(i => i.export_blocked || i.unresolved_conflicts > 0).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Case Queue Sidebar */}
      <div className="lg:col-span-4 space-y-4">
        <Card
          title={
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-[var(--text-primary)]">Case Queue</span>
              {conflictCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">
                  {conflictCount}
                </span>
              )}
            </div>
          }
          subtitle="Patient intake files awaiting review"
          headerRight={
            <Button variant="ghost" size="sm" onClick={onRefreshQueue} aria-label="Refresh queue">
              ↻ Refresh
            </Button>
          }
        >
          {/* Filter tabs — simplified to 3 */}
          <div className="flex items-center gap-1 p-1 bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg mb-4 text-[11px] font-medium">
            {([
              { key: 'all', label: `All (${queue.length})` },
              { key: 'conflict', label: 'Conflicts' },
              { key: 'verified', label: 'Verified' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setSidebarFilter(key)}
                className={`flex-1 py-1.5 rounded transition-clinical text-center ${
                  sidebarFilter === key
                    ? key === 'conflict'
                      ? 'bg-red-900/40 text-red-200 font-semibold'
                      : key === 'verified'
                      ? 'bg-emerald-900/30 text-emerald-300 font-semibold'
                      : 'bg-[var(--bg-surface-elevated)] text-[var(--text-primary)] font-semibold'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Queue list */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filteredQueue.length === 0 && (
              <div className="text-center py-8 space-y-2">
                <p className="text-sm font-semibold text-[var(--text-primary)]">No cases in this group</p>
                <p className="text-xs text-[var(--text-secondary)]">Switch filter or refresh the queue.</p>
              </div>
            )}
            {filteredQueue.map((item) => {
              const isSelected = selectedCase?.session?.session_id === item.session_id;
              const status = caseStatusLabel(item);
              // Derive a readable chief concern from item if available
              const chiefConcern = item.chief_complaint || item.answer_text || null;
              const borderAccent =
                status.variant === 'conflict'
                  ? 'border-l-4 border-l-red-500'
                  : status.variant === 'verified'
                  ? 'border-l-4 border-l-emerald-500'
                  : 'border-l-4 border-l-amber-500';
              return (
                <button
                  key={item.session_id}
                  onClick={() => onSelectCase(item.session_id)}
                  className={`w-full text-left rounded-xl border cursor-pointer transition-clinical overflow-hidden ${borderAccent} ${
                    isSelected
                      ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-md'
                      : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)] hover:border-emerald-500/30'
                  }`}
                  aria-label={`Select case for patient ${item.patient_id}`}
                >
                  <div className="p-3 space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-[var(--text-primary)] truncate">{item.patient_id}</p>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </div>

                    {chiefConcern && (
                      <p className="text-[11px] text-[var(--text-secondary)] leading-snug line-clamp-2 italic">
                        "{chiefConcern}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)]">
                      {item.unresolved_conflicts > 0 && (
                        <span className="text-red-400 font-semibold">
                          ⚠ {item.unresolved_conflicts} conflict{item.unresolved_conflicts !== 1 ? 's' : ''}
                        </span>
                      )}
                      {item.language && (
                        <span>
                          {item.language === 'kn-IN' ? '🇮🇳 Kannada' : item.language === 'hi-IN' ? '🇮🇳 Hindi' : '🌐 English'}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}

          </div>
        </Card>
      </div>

      {/* Main Workspace */}
      <div className="lg:col-span-8 space-y-6">
        {selectedCase ? (
          <>
            {/* Case header — clear hierarchy */}
            <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-5">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h2 className="text-xl font-extrabold tracking-tight text-[var(--text-primary)]">
                      {selectedCase.session?.patient_id}
                    </h2>
                    <span className="text-xs text-[var(--text-tertiary)]">
                      · {selectedCase.session?.language === 'kn-IN' ? 'Kannada' : selectedCase.session?.language === 'hi-IN' ? 'Hindi' : 'English'}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Chief concern: <span className="font-semibold text-[var(--text-primary)]">Joint pain, no diabetes history reported</span>
                  </p>
                  {/* AI principle line */}
                  <div className="flex items-center space-x-1.5 mt-1">
                    <span className="text-[11px] text-emerald-400 font-mono-code">AI-suggested</span>
                    <span className="text-[var(--border-medium)]">·</span>
                    <span className="text-[11px] text-[var(--text-tertiary)] font-mono-code">Practitioner verifies</span>
                  </div>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOpdModal(true)}
                  aria-label="Print OPD case sheet"
                >
                  📄 Print Case Sheet
                </Button>
              </div>
            </div>

            {/* Case status banner */}
            <TruthEngineBanner truthState={selectedCase.truth_state} />

            {/* CENTERPIECE: Clinical Truth Timeline */}
            <ClinicalTruthTimeline
              truthState={selectedCase.truth_state}
              claims={selectedCase.claims || []}
              onVerifyClaim={onVerifyClaim}
            />

            {/* Verification Controls */}
            <VerificationControl
              claims={selectedCase.claims || []}
              verifyComment={verifyComment}
              setVerifyComment={setVerifyComment}
              onVerifyClaim={onVerifyClaim}
            />

            {/* FHIR Export */}
            <FhirExportPanel
              fhirError={fhirError}
              fhirBundle={fhirBundle}
              onExportFhir={onExportFhir}
              exportBlocked={selectedCase.truth_state?.export_blocked ?? true}
              unresolvedCount={selectedCase.truth_state?.unresolved_conflicts || 0}
            />

            {/* Progressive: AYUSH */}
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <button
                type="button"
                onClick={() => setShowAyush(!showAyush)}
                className="w-full py-3 px-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] flex items-center justify-between transition-clinical"
              >
                <span>🌿 AYUSH Assessment (Dashavidha Pariksha)</span>
                <span className="text-xs text-[var(--text-tertiary)]">{showAyush ? '▲ Collapse' : '▼ Expand'}</span>
              </button>

              {showAyush && (
                <div className="mt-4 animate-fadeIn">
                  <AyushSection
                    ayushPrakriti={ayushPrakriti} setAyushPrakriti={setAyushPrakriti}
                    ayushVikriti={ayushVikriti} setAyushVikriti={setAyushVikriti}
                    ayushSara={ayushSara} setAyushSara={setAyushSara}
                    ayushSamhanana={ayushSamhanana} setAyushSamhanana={setAyushSamhanana}
                    ayushPramana={ayushPramana} setAyushPramana={setAyushPramana}
                    ayushSatmya={ayushSatmya} setAyushSatmya={setAyushSatmya}
                    ayushSattva={ayushSattva} setAyushSattva={setAyushSattva}
                    ayushAhara={ayushAhara} setAyushAhara={setAyushAhara}
                    ayushVyayama={ayushVyayama} setAyushVyayama={setAyushVyayama}
                    ayushVaya={ayushVaya} setAyushVaya={setAyushVaya}
                    onSaveAyush={onSaveAyush}
                    claims={selectedCase.claims || []}
                  />
                </div>
              )}
            </div>

            {/* Progressive: Technical / Audit */}
            <div className="border-t border-[var(--border-subtle)] pt-2">
              <button
                type="button"
                onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                className="w-full py-3 px-4 rounded-xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] text-sm font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] flex items-center justify-between transition-clinical"
              >
                <span>⚙ Technical Details (Evidence Matrix & Audit Trail)</span>
                <span className="text-xs">{showTechnicalDetails ? '▲ Collapse' : '▼ Expand'}</span>
              </button>

              {showTechnicalDetails && (
                <div className="mt-4 space-y-6 animate-fadeIn">
                  <EvidenceInspector
                    truthState={selectedCase.truth_state}
                    claims={selectedCase.claims || []}
                  />

                  <Card
                    title="Append-Only Audit Trail"
                    subtitle="Tamper-evident system activity log"
                  >
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {auditTrail.length === 0 && (
                        <p className="text-xs text-[var(--text-tertiary)] text-center py-4">No audit events yet for this session.</p>
                      )}
                      {auditTrail.map((evt, idx) => (
                        <div
                          key={idx}
                          className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg p-2.5 text-xs flex items-center justify-between font-mono-code"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-emerald-400 font-bold">[{evt.event_type}]</span>
                            <span className="text-[var(--text-secondary)]">{evt.actor_type}:{evt.actor_id}</span>
                          </div>
                          <span className="text-[var(--text-tertiary)] text-[10px]">{evt.created_at?.slice(11, 19)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>
              )}
            </div>

            {/* OPD Case Sheet Modal */}
            {showOpdModal && (
              <OpdCaseSheet
                selectedCase={selectedCase}
                claims={selectedCase.claims || []}
                auditTrail={auditTrail}
                onClose={() => setShowOpdModal(false)}
              />
            )}
          </>
        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] flex items-center justify-center text-2xl">
              🩺
            </div>
            <div className="space-y-1">
              <p className="text-base font-bold text-[var(--text-primary)]">No case selected</p>
              <p className="text-sm text-[var(--text-secondary)] max-w-xs">
                Select a patient from the case queue on the left to review their Clinical Truth Timeline.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
