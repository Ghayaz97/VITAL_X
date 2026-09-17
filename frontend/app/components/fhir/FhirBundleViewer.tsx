'use client';

import React from 'react';

interface FhirBundleViewerProps {
  fhirError: string;
  fhirBundle: any;
  onExportFhir: () => void;
  exportBlocked: boolean;
}

export default function FhirBundleViewer({
  fhirError,
  fhirBundle,
  onExportFhir,
  exportBlocked,
}: FhirBundleViewerProps) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100 flex items-center space-x-2">
            <span>FHIR R4 Interoperability Export</span>
            <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
              ABDM / AYUSH Grid Compatible
            </span>
          </h3>
          <p className="text-xs text-slate-400">Export Gated by Truth Engine Conflict Engine</p>
        </div>

        <button
          onClick={onExportFhir}
          className={`font-medium py-2 px-4 rounded-lg text-xs transition shadow-lg ${
            exportBlocked
              ? 'bg-amber-600/30 text-amber-300 border border-amber-500/40 cursor-not-allowed'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/20'
          }`}
        >
          {exportBlocked ? '🔒 Export Blocked (Unresolved Contradictions)' : '⚡ Generate FHIR Bundle'}
        </button>
      </div>

      {fhirError && (
        <div className="bg-red-950/60 border border-red-800/80 rounded-lg p-4 mb-4 text-xs text-red-200 font-mono">
          <div className="font-bold text-red-400 mb-1 flex items-center space-x-1">
            <span>🛑</span>
            <span>HTTP 409 EXPORT_BLOCKED</span>
          </div>
          <div>{fhirError}</div>
        </div>
      )}

      {fhirBundle && (
        <div className="space-y-3">
          <div className="flex items-center justify-between bg-slate-950 p-2.5 rounded border border-slate-800 text-xs text-slate-400 font-mono">
            <span>ResourceType: Bundle (ClinicalArtifactBundle)</span>
            <span>Entries: {fhirBundle.entry?.length || 0}</span>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-lg p-4 max-h-80 overflow-y-auto text-xs font-mono text-emerald-400/90 whitespace-pre-wrap">
            {JSON.stringify(fhirBundle, null, 2)}
          </div>
        </div>
      )}
    </div>
  );
}
