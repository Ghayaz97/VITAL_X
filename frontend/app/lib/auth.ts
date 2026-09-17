'use client';

// VITAL-X Demo Auth — Prototype only. Not production authentication.
export interface PractitionerSession {
  id: string;
  email: string;
  name: string;
  role: 'practitioner' | 'admin';
  isDemo: boolean;
  loginAt: string;
}

const SESSION_KEY = 'vitalx-practitioner-session';

export function demoLogin(email: string, password: string): PractitionerSession | null {
  const ok = email.trim().toLowerCase() === 'demo@vitalx.local' && password === 'demo1234';
  if (!ok) return null;
  const session: PractitionerSession = {
    id: 'DEMO-PRACTITIONER-001',
    email: 'demo@vitalx.local',
    name: 'Dr. Demo Practitioner',
    role: 'practitioner',
    isDemo: true,
    loginAt: new Date().toISOString(),
  };
  try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(session)); } catch {}
  return session;
}

export function loadSession(): PractitionerSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function logout(): void {
  try { sessionStorage.removeItem(SESSION_KEY); } catch {}
}
