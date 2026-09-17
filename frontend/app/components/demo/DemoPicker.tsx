'use client';

import React from 'react';

interface DemoPickerProps {
  onSelectScenario: (scenario: string) => void;
  loading: boolean;
}

export default function DemoPicker({ onSelectScenario, loading }: DemoPickerProps) {
  const scenarios = [
    { id: 'A', title: 'Scenario A', label: 'Clean Case (No Conflict)' },
    { id: 'B', title: 'Scenario B', label: 'Golden Path (Voice vs Prescription)' },
    { id: 'C', title: 'Scenario C', label: 'Multiple Contradictions' },
    { id: 'D', title: 'Scenario D', label: 'Unknown Surgical History' },
    { id: 'E', title: 'Scenario E', label: 'Agreeing Sources' },
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 text-xs font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
            SYNTHETIC DEMO DATA
          </span>
          <span className="text-xs text-slate-400">SIH 2026 Interactive Fixture Evaluator</span>
        </div>
        <span className="text-xs text-slate-500 font-mono">/api/v1/demo/load/[scenario]</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {scenarios.map((s) => (
          <button
            key={s.id}
            disabled={loading}
            onClick={() => onSelectScenario(s.id)}
            className="flex flex-col items-start p-2.5 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 transition text-left group"
          >
            <span className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
              {s.title}
            </span>
            <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{s.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
