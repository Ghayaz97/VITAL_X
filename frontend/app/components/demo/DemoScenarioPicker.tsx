'use client';

import React from 'react';
import Badge from '../ui/Badge';

interface DemoScenarioPickerProps {
  onSelectScenario: (scenario: string) => void;
  loading: boolean;
}

export default function DemoScenarioPicker({ onSelectScenario, loading }: DemoScenarioPickerProps) {
  const scenarios = [
    { id: 'A', title: 'Case 1', label: 'Clean Visit (No Conflict)' },
    { id: 'B', title: 'Case 2', label: 'Golden Path (Diabetes Conflict)' },
    { id: 'C', title: 'Case 3', label: 'Multiple Conflicts' },
    { id: 'D', title: 'Case 4', label: 'Unknown History' },
    { id: 'E', title: 'Case 5', label: 'Agreeing Sources' },
  ];

  return (
    <div className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 mb-6 transition-clinical">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center space-x-2">
          <Badge variant="synthetic">DEMO DATA</Badge>
          <span className="text-xs text-[var(--text-secondary)] font-medium">Load pre-configured test scenarios</span>
        </div>
        <span className="text-[11px] text-[var(--text-tertiary)] font-mono">SIH 2026 Evaluation</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            disabled={loading}
            onClick={() => onSelectScenario(s.id)}
            className="flex flex-col items-start p-3 rounded-lg bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-subtle)] border border-[var(--border-medium)] hover:border-emerald-500/50 transition-clinical text-left group"
          >
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500">
              {s.title}
            </span>
            <span className="text-[11px] text-[var(--text-secondary)] line-clamp-1 mt-0.5">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
