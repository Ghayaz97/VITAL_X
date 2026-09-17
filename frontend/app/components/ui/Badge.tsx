'use client';

import React from 'react';

export type BadgeVariant = 'verified' | 'conflict' | 'review' | 'neutral' | 'candidate' | 'synthetic' | 'blocked';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export default function Badge({ variant = 'neutral', children, className = '' }: BadgeProps) {
  const styles: Record<BadgeVariant, string> = {
    verified: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    conflict: 'bg-red-500/10 text-red-400 border-red-500/30',
    review: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700/60',
    candidate: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/30',
    synthetic: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    blocked: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-[11px] font-semibold tracking-wide uppercase border font-mono-code transition-clinical ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
