'use client';

import React from 'react';

interface AyushGridProps {
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
}

export default function AyushGrid({
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
}: AyushGridProps) {
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
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">AYUSH Dashavidha Pariksha (ದಶವಿಧ ಪರೀಕ್ಷೆ)</h3>
          <p className="text-xs text-slate-400">Standardized 10-Fold Clinical Assessment Protocol</p>
        </div>
        <button
          onClick={onSaveAyush}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-1.5 px-4 rounded-lg text-xs transition"
        >
          Save Assessment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {fields.map((f, i) => (
          <div key={i} className="bg-slate-950 border border-slate-800 rounded p-2.5">
            <label className="block text-slate-400 text-[11px] mb-1 font-medium">{f.label}</label>
            <input
              type="text"
              value={f.value}
              onChange={(e) => f.setter(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
