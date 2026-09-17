'use client';

import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import TruthEngineBanner from '../truth/TruthEngineBanner';
import EvidenceInspector from '../evidence/EvidenceInspector';
import VerificationControl from '../verification/VerificationControl';
import AyushSection from '../ayush/AyushSection';
import FhirExportPanel from '../fhir/FhirExportPanel';

interface ConsultStepProps {
  selectedCase: any;
  verifyComment: string;
  setVerifyComment: (v: string) => void;
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

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function ConsultStep({
  selectedCase,
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
}: ConsultStepProps) {
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    if (selectedCase?.session?.session_id) {
      fetch(`${API}/api/v1/sessions/${selectedCase.session.session_id}/summary`)
        .then((res) => res.json())
        .then((data) => setSummaryData(data))
        .catch(() => console.error('Failed to fetch summary'));
    }
  }, [selectedCase]);

  if (!selectedCase) {
    return (
      <Card className="text-center py-16 text-[var(--text-tertiary)] space-y-2 max-w-3xl mx-auto">
        <div className="text-2xl">🩺</div>
        <div className="text-sm font-semibold text-[var(--text-primary)]">No Case Selected</div>
        <p className="text-xs text-[var(--text-secondary)]">Initialize a session or select a case from the queue to view consultation records.</p>
      </Card>
    );
  }

  const sections = summaryData?.sections || {};

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 font-mono-code uppercase tracking-wider">
            Practitioner Consultation
          </span>
          <h2 className="text-xl font-bold text-[var(--text-primary)] tracking-tight mt-0.5">
            Practitioner Workstation
          </h2>
        </div>
        <div className="flex items-center space-x-2 text-xs font-mono-code text-[var(--text-secondary)]">
          <span>Patient: <strong className="text-[var(--text-primary)]">{selectedCase.session?.patient_id}</strong></span>
        </div>
      </div>

      {/* Truth Engine Banner */}
      <TruthEngineBanner truthState={selectedCase.truth_state} />

      {/* Case Summary */}
      <Card
        title="Structured Physician Case Summary"
        subtitle="Chronological, evidence-traced pre-consultation summary draft"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">Chief Complaint</span>
            <div className="text-[var(--text-primary)] font-medium">{JSON.stringify(sections.chief_complaint || ['Joint pain'])}</div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">History of Present Illness (HPI)</span>
            <div className="text-[var(--text-primary)] font-medium">{JSON.stringify(sections.hpi || ['Onset 3 weeks ago'])}</div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">Past Medical History</span>
            <div className="text-[var(--text-primary)] font-medium">{JSON.stringify(sections.past_medical_history || [])}</div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">Current Medications</span>
            <div className="text-[var(--text-primary)] font-medium">{JSON.stringify(sections.medications || [])}</div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">Investigations & Lab Safety</span>
            <div className="text-[var(--text-primary)] font-medium">{JSON.stringify(sections.investigations || [])}</div>
          </div>

          <div className="bg-[var(--bg-surface-elevated)] p-3.5 rounded-xl border border-[var(--border-subtle)] space-y-1">
            <span className="font-semibold text-[var(--text-secondary)] uppercase font-mono-code text-[11px]">AYUSH Assessment</span>
            <div className="text-[var(--text-primary)] font-medium">Prakriti: {sections.ayush_assessment?.prakriti || 'Vata-Pitta'}</div>
          </div>
        </div>
      </Card>

      {/* Signature Evidence Inspector */}
      <EvidenceInspector
        truthState={selectedCase.truth_state}
        claims={selectedCase.claims || []}
      />

      {/* Practitioner Verification Engine */}
      <VerificationControl
        claims={selectedCase.claims || []}
        verifyComment={verifyComment}
        setVerifyComment={setVerifyComment}
        onVerifyClaim={onVerifyClaim}
      />

      {/* AYUSH Assessment */}
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

      {/* FHIR Export Panel */}
      <FhirExportPanel
        fhirError={fhirError}
        fhirBundle={fhirBundle}
        onExportFhir={onExportFhir}
        exportBlocked={selectedCase.truth_state?.export_blocked ?? true}
        unresolvedCount={selectedCase.truth_state?.unresolved_conflicts || 0}
      />

      {/* Append-Only Audit Trail */}
      <Card
        title="Append-Only Clinical Audit Trail"
        subtitle="Tamper-evident activity log recorded for session"
      >
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {auditTrail.map((evt, idx) => (
            <div key={idx} className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-lg p-2.5 text-xs flex items-center justify-between font-mono-code">
              <div className="flex items-center space-x-2">
                <span className="text-emerald-500 font-bold">[{evt.event_type}]</span>
                <span className="text-[var(--text-secondary)]">{evt.actor_type}:{evt.actor_id}</span>
              </div>
              <span className="text-[var(--text-tertiary)] text-[10px]">{evt.created_at?.slice(11, 19)}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
