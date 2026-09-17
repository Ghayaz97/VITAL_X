'use client';

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface AyushSectionProps {
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
  claims: any[];
}

export default function AyushSection({
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
  claims,
}: AyushSectionProps) {
  const fields = [
    { label: '1. Prakriti (ಪ್ರಕೃತಿ / Constitution)', value: ayushPrakriti, setter: setAyushPrakriti },
    { label: '2. Vikriti (ವಿಕೃತಿ / Morbid State)', value: ayushVikriti, setter: setAyushVikriti },
    { label: '3. Sara (ಸಾರ / Tissue Quality)', value: ayushSara, setter: setAyushSara },
    { label: '4. Samhanana (ಸಂಹನನ / Compactness)', value: ayushSamhanana, setter: setAyushSamhanana },
    { label: '5. Pramana (ಪ್ರಮಾಣ / Body Proportions)', value: ayushPramana, setter: setAyushPramana },
    { label: '6. Satmya (ಸಾತ್ಮ್ಯ / Adaptability)', value: ayushSatmya, setter: setAyushSatmya },
    { label: '7. Sattva (ಸತ್ತ್ವ / Mental Strength)', value: ayushSattva, setter: setAyushSattva },
    { label: '8. Ahara Shakti (ಆಹಾರ ಶಕ್ತಿ / Digestive Power)', value: ayushAhara, setter: setAyushAhara },
    { label: '9. Vyayama Shakti (ವ್ಯಾಯಾಮ ಶಕ್ತಿ / Physical Endurance)', value: ayushVyayama, setter: setAyushVyayama },
    { label: '10. Vaya (ವಯಸ್ಸು / Age State)', value: ayushVaya, setter: setAyushVaya },
  ];

  return (
    <Card
      title="AYUSH Dashavidha Pariksha (ದಶವಿಧ ಪರೀಕ್ಷೆ)"
      subtitle="Structured 10-Fold Clinical Assessment & Terminology Mapping"
      headerRight={
        <Button variant="primary" size="sm" onClick={onSaveAyush}>
          Save Assessment
        </Button>
      }
    >
      <div className="space-y-6">
        {/* Notice */}
        <div className="p-3 bg-indigo-950/20 border border-indigo-800/30 rounded-xl text-xs text-indigo-300 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span>ℹ️</span>
            <span>
              <strong>Controlled Reference Layer:</strong> Terminology candidates (NAMASTE / ICD-11) are AI-proposed suggestions and remain unverified until practitioner confirmation.
            </span>
          </div>
          <Badge variant="candidate">PROPOSED</Badge>
        </div>

        {/* 10-Field Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {fields.map((f, i) => (
            <div key={i} className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 space-y-1">
              <label className="block text-[var(--text-secondary)] text-[11px] font-medium">{f.label}</label>
              <input
                type="text"
                value={f.value}
                onChange={(e) => f.setter(e.target.value)}
                className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-3 py-1.5 text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          ))}
        </div>

        {/* Terminology Candidates List */}
        <div>
          <h4 className="text-xs font-semibold text-[var(--text-secondary)] mb-2 uppercase tracking-wider">
            Associated NAMASTE & ICD-11 Reference Candidates
          </h4>
          <div className="space-y-2">
            {claims.map((c) => (
              <div
                key={c.claim_id}
                className="bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-mono-code text-[var(--text-tertiary)]">{c.concept_code}:</span>{' '}
                  <span className="text-[var(--text-primary)] font-semibold">{c.value}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-indigo-400 font-mono-code font-semibold">
                    {c.namaste_term || 'Unmapped General Lakshan'} ({c.namaste_code || 'AYU-GEN'})
                  </span>
                  <Badge variant={c.claim_state === 'VERIFIED' ? 'verified' : 'candidate'}>
                    {c.claim_state === 'VERIFIED' ? 'VERIFIED' : 'CANDIDATE'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
