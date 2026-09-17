'use client';

import React, { useState } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface PatientKioskProps {
  patientId: string;
  setPatientId: (val: string) => void;
  language: string;
  setLanguage: (val: string) => void;
  consentGiven: boolean;
  setConsentGiven: (val: boolean) => void;
  sessionId: string;
  onStartSession: () => void;
  statement: string;
  setStatement: (val: string) => void;
  micState: string;
  onStartVoiceInput: () => void;
  onSubmitVoiceClaim: () => void;
  onUploadMockDoc: () => void;
  statusMsg: string;
  selectedLocation: string;
  setSelectedLocation: (val: string) => void;
  selectedDuration: string;
  setSelectedDuration: (val: string) => void;
  onSubmitTouchClaim: () => void;
}

export default function PatientKiosk({
  patientId,
  setPatientId,
  language,
  setLanguage,
  consentGiven,
  setConsentGiven,
  sessionId,
  onStartSession,
  statement,
  setStatement,
  micState,
  onStartVoiceInput,
  onSubmitVoiceClaim,
  onUploadMockDoc,
  statusMsg,
  selectedLocation,
  setSelectedLocation,
  selectedDuration,
  setSelectedDuration,
  onSubmitTouchClaim,
}: PatientKioskProps) {
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('voice');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Session Progress Header */}
      <div className="flex items-center justify-between bg-slate-900/90 border border-slate-800/80 rounded-xl px-5 py-3.5">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-semibold text-xs">
            1
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-200">Patient Intake Journey</div>
            <div className="text-[11px] text-slate-400">Step 1 of 2: Pre-Consultation Symptom & Record Intake</div>
          </div>
        </div>

        {/* Language Selector */}
        <div className="flex items-center space-x-2">
          <label className="text-xs text-slate-400">Language / ಭಾಷೆ:</label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-slate-950 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="kn-IN">ಕನ್ನಡ (Kannada)</option>
            <option value="hi-IN">हिन्दी (Hindi)</option>
            <option value="en-IN">English (India)</option>
          </select>
        </div>
      </div>

      {/* Hero Header */}
      {!sessionId ? (
        <Card className="text-center py-10 px-6 space-y-4">
          <div className="max-w-xl mx-auto space-y-2">
            <h2 className="text-2xl font-bold tracking-tight text-white">Let&apos;s understand your health.</h2>
            <p className="text-sm text-slate-400">
              You can speak naturally in your preferred language. VITAL-X converts your spoken description and past documents into a clinical case file for your doctor.
            </p>
          </div>

          <div className="max-w-sm mx-auto space-y-4 pt-2">
            <div>
              <label className="block text-left text-xs font-medium text-slate-400 mb-1">
                Patient Identifier / ABHA ID
              </label>
              <input
                type="text"
                value={patientId}
                onChange={(e) => setPatientId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer justify-center">
              <input
                type="checkbox"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="rounded border-slate-700 text-emerald-600 focus:ring-emerald-500"
              />
              <span>I consent to clinical intake recording and record verification</span>
            </label>

            <Button variant="primary" size="lg" className="w-full" onClick={onStartSession}>
              Initialize Patient Intake
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Active Patient Hero Card */}
          <Card className="p-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800/80 mb-6">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white">Let&apos;s understand your health.</h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  You can speak naturally in your preferred language ({language}).
                </p>
              </div>

              <div className="flex items-center space-x-2 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400">Session ID:</span>
                <span className="text-xs font-mono font-bold text-emerald-400">{sessionId}</span>
              </div>
            </div>

            {/* Main Primary / Secondary Input Actions */}
            <div className="space-y-6">
              <div className="flex items-center space-x-3">
                <Button
                  variant={inputMode === 'voice' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setInputMode('voice')}
                >
                  🎙️ Start speaking
                </Button>
                <Button
                  variant={inputMode === 'text' ? 'primary' : 'outline'}
                  size="md"
                  onClick={() => setInputMode('text')}
                >
                  ⌨️ Type instead
                </Button>
              </div>

              {inputMode === 'voice' ? (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                  <div className="max-w-md mx-auto space-y-3">
                    <button
                      onClick={onStartVoiceInput}
                      className={`w-20 h-20 rounded-full mx-auto flex items-center justify-center text-2xl transition-clinical ${
                        micState === 'LISTENING'
                          ? 'bg-red-600 text-white mic-recording'
                          : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                      }`}
                    >
                      🎙️
                    </button>

                    <div>
                      <div className="text-sm font-semibold text-slate-200">
                        {micState === 'LISTENING' ? 'Listening now... Speak freely' : 'Tap to start recording'}
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Detected Language: <span className="font-mono text-emerald-400">{language}</span>
                      </div>
                    </div>
                  </div>

                  <div className="max-w-xl mx-auto">
                    <label className="block text-left text-xs font-medium text-slate-400 mb-1">
                      Recorded Statement Transcription
                    </label>
                    <textarea
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <Button variant="primary" size="md" onClick={onSubmitVoiceClaim}>
                      Submit Spoken Symptom
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-950 border border-slate-800 rounded-xl p-6 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1">
                      Type Your Health Description
                    </label>
                    <textarea
                      value={statement}
                      onChange={(e) => setStatement(e.target.value)}
                      rows={4}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-lg p-3 text-sm text-slate-100 focus:outline-none focus:border-emerald-500"
                      placeholder="Describe your pain, duration, or medical history..."
                    />
                  </div>
                  <Button variant="primary" size="md" onClick={onSubmitVoiceClaim}>
                    Submit Description
                  </Button>
                </div>
              )}

              {/* Touchscreen Guided Selector & Document Upload */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-slate-800/80">
                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3">
                  <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                    Touchscreen Guided Selector
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">Pain Region</label>
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                      >
                        <option value="Joints">Joint Pain (ಸಂಧಿಗತ ವಾತ)</option>
                        <option value="Chest">Chest Pain (ಹೃಚ್ಛೂಲ)</option>
                        <option value="Fever">Fever (ಜ್ವರ)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">Duration</label>
                      <select
                        value={selectedDuration}
                        onChange={(e) => setSelectedDuration(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded px-2.5 py-1.5 text-slate-100"
                      >
                        <option value="3 months">3 Months</option>
                        <option value="1 year">1 Year</option>
                        <option value="Acute">Acute (&lt; 1 week)</option>
                      </select>
                    </div>
                  </div>
                  <Button variant="secondary" size="sm" className="w-full" onClick={onSubmitTouchClaim}>
                    Submit Touch Selection
                  </Button>
                </div>

                <div className="bg-slate-950 border border-slate-800/80 rounded-lg p-4 space-y-3 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                      Medical Document Upload
                    </h4>
                    <p className="text-xs text-slate-400 mt-1">
                      Upload past prescriptions, lab reports, or clinic summary records.
                    </p>
                  </div>
                  <Button variant="amber" size="sm" className="w-full" onClick={onUploadMockDoc}>
                    📄 Upload Prescription Record
                  </Button>
                </div>
              </div>

              {statusMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300 font-mono-code">
                  ✓ {statusMsg}
                </div>
              )}
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
