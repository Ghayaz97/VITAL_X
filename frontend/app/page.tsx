'use client';

import React, { useState, useEffect } from 'react';
import AppHeader from './components/layout/AppHeader';
import RoleSelectionLanding from './components/layout/RoleSelectionLanding';
import DemoScenarioPicker from './components/demo/DemoScenarioPicker';
import IdentifyStep from './components/patient/IdentifyStep';
import ConverseStep from './components/patient/ConverseStep';
import ScanStep from './components/patient/ScanStep';
import SummarizeStep from './components/patient/SummarizeStep';
import ConsultStep from './components/practitioner/ConsultStep';
import PractitionerWorkspace from './components/practitioner/PractitionerWorkspace';
import PractitionerLogin from './components/practitioner/PractitionerLogin';
import SystemDiagnostics from './components/diagnostics/SystemDiagnostics';
import { useLanguage } from './hooks/useLanguage';
import { loadSession, logout, PractitionerSession } from './lib/auth';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export default function VitalXPrototype() {
  const { locale, setLocale, tr } = useLanguage();
  const [mode, setMode] = useState<'landing' | 'patient' | 'doctor'>('landing');
  const [patientStep, setPatientStep] = useState<number>(1);
  const [stepHistory, setStepHistory] = useState<number[]>([]);
  const [showDeveloperTools, setShowDeveloperTools] = useState<boolean>(false);

  // Navigate forward
  const goToStep = (next: number) => {
    setStepHistory((h) => [...h, patientStep]);
    setPatientStep(next);
  };

  // Navigate back
  const goBack = () => {
    setStepHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setPatientStep(prev);
      return h.slice(0, -1);
    });
  };


  // Auth State
  const [session, setSession] = useState<PractitionerSession | null>(null);

  useEffect(() => {
    setSession(loadSession());
  }, []);

  const handleLogin = (newSession: PractitionerSession) => {
    setSession(newSession);
  };

  const handleLogout = () => {
    logout();
    setSession(null);
  };

  // Patient State
  const [patientId, setPatientId] = useState<string>('PT-SIH-042');
  const [abhaId, setAbhaId] = useState<string>('91-042-4242-88');
  const [sessionId, setSessionId] = useState<string>('');
  const [consentGiven, setConsentGiven] = useState<boolean>(true);
  const [statement, setStatement] = useState<string>('I have joint pain and no history of diabetes.');
  const [micState, setMicState] = useState<'READY' | 'LISTENING' | 'PROCESSING' | 'COMPLETE' | 'FALLBACK'>('READY');
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [loadingSession, setLoadingSession] = useState<boolean>(false);
  const [docUploaded, setDocUploaded] = useState<boolean>(false);
  const [redFlags, setRedFlags] = useState<any[]>([]);
  const [routingState, setRoutingState] = useState<string>('NORMAL');

  // Doctor State
  const [queue, setQueue] = useState<any[]>([]);
  const [selectedCase, setSelectedCase] = useState<any>(null);
  const [fhirError, setFhirError] = useState<string>('');
  const [fhirBundle, setFhirBundle] = useState<any>(null);
  const [verifyComment, setVerifyComment] = useState<string>('');
  const [auditTrail, setAuditTrail] = useState<any[]>([]);
  const [loadingDemo, setLoadingDemo] = useState<boolean>(false);

  // AYUSH State
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

  // ── Speech Recognition ──────────────────────────────────────────────────
  const startVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMicState('FALLBACK');
      return;
    }
    try {
      const recognition = new SpeechRecognition();
      recognition.lang = locale;
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
    } catch {
      setMicState('FALLBACK');
    }
  };

  // ── API Actions ────────────────────────────────────────────────────────
  const startSession = async () => {
    setLoadingSession(true);
    try {
      const res = await fetch(`${API}/api/v1/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          abha_id: abhaId,
          language: locale,
          consent_given: consentGiven,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session_id);
        setStatusMsg(`Session initialized: ${data.session_id}`);
        goToStep(2);
        refreshDoctorQueue();
      }
    } catch {
      setStatusMsg('Failed to initialize session. Is backend running?');
    } finally {
      setLoadingSession(false);
    }
  };

  const submitAnswer = async (textAnswer: string, modeInput: 'voice' | 'touch' | 'text') => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/interview/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          step_id: 'chief_complaint',
          answer_text: textAnswer || statement,
          input_mode: modeInput,
          language_code: locale,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.safety_signals && data.safety_signals.length > 0) {
          setRedFlags(data.safety_signals);
          setRoutingState('URGENT');
        } else {
          goToStep(3);
        }
        refreshDoctorQueue();
      }
    } catch {
      setStatusMsg('Failed to record answer');
    }
  };

  const uploadMockDoc = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/documents/mock-upload`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setDocUploaded(true);
        setStatusMsg('Document Ingested — Contradiction Generated!');
        await refreshDoctorQueue();
        await selectCase(sessionId);
        goToStep(4);
      }
    } catch {
      setStatusMsg('Failed to upload mock document');
    }
  };

  const refreshDoctorQueue = async () => {
    try {
      const res = await fetch(`${API}/api/v1/doctor/queue`);
      if (res.ok) {
        const data = await res.json();
        setQueue(data);
      }
    } catch {
      console.error('Failed to fetch doctor queue');
    }
  };

  const selectCase = async (sid: string) => {
    try {
      const res = await fetch(`${API}/api/v1/doctor/cases/${sid}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedCase(data);
        fetchAuditTrail(sid);
      }
    } catch {
      console.error('Failed to fetch case details');
    }
  };

  const fetchAuditTrail = async (sid: string) => {
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sid}/audit`);
      if (res.ok) {
        const data = await res.json();
        setAuditTrail(data);
      }
    } catch {
      console.error('Failed to fetch audit trail');
    }
  };

  const verifyClaim = async (claimId: string, action: string) => {
    if (!selectedCase) return;
    const sid = selectedCase.session.session_id;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sid}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claim_id: claimId,
          action,
          practitioner_id: session?.id || 'DR-AYUSH-01',
          comment: verifyComment || 'Verified by Practitioner',
        }),
      });
      if (res.ok) {
        selectCase(sid);
        refreshDoctorQueue();
        setFhirError('');
      }
    } catch {
      console.error('Failed to execute verification action');
    }
  };

  const saveAyush = async () => {
    if (!selectedCase) return;
    const sid = selectedCase.session.session_id;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sid}/ayush`, {
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
          vaya: ayushVaya,
        }),
      });
      if (res.ok) {
        selectCase(sid);
      }
    } catch {
      console.error('Failed to save AYUSH assessment');
    }
  };

  const exportFhir = async () => {
    if (!selectedCase) return;
    const sid = selectedCase.session.session_id;
    setFhirError('');
    setFhirBundle(null);
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sid}/fhir`);
      const data = await res.json();
      if (!res.ok) {
        setFhirError(data.detail?.reason || data.detail?.message || 'Export Blocked');
      } else {
        setFhirBundle(data);
      }
    } catch {
      setFhirError('Failed to request FHIR export from API');
    }
  };

  const loadDemoScenario = async (scenario: string) => {
    setLoadingDemo(true);
    try {
      const res = await fetch(`${API}/api/v1/demo/load/${scenario}`, {
        method: 'POST',
      });
      const data = await res.json();
      if (res.ok) {
        setSessionId(data.session_id);
        setPatientId(data.patient_id);
        setStatusMsg(`Demo Scenario ${scenario} loaded! Session: ${data.session_id}`);
        setPatientStep(4);
        await refreshDoctorQueue();
        await selectCase(data.session_id);
      }
    } catch {
      setStatusMsg(`Failed to load scenario ${scenario}`);
    } finally {
      setLoadingDemo(false);
    }
  };

  const resetCurrentSession = async () => {
    if (!sessionId) return;
    try {
      const res = await fetch(`${API}/api/v1/sessions/${sessionId}/reset`, {
        method: 'POST',
      });
      if (res.ok) {
        setStatusMsg('Session claims reset cleanly.');
        setSelectedCase(null);
        setFhirBundle(null);
        setFhirError('');
        setPatientStep(1);
        setDocUploaded(false);
        setRedFlags([]);
        setRoutingState('NORMAL');
        refreshDoctorQueue();
      }
    } catch {
      setStatusMsg('Failed to reset session');
    }
  };

  useEffect(() => {
    refreshDoctorQueue();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-primary)] flex flex-col font-sans transition-colors duration-200">
      {/* App Header */}
      <AppHeader
        mode={mode === 'landing' ? 'patient' : mode}
        setMode={(newMode) => setMode(newMode)}
        queueCount={queue.length}
        onResetSession={resetCurrentSession}
        sessionId={sessionId}
        locale={locale}
        setLocale={setLocale}
        session={session}
        onLogout={handleLogout}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-8 space-y-6">
        {/* Landing / Role Entry */}
        {mode === 'landing' ? (
          <RoleSelectionLanding
            onSelectRole={(selectedRole) => setMode(selectedRole)}
            locale={locale}
            setLocale={setLocale}
            tr={tr}
          />
        ) : mode === 'patient' ? (
          <>
            {/* Minimal Subtle Step Indicator for Patient Kiosk */}
            <div className="max-w-2xl mx-auto">
              <div className="flex items-center justify-between px-4 py-2 bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] rounded-full text-xs font-mono-code">
                {/* Back button — only visible from step 2 onward */}
                {patientStep > 1 && stepHistory.length > 0 ? (
                  <button
                    type="button"
                    onClick={goBack}
                    className="text-emerald-400 hover:text-emerald-300 font-bold transition-clinical flex items-center space-x-1"
                    aria-label="Go back to previous step"
                  >
                    <span>←</span>
                    <span className="hidden sm:inline">Back</span>
                  </button>
                ) : (
                  <span className="text-emerald-400 font-bold">Step {patientStep} of 5</span>
                )}
                <div className="flex items-center space-x-1.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span
                      key={s}
                      className={`w-2.5 h-2.5 rounded-full transition-clinical ${
                        s === patientStep
                          ? 'bg-emerald-500 ring-2 ring-emerald-400/40 scale-125'
                          : s < patientStep
                          ? 'bg-emerald-700'
                          : 'bg-[var(--border-medium)]'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[var(--text-tertiary)] hidden sm:inline">
                  {patientStep === 1
                    ? 'Identify'
                    : patientStep === 2
                    ? 'Converse'
                    : patientStep === 3
                    ? 'Scan'
                    : patientStep === 4
                    ? 'Summarize'
                    : 'Consult'}
                </span>
              </div>
            </div>

            {/* Step Views */}
            {patientStep === 1 && (
              <IdentifyStep
                patientId={patientId}
                setPatientId={setPatientId}
                abhaId={abhaId}
                setAbhaId={setAbhaId}
                locale={locale}
                setLocale={setLocale}
                tr={tr}
                consentGiven={consentGiven}
                setConsentGiven={setConsentGiven}
                onInitializeSession={startSession}
                loading={loadingSession}
              />
            )}
            {patientStep === 2 && (
              <ConverseStep
                sessionId={sessionId}
                locale={locale}
                tr={tr}
                statement={statement}
                setStatement={setStatement}
                micState={micState}
                onStartVoiceInput={startVoiceInput}
                onSubmitAnswer={submitAnswer}
                redFlags={redFlags}
                routingState={routingState}
                onBack={goBack}
              />
            )}
            {patientStep === 3 && (
              <ScanStep
                tr={tr}
                onUploadDocument={uploadMockDoc}
                onBack={goBack}
                loading={false}
                docUploaded={docUploaded}
              />
            )}
            {patientStep === 4 && (
              <SummarizeStep
                tr={tr}
                truthState={selectedCase?.truth_state}
                routingState={routingState}
                onBack={goBack}
                onGoToConsult={() => {
                  goToStep(5);
                  setMode('doctor');
                }}
              />
            )}

            {patientStep === 5 && (
              <ConsultStep
                selectedCase={selectedCase}
                verifyComment={verifyComment}
                setVerifyComment={setVerifyComment}
                onVerifyClaim={verifyClaim}
                ayushPrakriti={ayushPrakriti}
                setAyushPrakriti={setAyushPrakriti}
                ayushVikriti={ayushVikriti}
                setAyushVikriti={setAyushVikriti}
                ayushSara={ayushSara}
                setAyushSara={setAyushSara}
                ayushSamhanana={ayushSamhanana}
                setAyushSamhanana={setAyushSamhanana}
                ayushPramana={ayushPramana}
                setAyushPramana={setAyushPramana}
                ayushSatmya={ayushSatmya}
                setAyushSatmya={setAyushSatmya}
                ayushSattva={ayushSattva}
                setAyushSattva={setAyushSattva}
                ayushAhara={ayushAhara}
                setAyushAhara={setAyushAhara}
                ayushVyayama={ayushVyayama}
                setAyushVyayama={setAyushVyayama}
                ayushVaya={ayushVaya}
                setAyushVaya={setAyushVaya}
                onSaveAyush={saveAyush}
                fhirError={fhirError}
                fhirBundle={fhirBundle}
                onExportFhir={exportFhir}
                auditTrail={auditTrail}
              />
            )}
          </>
        ) : !session ? (
          <PractitionerLogin onLogin={handleLogin} />
        ) : (
          <div className="space-y-6">
            {/* Scenario Picker for Demo Mode */}
            <DemoScenarioPicker onSelectScenario={loadDemoScenario} loading={loadingDemo} />

            <PractitionerWorkspace
              queue={queue}
              selectedCase={selectedCase}
              onSelectCase={selectCase}
              onRefreshQueue={refreshDoctorQueue}
              verifyComment={verifyComment}
              setVerifyComment={setVerifyComment}
              onVerifyClaim={verifyClaim}
              ayushPrakriti={ayushPrakriti}
              setAyushPrakriti={setAyushPrakriti}
              ayushVikriti={ayushVikriti}
              setAyushVikriti={setAyushVikriti}
              ayushSara={ayushSara}
              setAyushSara={setAyushSara}
              ayushSamhanana={ayushSamhanana}
              setAyushSamhanana={setAyushSamhanana}
              ayushPramana={ayushPramana}
              setAyushPramana={setAyushPramana}
              ayushSatmya={ayushSatmya}
              setAyushSatmya={setAyushSatmya}
              ayushSattva={ayushSattva}
              setAyushSattva={setAyushSattva}
              ayushAhara={ayushAhara}
              setAyushAhara={setAyushAhara}
              ayushVyayama={ayushVyayama}
              setAyushVyayama={setAyushVyayama}
              ayushVaya={ayushVaya}
              setAyushVaya={setAyushVaya}
              onSaveAyush={saveAyush}
              fhirError={fhirError}
              fhirBundle={fhirBundle}
              onExportFhir={exportFhir}
              auditTrail={auditTrail}
            />
          </div>
        )}

        {/* Developer Diagnostics Layer */}
        {mode === 'doctor' && session && showDeveloperTools && <SystemDiagnostics />}
      </main>
    </div>
  );
}
