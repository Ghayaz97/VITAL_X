'use client';

import { useState } from 'react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000';

type Claim = { concept_code: string; value: { text?: string; duration?: string | null }; verification_status: string };

export default function Home() {
  const [sessionId, setSessionId] = useState('');
  const [step, setStep] = useState<'welcome'|'consent'|'profile'|'interview'|'result'>('welcome');
  const [text, setText] = useState('');
  const [claim, setClaim] = useState<Claim | null>(null);
  const [message, setMessage] = useState('');

  async function start() {
    const r = await fetch(`${API}/api/v1/sessions`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({language_code:'en-IN'}) });
    const data = await r.json();
    setSessionId(data.session_id);
    setStep('consent');
  }

  async function consent() {
    await fetch(`${API}/api/v1/sessions/${sessionId}/consents`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({purpose:'history_capture',status:'granted'}) });
    setStep('profile');
  }

  async function profile() {
    await fetch(`${API}/api/v1/sessions/${sessionId}/patient`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({name:'Demo Patient',age:30,sex:'F',preferred_language:'en-IN'}) });
    setStep('interview');
  }

  async function submitAnswer() {
    const r = await fetch(`${API}/api/v1/sessions/${sessionId}/answers`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({question_id:'chief_complaint',raw_text:text,input_mode:'touch',language_code:'en-IN'}) });
    const data = await r.json();
    setClaim(data.claim);
    setMessage(data.safety_events?.length ? data.safety_events[0].message : 'Information captured and structured.');
    setStep('result');
  }

  return <main style={{maxWidth:900, margin:'0 auto', padding:'64px 24px'}}>
    <div className="card">
      <div style={{fontSize:14, letterSpacing:2, fontWeight:700}}>VITAL-X</div>
      {step === 'welcome' && <section><h1>Clinical history, organized before consultation.</h1><p>AI-assisted patient intake with voice/touch interaction, structured claims and clinician verification.</p><button onClick={start}>START</button></section>}
      {step === 'consent' && <section><h2>Before we begin</h2><p>VITAL-X will collect information needed for the clinical history.</p><button onClick={consent}>I UNDERSTAND & CONTINUE</button></section>}
      {step === 'profile' && <section><h2>Patient information</h2><p>Demo profile will be used for the first vertical slice.</p><button onClick={profile}>CONTINUE</button></section>}
      {step === 'interview' && <section><h2>What brings you here today?</h2><textarea value={text} onChange={e=>setText(e.target.value)} placeholder="Example: I have chest pain since 1 day" rows={5} style={{width:'100%',padding:16,borderRadius:12,border:'1px solid #ccd8d4'}}/><div style={{marginTop:16}}><button onClick={submitAnswer}>SUBMIT ANSWER</button></div></section>}
      {step === 'result' && <section><h2>Information captured</h2>{claim && <pre style={{whiteSpace:'pre-wrap'}}>{JSON.stringify(claim,null,2)}</pre>}<p>{message}</p><p>Verification status: <strong>{claim?.verification_status}</strong></p><button onClick={()=>setStep('interview')}>CONTINUE INTERVIEW</button></section>}
    </div>
  </main>
}
