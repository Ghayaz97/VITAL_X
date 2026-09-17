'use client';

import React from 'react';
import Button from '../ui/Button';

interface OpdCaseSheetProps {
  selectedCase: any;
  claims: any[];
  auditTrail: any[];
  onClose: () => void;
}

export default function OpdCaseSheet({ selectedCase, claims, auditTrail, onClose }: OpdCaseSheetProps) {
  if (!selectedCase) return null;

  const session = selectedCase.session || {};
  const verifiedClaims = claims.filter((c) => c.claim_state === 'VERIFIED');
  const unresolvedClaims = claims.filter((c) => c.claim_state !== 'VERIFIED');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadFile = () => {
    const docTitle = `OPD-Case-Sheet-${session.patient_id || 'PT-SIH-042'}.html`;
    const docContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${docTitle}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 13px; line-height: 1.6; color: #0f172a; padding: 40px; max-w: 800px; margin: 0 auto; }
    h1 { font-size: 18px; text-transform: uppercase; margin: 4px 0; font-weight: 800; }
    h2 { font-size: 12px; text-transform: uppercase; border-bottom: 2px solid #0f172a; padding-bottom: 4px; margin-top: 24px; }
    .header { border-bottom: 3px solid #0f172a; padding-bottom: 12px; display: flex; justify-content: space-between; }
    .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; background: #f8fafc; padding: 12px; border: 1px solid #cbd5e1; border-radius: 6px; margin: 16px 0; }
    .card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 12px; border-radius: 6px; margin-bottom: 12px; }
    .verified { background: #f0fdf4; border: 1px solid #bbf7d0; color: #166534; padding: 12px; border-radius: 6px; }
    .conflict { background: #fffbeb; border: 1px solid #fde68a; color: #92400e; padding: 12px; border-radius: 6px; }
    .footer { margin-top: 40px; border-top: 2px solid #0f172a; pt: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div style="font-size: 20px; font-weight: 900; color: #047857;">VITAL-X | SIH26047</div>
      <h1>Outpatient Department (OPD) Case Summary</h1>
      <div style="font-size: 11px; color: #64748b;">Evidence-First Multilingual Intake & Practitioner Verified Record</div>
    </div>
    <div style="text-align: right; font-family: monospace; font-size: 11px;">
      <div>Date: ${new Date().toLocaleDateString()}</div>
      <div>Time: ${new Date().toLocaleTimeString()}</div>
      <div>Doc ID: OPD-${session.session_id?.slice(0, 8)}</div>
    </div>
  </div>

  <div class="grid">
    <div><small style="color: #64748b;">PATIENT ID</small><br><strong>${session.patient_id || 'PT-SIH-042'}</strong></div>
    <div><small style="color: #64748b;">ABHA ID</small><br><strong>${session.abha_id || '91-042-4242-88'}</strong></div>
    <div><small style="color: #64748b;">LANGUAGE</small><br><strong>${session.language || 'kn-IN'}</strong></div>
    <div><small style="color: #64748b;">CONSENT</small><br><strong style="color: #047857;">${session.consent_given ? 'GRANTED' : 'NO'}</strong></div>
  </div>

  <h2>1. Chief Complaint & History</h2>
  <div class="card">
    <p><strong>Patient reported:</strong> "I have joint pain and no history of diabetes."</p>
    <small style="color: #64748b;">Input Mode: Voice Intake | Language Code: ${session.language || 'kn-IN'}</small>
  </div>

  <h2>2. Digitized Records & Diagnostics</h2>
  <div class="card">
    <p><strong>Prescription (2025):</strong> Metformin 500mg BD Oral (Type 2 Diabetes Mellitus active record)</p>
    <p><strong>Lab Report (2025):</strong> HbA1c: <strong>8.2 %</strong> (Reference Range: 4.0 - 5.6 %)</p>
  </div>

  <h2>3. Practitioner Verified Facts</h2>
  <div class="verified">
    ${verifiedClaims.length > 0 
      ? verifiedClaims.map(c => `<div>✓ <strong>${c.concept_code}:</strong> ${c.value} (${c.source_type})</div>`).join('') 
      : '<div>✓ Active Type 2 Diabetes Mellitus (Metformin 500mg BD Oral) verified by attending practitioner.</div>'}
  </div>

  <h2>4. AYUSH Assessment Summary</h2>
  <div class="card">
    Prakriti: Vata-Pitta | Vikriti: Vata Kopa | Sara: Madhyama | Samhanana: Madhyama | Vaya: 35 yrs
  </div>

  <div class="footer">
    <div style="font-size: 10px; color: #64748b; max-width: 400px;">
      <strong>VITAL-X Clinical Notice:</strong> Verified clinical record established by attending practitioner.
    </div>
    <div style="text-align: center;">
      <div style="font-weight: bold; margin-bottom: 24px;">Dr. Demo Practitioner</div>
      <div style="border-top: 1px solid #94a3b8; font-size: 10px; color: #64748b; padding-top: 4px;">Attending Physician Signature & Seal</div>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([docContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = docTitle;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto print:static print:block print:p-0 print:bg-white print:overflow-visible">
      <div className="relative w-full max-w-4xl bg-white text-slate-900 rounded-2xl p-8 shadow-2xl space-y-6 my-8 border border-slate-200 print:shadow-none print:border-none print:m-0 print:p-0 print:max-w-none print:w-full">
        {/* Action Controls (Hidden on Print) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 print:hidden">
          <div className="flex items-center space-x-2">
            <span className="text-xl">📄</span>
            <div>
              <h3 className="text-lg font-bold text-slate-900">OPD Clinical Case Sheet</h3>
              <p className="text-xs text-slate-500">Official printable summary document</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="primary" size="sm" onClick={handlePrint} className="shadow-sm">
              🖨️ Print / Save PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={handleDownloadFile} className="bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300">
              📥 Download File
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-500 hover:text-slate-900">
              ✕ Close
            </Button>
          </div>
        </div>

        {/* Printable A4 Document Layout */}
        <div className="space-y-6 font-sans text-xs leading-relaxed text-slate-900">
          {/* Document Header */}
          <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-emerald-700 font-extrabold text-xl tracking-tight">VITAL-X</span>
                <span className="text-slate-400">|</span>
                <span className="text-slate-600 font-semibold text-xs">SIH26047 CLINICAL CASE-TAKING SYSTEM</span>
              </div>
              <h1 className="text-base font-extrabold uppercase text-slate-900 tracking-wider mt-1">
                Outpatient Department (OPD) Clinical Case Summary
              </h1>
              <p className="text-[11px] text-slate-500">
                Evidence-First Multilingual Intake &amp; Practitioner Verified Record
              </p>
            </div>
            <div className="text-right text-[11px] font-mono">
              <div>Date: <strong>{new Date().toLocaleDateString()}</strong></div>
              <div>Time: <strong>{new Date().toLocaleTimeString()}</strong></div>
              <div>Doc ID: <strong>OPD-{session.session_id?.slice(0, 8)}</strong></div>
            </div>
          </div>

          {/* Patient Demographics Banner */}
          <div className="bg-slate-100 p-4 rounded-lg border border-slate-300 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Patient ID</span>
              <strong className="font-mono text-slate-900">{session.patient_id || 'PT-SIH-042'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">ABHA Health ID</span>
              <strong className="font-mono text-slate-900">{session.abha_id || '91-042-4242-88'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Intake Language</span>
              <strong className="text-slate-900">{session.language === 'kn-IN' ? 'Kannada (ಕನ್ನಡ)' : session.language === 'hi-IN' ? 'Hindi (हिंदी)' : 'English'}</strong>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Consent Status</span>
              <strong className="text-emerald-700 font-bold">{session.consent_given ? 'EXPLICIT CONSENT GRANTED' : 'NO'}</strong>
            </div>
          </div>

          {/* Section 1: Chief Complaint & History */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              1. Chief Complaint &amp; History of Present Illness
            </h2>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <p className="font-medium text-slate-800">
                Patient reported chief complaint: <em>&quot;I have joint pain and no history of diabetes.&quot;</em>
              </p>
              <div className="text-[11px] text-slate-500 mt-1 font-mono">
                Input Mode: Voice Intake · Language Code: {session.language || 'kn-IN'} · Safety Routing: Normal OPD Triage
              </div>
            </div>
          </div>

          {/* Section 2: Previous Medical Records & Investigations */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              2. Digitized Records &amp; Diagnostic Ingestion
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Prescription Ingestion (Rx 2025)</span>
                <p className="text-slate-700">Metformin 500mg BD Oral (Type 2 Diabetes Mellitus active record)</p>
                <span className="text-[10px] text-slate-500 font-mono">Document Record: 2025 Prescription</span>
              </div>
              <div className="p-3 bg-slate-50 rounded border border-slate-200 space-y-1">
                <span className="font-bold text-slate-800">Diagnostic Laboratory Report (2025)</span>
                <p className="text-slate-700">HbA1c: <strong>8.2 %</strong> (Out of reference range: 4.0 - 5.6 %)</p>
                <span className="text-[10px] text-slate-500 font-mono">Method: HPLC · Status: Flagged Out-of-Range</span>
              </div>
            </div>
          </div>

          {/* Section 3: Verified Clinical Facts vs Unresolved Follow-Up */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 border-b border-emerald-300 pb-1">
                3. Practitioner Verified Facts (Clinical Truth)
              </h2>
              <div className="p-3 bg-emerald-50 rounded border border-emerald-200 space-y-2">
                {verifiedClaims.length > 0 ? (
                  verifiedClaims.map((c, i) => (
                    <div key={i} className="text-xs space-y-0.5">
                      <div className="font-bold text-emerald-900">✓ {c.concept_code}: {c.value}</div>
                      <div className="text-[11px] text-emerald-700">Source: {c.source_type}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-700 italic">
                    ✓ Active Type 2 Diabetes Mellitus (Metformin 500mg BD Oral) verified by attending practitioner.
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-amber-800 border-b border-amber-300 pb-1">
                4. Information Requiring Follow-Up / Rejection
              </h2>
              <div className="p-3 bg-amber-50 rounded border border-amber-200 space-y-2">
                {unresolvedClaims.map((c, i) => (
                  <div key={i} className="text-xs space-y-0.5">
                    <div className="font-bold text-amber-900">⚠ {c.concept_code}: {c.value} ({c.claim_state})</div>
                    <div className="text-[11px] text-amber-800">Rationale: Overridden by historical prescription record</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 4: AYUSH Assessment */}
          <div className="space-y-2">
            <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-300 pb-1">
              5. AYUSH Dashavidha Pariksha Summary
            </h2>
            <div className="p-3 bg-slate-50 rounded border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
              <div>Prakriti: <strong>Vata-Pitta</strong></div>
              <div>Vikriti: <strong>Vata Kopa</strong></div>
              <div>Sara: <strong>Madhyama</strong></div>
              <div>Samhanana: <strong>Madhyama</strong></div>
              <div>Pramana: <strong>Pramana Sama</strong></div>
              <div>Satmya: <strong>Satmya Sarva</strong></div>
              <div>Sattva: <strong>Pravara</strong></div>
              <div>Vaya: <strong>Madhyama (35 yrs)</strong></div>
            </div>
          </div>

          {/* Practitioner Signature Footer */}
          <div className="pt-8 border-t-2 border-slate-900 flex items-end justify-between">
            <div className="text-[10px] text-slate-500 max-w-md">
              <strong>VITAL-X Clinical Notice:</strong> AI extracted claims are immutable prior to verification. Verified clinical state established by attending practitioner.
            </div>
            <div className="text-center space-y-8">
              <div className="font-mono text-xs font-bold text-slate-800">Dr. Demo Practitioner</div>
              <div className="border-t border-slate-400 pt-1 text-[10px] text-slate-500">
                Attending Physician Signature &amp; Seal
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
