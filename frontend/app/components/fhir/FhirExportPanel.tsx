'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface FhirExportPanelProps {
  fhirError: string;
  fhirBundle: any;
  onExportFhir: () => void;
  exportBlocked: boolean;
  unresolvedCount: number;
}

export default function FhirExportPanel({
  fhirError,
  fhirBundle,
  onExportFhir,
  exportBlocked,
  unresolvedCount,
}: FhirExportPanelProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  return (
    <Card className="p-5 space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-[var(--text-primary)]">Clinical Record Export</h3>
          <p className="text-xs text-[var(--text-secondary)] mt-0.5">
            Structured health record for interoperability
          </p>
        </div>
        <Button
          variant={exportBlocked ? 'amber' : 'primary'}
          size="md"
          onClick={onExportFhir}
          aria-label={exportBlocked ? 'FHIR export is blocked' : 'Export FHIR clinical record'}
        >
          {exportBlocked ? '🔒 Export blocked' : '↑ Export record'}
        </Button>
      </div>

      {/* Status area */}
      {exportBlocked ? (
        <div className="p-4 rounded-xl bg-amber-950/20 border border-amber-800/40 space-y-2">
          <div className="flex items-start space-x-3">
            <span className="text-amber-400 text-base shrink-0 mt-0.5">🔒</span>
            <div className="space-y-1">
              <p className="text-sm font-bold text-[var(--text-primary)]">
                Export blocked — {unresolvedCount > 0 ? `${unresolvedCount} conflict${unresolvedCount !== 1 ? 's' : ''}` : 'verification'} required.
              </p>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                Resolve the conflict in the Clinical Truth Timeline above before exporting this record.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 space-y-2">
          <div className="flex items-start space-x-3">
            <span className="text-emerald-400 text-base shrink-0 mt-0.5">✓</span>
            <div>
              <p className="text-sm font-bold text-[var(--text-primary)]">Record ready for export.</p>
              <p className="text-xs text-[var(--text-secondary)]">
                All clinical claims have been verified. The structured record is ready.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error state */}
      {fhirError && (
        <div className="p-3 rounded-lg bg-red-950/30 border border-red-800/50 space-y-1">
          <p className="text-xs font-bold text-red-400">Something went wrong</p>
          <p className="text-xs text-[var(--text-secondary)]">
            The export could not be completed. Your information has not been lost.
          </p>
          <button
            type="button"
            onClick={onExportFhir}
            className="text-xs text-red-400 hover:text-red-300 underline underline-offset-2 transition-clinical"
          >
            Try again
          </button>
          {/* Raw error behind toggle */}
          <details className="mt-1">
            <summary className="text-[11px] text-[var(--text-tertiary)] cursor-pointer font-mono-code">
              Technical details
            </summary>
            <p className="mt-1 text-[11px] text-[var(--text-tertiary)] font-mono-code break-all">{fhirError}</p>
          </details>
        </div>
      )}

      {/* Exported bundle */}
      {fhirBundle && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setShowTechnical(!showTechnical)}
            className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] underline underline-offset-2 font-mono-code transition-clinical"
          >
            {showTechnical ? 'Hide FHIR R4 bundle' : 'View technical details (FHIR R4 bundle)'}
          </button>
          {showTechnical && (
            <div className="animate-fadeIn">
              <div className="flex items-center justify-between bg-[var(--bg-app)] px-3 py-2 rounded-t-lg border-x border-t border-[var(--border-subtle)] text-xs text-[var(--text-tertiary)] font-mono-code">
                <span>FHIR R4 Bundle</span>
                <span>Entries: {fhirBundle.entry?.length || 0}</span>
              </div>
              <pre className="bg-[var(--bg-app)] border border-[var(--border-subtle)] rounded-b-xl p-4 max-h-72 overflow-y-auto text-xs font-mono-code text-emerald-400 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(fhirBundle, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
