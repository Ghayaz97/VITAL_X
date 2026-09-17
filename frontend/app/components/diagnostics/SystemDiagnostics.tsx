'use client';

import React from 'react';
import Card from '../ui/Card';

export default function SystemDiagnostics() {
  const adapters = [
    { name: 'ASR Engine', type: 'Prototype ASR Adapter', detail: 'Browser SpeechRecognition + Local Fallback' },
    { name: 'OCR Ingestion Engine', type: 'Prototype OCR Adapter', detail: 'Prescription & Record Pattern Extractor' },
    { name: 'Clinical Extraction', type: 'Prototype Extraction Adapter', detail: 'Structured Claim & Concept Categorizer' },
    { name: 'AYUSH Terminology', type: 'NAMASTE + ICD-11 Reference', detail: 'Official Code Reference Dictionary' },
    { name: 'Interoperability Boundary', type: 'FHIR R4 Adapter', detail: 'ABDM StructureDefinition Bundle' },
  ];

  return (
    <Card
      title="System Architecture & Diagnostics"
      subtitle="Technical implementation transparency layer — Adapter architecture"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 text-xs">
        {adapters.map((a, idx) => (
          <div key={idx} className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 space-y-1.5">
            <div className="text-[var(--text-secondary)] font-medium text-[11px]">{a.name}</div>
            <div className="font-mono text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{a.type}</div>
            <div className="text-[var(--text-tertiary)] text-[10px] leading-relaxed">{a.detail}</div>
          </div>
        ))}
      </div>
    </Card>
  );
}
