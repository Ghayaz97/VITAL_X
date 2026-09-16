'use client';

import React, { useState, useEffect } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

export default function VitalXPrototype() {
  const [mode, setMode] = useState<'patient' | 'doctor'>('patient');
  
  // Patient State
  const [patientId, setPatientId] = useState<string>('PT-SIH-042');
  const [language, setLanguage] = useState<string>('kn-IN');
  const [sessionId, setSessionId] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(false);
  const [statement, setStatement] = useState<string>('I have joint pain and no history of diabetes.');
  const [micState, setMicState] = useState<'READY' | 'LISTENING' | 'PROCESSING' | 'COMPLETE' | 'FALLBACK'>('READY');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('Joints');
  const [selectedDuration, setSelectedDuration] = useState<string>('3 months');

  // Doctor State
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [fhirError, setFhirError] = useState<string>('');
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [verifyComment, setVerifyComment] = useState<string>('');

  // AYUSH Assessment State
  const [ayushPrakriti, setAyushPrakriti] = useState<string>('Vata-Pitta');
  const [ayushVikriti, setAyushVikriti] = useState<string>('Vata Kopa');
  const [ayushSara, setAyushSara] = useState<string>('Madhyama');
  const [ayushSamhanana, setAyushSamhanana] = useState<string>('Madhyama');
  const [ayushPramana, setAyushPramana] = useState<string>('Pramana Sama');
  const [ayushSatmya, setAyushSatmya] = useState<string>('Satmya Sarva');
  const [ayushSattva, setAyushSattva] = useState<string>('Pravara');
  const [ayushAhara, setAyushAhara] = useState<string>('Madhyama');
  const [ayushVyayama, setAyushVyayama] = useState<string>('Madhyama');
  const [ayushVaya, setAyushVaya] = useState<string>('Madhyama (35 yrs)');

  // Speech Recognition Setup
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState('FALLBACK');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === 'kn-IN' ? 'kn-IN' : language === 'hi-IN' ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setMicState('LISTENING');
      recognition.start();

      recognition.onresult = (event: any) => {
        setMicState('PROCESSING');
        const transcript = event.results[0][0].transcript;
        setStatement(transcript);
        setMicState('COMPLETE');
      };

      recognition.onerror = () => {
        setMicState('FALLBACK');
      };

      recognition.onend = () => {
        if (micState === 'LISTENING') setMicState('READY');
      };
    } catch (err: any) {
      setMicState('FALLBACK');
    }
  };

  // ── Patient Actions ──────────────────────────────────────────────────────

  const startSession = async () => {
    try {
      const res = await fetch(`${API}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: patientId, language, consent_given: true })
      });
      if (!res.ok) throw new Error('Failed to create session');
      const data = await res.json();
      setSessionId(data.session_id);
      setConsentGiven(true);
      setStatusMsg(`Session Initialized: ${data.session_id.substring(0, 8)}...`);
    } catch (err: any) {
      alert(err.message || 'Error connecting to backend');
    }
  };

  const submitPatientClaim = async () => {
    if (!sessionId) return alert('Please initialize session first.');
    try {
      const isDiabetesNo = statement.toLowerCase().includes('no') && statement.toLowerCase().includes('diabet');
      const conceptCode = isDiabetesNo ? 'condition.diabetes' : 'symptom.joint_pain';
      const val = isDiabetesNo ? 'No Diabetes' : `Joint Pain (${selectedLocation}, ${selectedDuration})`;

      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/claims`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: 'clinical',
          concept_code: conceptCode,
          value: val,
          source_type: 'patient_voice',
          source_id: 'SRC-VOICE-01',
          evidence_text: statement,
          language_code: language,
          input_mode: 'voice'
        })
      });
      if (!res.ok) throw new Error('Failed to record claim');
      const data = await res.json();
      setStatusMsg(`Clinical statement recorded. Truth Engine Status: ${data.truth_evaluation.status}`);
    } catch (err: any) {
      alert(err.message || 'Error submitting statement');
    }
  };

  const uploadMockPrescription = async () => {
    if (!sessionId) return alert('Please initialize session first.');
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/documents/mock-upload`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Document mock upload failed');
      const data = await res.json();
      setStatusMsg(`Previous Prescription Ingested (Prototype OCR Adapter)! Truth Engine Status: ${data.truth_evaluation.status} (EXPORT BLOCKED)`);
    } catch (err: any) {
      alert(err.message || 'Error uploading document');
    }
  };

  // ── Doctor Actions ──────────────────────────────────────────────────────

  const fetchQueue = async () => {
    try {
      const res = await fetch(`${API}/api/v1/doctor/queue`);
      if (!res.ok) throw new Error('Failed to fetch queue');
      const data = await res.json();
      setQueue(data);
    } catch (err: any) {
      console.error(err);
    }
  };

  const loadCase = async (id: string) => {
    setFhirError('');
    setFhirBundle(null);
    try {
      const res = await fetch(`${API}/api/v1/doctor/cases/${id}`);
      if (!res.ok) throw new Error('Failed to load case');
      const data = await res.json();
      setSelectedCase(data);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const verifyClaimAction = async (claimId: string, action: string) => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${selectedCase.session.session_id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          action,
          practitioner_id: 'DR-AYUSH-01',
          comment: verifyComment || 'Practitioner review decision applied.'
        })
      });
      if (!res.ok) throw new Error('Verification failed');
      setVerifyComment('');
      await loadCase(selectedCase.session.session_id);
      fetchQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const submitAyushAssessment = async () => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${selectedCase.session.session_id}/ayush`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prakriti: ayushPrakriti,
          vikriti: ayushVikriti,
          sara: ayushSara,
          samhanana: ayushSamhanana,
          pramana: ayushPramana,
          satmya: ayushSatmya,
          sattva: ayushSattva,
          ahara_shakti: ayushAhara,
          vyayama_shakti: ayushVyayama,
          vaya: ayushVaya
        })
      });
      if (!res.ok) throw new Error('Failed to save AYUSH assessment');
      alert('AYUSH Dashavidha assessment saved successfully!');
      loadCase(selectedCase.session.session_id);
    } catch (err: any) {
      alert(err.message);
    }
  };

  const exportFhirBundle = async () => {
    if (!selectedCase) return;
    setFhirError('');
    setFhirBundle(null);
    try {
      const res = await fetch(`${API}/api/v1/sessions/${selectedCase.session.session_id}/fhir`);
      if (!res.ok) {
        const errorData = await res.json();
        const reason = typeof errorData.detail === 'object' ? errorData.detail.reason : errorData.detail;
        setFhirError(reason || 'Export blocked due to unresolved clinical contradictions.');
        return;
      }
      const bundle = await res.json();
      setFhirBundle(bundle);
    } catch (err: any) {
      setFhirError('Failed to fetch FHIR bundle.');
    }
  };

  const resetSessionDemo = async () => {
    if (!selectedCase) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${selectedCase.session.session_id}/reset`, {
        method: 'POST'
      });
      if (!res.ok) throw new Error('Reset failed');
      alert('Session reset successfully for clean demo re-evaluation!');
      loadCase(selectedCase.session.session_id);
      fetchQueue();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (mode === 'doctor') {
      fetchQueue();
      const interval = setInterval(fetchQueue, 3000);
      return () => clearInterval(interval);
    }
  }, [mode]);

  return (
    <div className="app-container">
      {/* Top Header Bar */}
      <header className="app-header">
        <div className="brand-title">
          <span>🌿 VITAL-X</span>
          <span className="brand-sub">SIH26047 Clinical Case-Taking</span>
        </div>
        <div className="nav-tabs">
          <button
            onClick={() => setMode('patient')}
            className={`nav-tab ${mode === 'patient' ? 'active' : ''}`}
          >
            Patient Kiosk Mode
          </button>
          <button
            onClick={() => setMode('doctor')}
            className={`nav-tab ${mode === 'doctor' ? 'active' : ''}`}
          >
            Practitioner Workspace
          </button>
        </div>
      </header>

      {mode === 'patient' ? (
        /* PATIENT KIOSK MODE — Accessible, single-action focused, large touch targets */
        <div style={{ maxWidth: '580px', margin: '10px auto 0 auto' }}>
          
          {/* Header Bar: Multilingual Choice */}
          <div className="card" style={{ textAlign: 'center', padding: '16px 20px', marginBottom: '16px' }}>
            <span className="form-label" style={{ marginBottom: '8px' }}>Select Language / ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ / भाषा चुनें</span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                onClick={() => setLanguage('kn-IN')}
                className={`btn btn-sm ${language === 'kn-IN' ? 'btn-emerald' : 'btn-dark'}`}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                ಕನ್ನಡ
              </button>
              <button
                onClick={() => setLanguage('hi-IN')}
                className={`btn btn-sm ${language === 'hi-IN' ? 'btn-emerald' : 'btn-dark'}`}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                हिन्दी
              </button>
              <button
                onClick={() => setLanguage('en-IN')}
                className={`btn btn-sm ${language === 'en-IN' ? 'btn-emerald' : 'btn-dark'}`}
                style={{ padding: '8px 18px', fontSize: '13px' }}
              >
                English
              </button>
            </div>
          </div>

          {!consentGiven ? (
            /* Consent & Patient ID Card */
            <div className="card" style={{ padding: '28px 24px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, margin: '0 0 12px 0', color: '#f8fafc' }}>
                Welcome to VITAL-X Patient Intake
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', lineHeight: '1.6', margin: '0 0 20px 0' }}>
                VITAL-X will use your voice and document information to prepare a structured clinical history for your AYUSH practitioner.
              </p>

              <div className="form-group">
                <label className="form-label">Patient ABHA Number / ID</label>
                <input
                  value={patientId}
                  onChange={e => setPatientId(e.target.value)}
                  className="form-input"
                  style={{ padding: '12px', fontSize: '14px' }}
                />
              </div>

              <button onClick={startSession} className="btn btn-emerald" style={{ padding: '14px', fontSize: '14px' }}>
                ✓ I Understand & Give Consent
              </button>
            </div>
          ) : (
            /* Conversational History Capture Card */
            <div className="card" style={{ textAlign: 'center', padding: '28px 24px' }}>
              <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px 0', color: '#f8fafc' }}>
                How are you feeling today?
              </h2>
              <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0 0 24px 0' }}>
                Speak or type your symptoms. Your practitioner will review your response.
              </p>

              {/* Speech Recognition Target Button */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={startVoiceInput}
                  className={`btn ${micState === 'LISTENING' ? 'mic-listening' : 'btn-dark'}`}
                  style={{
                    width: '110px',
                    height: '110px',
                    borderRadius: '55px',
                    fontSize: '32px',
                    margin: '0 auto 12px auto',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  🎙️
                </button>
                <div style={{ fontSize: '12px', fontWeight: 600, color: micState === 'LISTENING' ? '#ef4444' : '#94a3b8' }}>
                  {micState === 'READY' && 'Tap to speak'}
                  {micState === 'LISTENING' && 'Listening...'}
                  {micState === 'PROCESSING' && 'Understanding your response...'}
                  {micState === 'COMPLETE' && 'Transcript recorded'}
                  {micState === 'FALLBACK' && 'Voice input unavailable — use text input'}
                </div>
              </div>

              {/* Guided Touch Interaction Options */}
              <div style={{ background: '#0f172a', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '20px', textAlign: 'left' }}>
                <span className="form-label" style={{ marginBottom: '8px' }}>Guided Touch Options (Pain Location)</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
                  {['Joints', 'Knee', 'Back', 'Chest'].map(loc => (
                    <button
                      key={loc}
                      onClick={() => setSelectedLocation(loc)}
                      className={`btn btn-sm ${selectedLocation === loc ? 'btn-emerald' : 'btn-dark'}`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
                <span className="form-label" style={{ marginBottom: '8px' }}>Duration</span>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {['1 day', '1 week', '3 months'].map(dur => (
                    <button
                      key={dur}
                      onClick={() => setSelectedDuration(dur)}
                      className={`btn btn-sm ${selectedDuration === dur ? 'btn-emerald' : 'btn-dark'}`}
                    >
                      {dur}
                    </button>
                  ))}
                </div>
              </div>

              {/* Transcript Field */}
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label">Transcript / Patient Statement</label>
                <textarea
                  value={statement}
                  onChange={e => setStatement(e.target.value)}
                  rows={3}
                  className="form-textarea"
                />
              </div>

              <button onClick={submitPatientClaim} className="btn btn-emerald" style={{ padding: '12px', fontSize: '14px', marginBottom: '16px' }}>
                Submit Clinical Statement
              </button>

              {/* Document Digitization Upload Button */}
              <div style={{ paddingTop: '16px', borderTop: '1px solid #1e293b', textAlign: 'left' }}>
                <span className="form-label">Medical Document Digitization</span>
                <button onClick={uploadMockPrescription} className="btn btn-amber" style={{ padding: '12px', fontSize: '13px' }}>
                  📄 Upload Previous Prescription Document (Prototype OCR Adapter)
                </button>
                <p style={{ fontSize: '11px', color: '#94a3b8', margin: '6px 0 0 0' }}>
                  Ingests historical prescription containing active diabetes record (Triggers Golden-Path Contradiction).
                </p>
              </div>

              {statusMsg && (
                <div className="alert-box alert-success" style={{ marginTop: '16px', textAlign: 'left' }}>
                  {statusMsg}
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* PRACTITIONER WORKSPACE MODE — Information-dense, clinical workspace */
        <div className="dashboard-grid">
          {/* Left Column: Case Queue */}
          <div className="card" style={{ height: 'fit-content' }}>
            <h3 className="card-header">
              <span>Case Queue</span>
              <span className="status-badge badge-tag">{queue.length} Active</span>
            </h3>

            {queue.length === 0 ? (
              <p style={{ fontSize: '12px', color: '#94a3b8' }}>No active cases found.</p>
            ) : (
              queue.map(q => (
                <div
                  key={q.session_id}
                  onClick={() => loadCase(q.session_id)}
                  className={`queue-item ${selectedCase?.session?.session_id === q.session_id ? 'active' : ''}`}
                >
                  <div style={{ fontWeight: 600, fontSize: '13px', color: '#f8fafc', marginBottom: '2px' }}>
                    {q.patient_id}
                  </div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
                    Language: {q.language}
                  </div>
                  <span className={`status-badge ${q.truth_status === 'CONFLICT' ? 'badge-conflict' : 'badge-clear'}`}>
                    {q.truth_status === 'CONFLICT' ? '⚠ CONFLICT' : '✓ VERIFIED'}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Main Column: Case Inspection & Truth Engine Surface */}
          <div>
            {selectedCase ? (
              <div>
                {/* Case Header */}
                <div className="card" style={{ padding: '16px 20px', marginBottom: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                        {selectedCase.session.patient_id}
                      </h2>
                      <span style={{ fontSize: '12px', color: '#94a3b8' }}>
                        Patient Case • {selectedCase.session.language} • Consent Granted
                      </span>
                    </div>
                    <button onClick={resetSessionDemo} className="btn btn-dark btn-sm">
                      🔄 Reset Demo
                    </button>
                  </div>
                </div>

                {/* Hero Truth Engine Conflict Surface */}
                <div className={`truth-surface ${selectedCase.truth_state.status === 'CONFLICT' ? 'truth-conflict-banner' : 'truth-clear-banner'}`}>
                  {selectedCase.truth_state.status === 'CONFLICT' ? (
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '2px' }}>
                        ⚠ CLINICAL VERIFICATION REQUIRED — Diabetes history
                      </div>
                      <div style={{ fontSize: '12px', color: '#fca5a5' }}>
                        Two sources contain conflicting information.
                      </div>

                      {/* Evidence Comparison Grid */}
                      {selectedCase.truth_state.conflicts?.map((conf: any, idx: number) => (
                        <div key={idx} className="evidence-grid">
                          <div className="evidence-card conflict-source">
                            <span className="status-badge badge-tag" style={{ marginBottom: '6px' }}>PATIENT VOICE</span>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                              "{conf.evidence[0]?.value || 'No Diabetes'}"
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              Source: Patient Voice • Language: {selectedCase.session.language} • Unverified
                            </div>
                          </div>

                          <div className="evidence-card conflict-source">
                            <span className="status-badge badge-tag" style={{ marginBottom: '6px' }}>PREVIOUS DOCUMENT</span>
                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc' }}>
                              "{conf.evidence[1]?.value || 'Diabetes Medication Detected'}"
                            </div>
                            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                              Source: Previous Document • Adapter: Prototype OCR • Unverified
                            </div>
                          </div>
                        </div>
                      ))}

                      <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(239, 68, 68, 0.3)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                        <span className="status-badge badge-conflict">EXPORT BLOCKED — Practitioner decision required</span>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => verifyClaimAction(selectedCase.claims[0]?.claim_id, 'reject_claim')}
                            className="btn btn-emerald btn-sm"
                          >
                            Accept Document Claim
                          </button>
                          <button
                            onClick={() => verifyClaimAction(selectedCase.claims[0]?.claim_id, 'accept_claim')}
                            className="btn btn-dark btn-sm"
                          >
                            Accept Patient Claim
                          </button>
                          <button
                            onClick={() => verifyClaimAction(selectedCase.claims[0]?.claim_id, 'keep_both')}
                            className="btn btn-dark btn-sm"
                          >
                            Keep Both
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '10px' }}>
                        <input
                          placeholder="Practitioner review note (e.g. Overridden by prescription record 2025)..."
                          value={verifyComment}
                          onChange={e => setVerifyComment(e.target.value)}
                          className="form-input"
                          style={{ fontSize: '12px', padding: '6px 10px' }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          ✓ VERIFIED
                        </div>
                        <div style={{ fontSize: '12px', color: '#6ee7b7' }}>
                          Conflict resolved • Practitioner review complete
                        </div>
                      </div>
                      <span className="status-badge badge-clear">EXPORT READY</span>
                    </div>
                  )}
                </div>

                {/* Structured Clinical Claims & Traceable Provenance */}
                <div className="card">
                  <h3 className="card-header">
                    <span>Source Traceability & Provenance</span>
                    <span className="status-badge badge-tag">{selectedCase.claims.length} Claims</span>
                  </h3>

                  {selectedCase.claims.map((c: any) => (
                    <div key={c.claim_id} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: '8px', padding: '14px', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#f8fafc' }}>{c.concept_code}: {c.value}</strong>
                        </div>
                        <span className={`status-badge ${c.verification_status?.includes('REJECT') ? 'badge-conflict' : c.verification_status?.includes('ACCEPT') ? 'badge-clear' : 'badge-tag'}`}>
                          {c.verification_status}
                        </span>
                      </div>

                      <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '8px' }}>
                        Source: <strong>{c.source_type}</strong> ({c.input_mode}) • Evidence: <em>"{c.evidence_text}"</em>
                      </div>

                      {c.namaste_term && (
                        <div style={{ fontSize: '11px', color: '#10b981', background: '#062c21', padding: '4px 8px', borderRadius: '4px', display: 'inline-block' }}>
                          🏷️ NAMASTE Candidate: <strong>{c.namaste_term}</strong> ({c.namaste_code}) • Status: Candidate • Practitioner confirmation
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* AYUSH Dashavidha Assessment Panel */}
                <div className="card">
                  <h3 className="card-header">
                    <span>AYUSH Dashavidha Assessment</span>
                    <button onClick={submitAyushAssessment} className="btn btn-emerald btn-sm">
                      Save Assessment
                    </button>
                  </h3>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label className="form-label">Prakriti (ಪ್ರಕೃತಿ)</label>
                      <select value={ayushPrakriti} onChange={e => setAyushPrakriti(e.target.value)} className="form-select">
                        <option value="Vata-Pitta">Vata-Pitta (ವಾತ-ಪಿತ್ತ)</option>
                        <option value="Pitta-Kapha">Pitta-Kapha (ಪಿತ್ತ-ಕಫ)</option>
                        <option value="Kapha-Vata">Kapha-Vata (ಕಫ-ವಾತ)</option>
                        <option value="Sama">Sama (ಸಮ)</option>
                      </select>
                    </div>

                    <div>
                      <label className="form-label">Vikriti (ವಿಕೃತಿ)</label>
                      <input value={ayushVikriti} onChange={e => setAyushVikriti(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Sara (ಸಾರ)</label>
                      <input value={ayushSara} onChange={e => setAyushSara(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Samhanana (ಸಂಹನನ)</label>
                      <input value={ayushSamhanana} onChange={e => setAyushSamhanana(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Pramana (ಪ್ರಮಾಣ)</label>
                      <input value={ayushPramana} onChange={e => setAyushPramana(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Satmya (ಸಾತ್ಮ್ಯ)</label>
                      <input value={ayushSatmya} onChange={e => setAyushSatmya(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Sattva (ಸತ್ತ್ವ)</label>
                      <input value={ayushSattva} onChange={e => setAyushSattva(e.target.value)} className="form-input" />
                    </div>

                    <div>
                      <label className="form-label">Vaya (ವಯಸ್ಸು)</label>
                      <input value={ayushVaya} onChange={e => setAyushVaya(e.target.value)} className="form-input" />
                    </div>
                  </div>
                </div>

                {/* FHIR Export Section */}
                <div className="card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '14px', color: '#f8fafc' }}>FHIR R4 / ABDM Interoperability Export</h4>
                      <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#94a3b8' }}>
                        {selectedCase.truth_state.export_blocked ? 'FHIR EXPORT — Blocked — Resolve outstanding verification first.' : 'FHIR EXPORT — ✓ Ready — FHIR R4 Bundle'}
                      </p>
                    </div>
                    <button
                      onClick={exportFhirBundle}
                      disabled={selectedCase.truth_state.export_blocked}
                      className={`btn btn-sm ${selectedCase.truth_state.export_blocked ? 'btn-dark' : 'btn-emerald'}`}
                      style={{ opacity: selectedCase.truth_state.export_blocked ? 0.5 : 1 }}
                    >
                      {selectedCase.truth_state.export_blocked ? 'Export Blocked' : 'Export Bundle'}
                    </button>
                  </div>

                  {fhirError && (
                    <div className="alert-box alert-danger" style={{ marginTop: '14px', marginBottom: 0 }}>
                      🚫 <strong>FHIR EXPORT BLOCKED:</strong> {fhirError}
                    </div>
                  )}

                  {fhirBundle && (
                    <div style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #1e293b' }}>
                      <pre style={{ background: '#090d16', padding: '12px', borderRadius: '8px', fontSize: '11px', color: '#34d399', overflowX: 'auto', maxHeight: '250px' }}>
                        {JSON.stringify(fhirBundle, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
                <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                  Select a case from the queue to inspect evidence provenance, resolve clinical contradictions, and export FHIR records.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
