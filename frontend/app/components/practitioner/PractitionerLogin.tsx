'use client';
import React, { useState } from 'react';
import { demoLogin } from '../../lib/auth';
import type { PractitionerSession } from '../../lib/auth';

interface PractitionerLoginProps {
  onLogin: (session: PractitionerSession) => void;
}

export default function PractitionerLogin({ onLogin }: PractitionerLoginProps) {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('demo@vitalx.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleQuickDemo = () => {
    const session = demoLogin('demo@vitalx.local', 'demo1234');
    if (session) onLogin(session);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise(r => setTimeout(r, 400));
    const session = demoLogin(email, password);
    setLoading(false);
    if (session) {
      onLogin(session);
    } else {
      setError('Incorrect credentials. Try demo@vitalx.local / demo1234');
    }
  };

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 animate-fadeIn">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 mb-3">
            <span className="text-white text-sm font-extrabold">VX</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-[var(--text-primary)]">Practitioner Sign In</h1>
          <p className="text-sm text-[var(--text-secondary)]">Clinical Workstation · VITAL-X</p>
        </div>

        {/* Primary: Quick demo access */}
        <div className="space-y-3">
          <button
            type="button"
            onClick={handleQuickDemo}
            className="w-full py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-base transition-clinical shadow-lg shadow-emerald-950/30 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
          >
            ⚡ Quick Demo Access
          </button>

          <p className="text-center text-xs text-[var(--text-tertiary)]">
            Enters the demonstration workstation instantly.
          </p>

          {/* Divider */}
          <div className="flex items-center space-x-3 py-1">
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
            <span className="text-xs text-[var(--text-tertiary)]">or sign in with credentials</span>
            <div className="flex-1 h-px bg-[var(--border-subtle)]" />
          </div>

          {/* Toggle email/password form */}
          {!showForm ? (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full py-3 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface-elevated)] border border-[var(--border-subtle)] transition-clinical"
            >
              Sign in with email →
            </button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 animate-fadeIn">
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                  autoComplete="email"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-3 py-2.5 text-sm text-[var(--text-primary)] focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                  autoComplete="current-password"
                  placeholder="demo1234"
                />
              </div>

              {error && (
                <div className="bg-[var(--status-conflict-bg)] border border-[var(--status-conflict-border)] rounded-lg px-3 py-2 text-xs text-[var(--status-conflict-text)]">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold transition-colors disabled:opacity-60"
              >
                {loading ? 'Signing in…' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={() => { setShowForm(false); setError(''); }}
                className="w-full text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-clinical"
              >
                ← Back
              </button>
            </form>
          )}
        </div>

        <p className="text-center text-xs text-[var(--text-tertiary)]">
          VITAL-X Prototype · SIH 2026 · Not for clinical use
        </p>
      </div>
    </div>
  );
}
