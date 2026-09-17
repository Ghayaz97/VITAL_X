'use client';

import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
  title?: React.ReactNode;
  subtitle?: string;
}

export default function Card({ children, className = '', headerRight, title, subtitle }: CardProps) {
  return (
    <div className={`bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-xl p-5 shadow-sm transition-clinical ${className}`}>
      {(title || headerRight) && (
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-[var(--border-subtle)]">
          <div>
            {typeof title === 'string' ? (
              <h3 className="text-sm font-semibold text-[var(--text-primary)] tracking-tight">{title}</h3>
            ) : (
              title
            )}
            {subtitle && <p className="text-xs text-[var(--text-secondary)] mt-0.5">{subtitle}</p>}
          </div>
          {headerRight && <div>{headerRight}</div>}
        </div>
      )}
      {children}
    </div>
  );
}
