'use client';

import React from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

interface VerificationControlProps {
  claims: any[];
  verifyComment: string;
  setVerifyComment: (val: string) => void;
  onVerifyClaim: (claimId: string, action: string) => void;
}

// Human-readable source label
function sourceLabel(source: string): string {
  if (!source) return '🔍 System';
  const s = source.toLowerCase();
  if (s.includes('voice') || s.includes('touch') || s.includes('patient')) return '🗣️ What you said';
  if (s.includes('doc') || s.includes('scan') || s.includes('record')) return '📄 Previous record';
  return `🔍 ${source}`;
}

// Plain-language conflict reason for a pair of claims
function conflictReason(claim: any, allClaims: any[]): string | null {
  if (!allClaims || allClaims.length < 2) return null;
  const siblings = allClaims.filter(
    (c) => c.concept_code === claim.concept_code && c.claim_id !== claim.claim_id
  );
  if (siblings.length === 0) return null;
  const isFromDoc = (claim.source_type || '').toLowerCase().includes('doc');
  const isFromPatient = !isFromDoc;
  if (isFromDoc) {
    return 'Your previous medical record says something different from what you told us today. The doctor needs to decide which is correct.';
  }
  if (isFromPatient) {
    return 'This conflicts with information in your previous records. The doctor will decide what to include in your case.';
  }
  return 'There are two different pieces of information for this. The doctor must choose which one to keep.';
}

export default function VerificationControl({
  claims,
  verifyComment,
  setVerifyComment,
  onVerifyClaim,
}: VerificationControlProps) {
  return (
    <Card
      title="Clinical Verification"
      subtitle="Review each piece of information and decide what goes into the patient record."
    >
      <div className="space-y-2">
        {/* Comment field — compact */}
        <div>
          <label className="block text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
            Decision note (optional)
          </label>
          <input
            type="text"
            value={verifyComment}
            onChange={(e) => setVerifyComment(e.target.value)}
            placeholder="e.g. Prescription confirms active diabetes — patient unaware"
            className="w-full bg-[var(--bg-surface)] border border-[var(--border-medium)] rounded-lg px-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="space-y-2">
          {claims.map((claim) => {
            const reason = conflictReason(claim, claims);
            const src = sourceLabel(claim.source_type);
            const isVerified = claim.claim_state === 'VERIFIED';
            const isRejected = claim.claim_state === 'REJECTED';

            return (
              <div
                key={claim.claim_id}
                className={`rounded-xl border p-3 text-xs transition-clinical ${
                  isVerified
                    ? 'bg-emerald-950/10 border-emerald-800/30'
                    : isRejected
                    ? 'bg-red-950/10 border-red-800/20 opacity-60'
                    : 'bg-[var(--bg-surface-elevated)] border-[var(--border-subtle)]'
                }`}
              >
                {/* Top row: value + source + state */}
                <div className="flex items-start justify-between gap-3 mb-1.5">
                  <div className="space-y-0.5 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-primary)] leading-tight">{claim.value}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{src}</p>
                  </div>
                  <Badge
                    variant={
                      isVerified ? 'verified' : isRejected ? 'conflict' : 'review'
                    }
                  >
                    {isVerified ? 'Accepted' : isRejected ? 'Rejected' : 'Pending'}
                  </Badge>
                </div>

                {/* Why this conflicts — shown only if there's a sibling conflict */}
                {reason && !isVerified && !isRejected && (
                  <div className="mb-2 px-2.5 py-1.5 bg-amber-950/20 border border-amber-800/30 rounded-lg text-[11px] text-amber-300 leading-snug">
                    ⚠ {reason}
                  </div>
                )}

                {/* Verbatim toggle */}
                {claim.evidence_text && (
                  <details className="mb-2">
                    <summary className="cursor-pointer text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-clinical select-none">
                      View original words
                    </summary>
                    <p className="mt-1 text-[11px] text-[var(--text-secondary)] italic pl-2 border-l border-[var(--border-subtle)]">
                      "{claim.evidence_text}"
                    </p>
                  </details>
                )}

                {/* Practitioner comment */}
                {claim.practitioner_comment && (
                  <p className="mb-2 text-[11px] text-amber-400 font-mono-code">
                    Note: {claim.practitioner_comment}
                  </p>
                )}

                {/* Action buttons — only show if not yet decided */}
                {!isVerified && !isRejected && (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => onVerifyClaim(claim.claim_id, 'accept_claim')}
                    >
                      ✓ Accept
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onVerifyClaim(claim.claim_id, 'reject_claim')}
                    >
                      ✗ Reject
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => onVerifyClaim(claim.claim_id, 'keep_both')}
                    >
                      Keep both
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}


