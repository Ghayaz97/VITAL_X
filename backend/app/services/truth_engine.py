"""
Deterministic Truth Engine — Contradiction detection across clinical claim sources.

Rules:
1. Groups claims by concept_code.
2. Compares values across distinct source_types (e.g. patient_voice vs document).
3. If values differ, generates a CONFLICT record.
4. Evaluates verification status of each claim:
   - Claims marked 'PRACTITIONER_REJECT' or 'rejected' are ignored during contradiction checks.
   - Conflicts where a practitioner has executed a decision ('accept_claim', 'reject_claim', 'keep_both')
     are marked resolution_status = 'RESOLVED'.
5. Export is BLOCKED whenever unresolved_conflicts > 0.
"""

from collections import defaultdict
from typing import Any, List, Dict


def _normalise_value(value: Any) -> str:
    if isinstance(value, dict):
        text = value.get("text")
        if text is not None:
            return str(text).strip().lower()
        status = value.get("status")
        if status is not None:
            return str(status).strip().lower()
    return str(value).strip().lower()


def detect_conflicts(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Detect contradictory claims across different sources without silently deleting evidence.
    """
    # Active claims exclude rejected claims
    active_claims = [
        c for c in claims
        if str(c.get("verification_status") or "").upper() not in ("PRACTITIONER_REJECT", "REJECTED")
    ]

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for claim in active_claims:
        concept = claim.get("concept_code")
        if concept:
            grouped[concept].append(claim)

    conflicts: List[Dict[str, Any]] = []

    for concept_code, concept_claims in grouped.items():
        if len(concept_claims) < 2:
            continue

        for index, claim_a in enumerate(concept_claims):
            for claim_b in concept_claims[index + 1:]:
                val_a = _normalise_value(claim_a.get("value"))
                val_b = _normalise_value(claim_b.get("value"))

                if val_a == val_b:
                    continue

                status_a = str(claim_a.get("verification_status") or "").upper()
                status_b = str(claim_b.get("verification_status") or "").upper()

                # Check if conflict has been resolved by practitioner action
                is_resolved = (
                    "PRACTITIONER_ACCEPT" in (status_a, status_b) or
                    "ACCEPTED" in (status_a, status_b) or
                    "KEEP_BOTH" in (status_a, status_b)
                )

                conflict_id = f"CONFLICT-{concept_code.replace('.', '-')}"

                conflicts.append({
                    "conflict_id": conflict_id,
                    "type": "CONTRADICTORY_CLAIMS",
                    "concept_code": concept_code,
                    "severity": "REVIEW_REQUIRED",
                    "claim_ids": [
                        claim_a.get("claim_id") or claim_a.get("id"),
                        claim_b.get("claim_id") or claim_b.get("id")
                    ],
                    "evidence": [
                        {
                            "claim_id": claim_a.get("claim_id") or claim_a.get("id"),
                            "source_type": claim_a.get("source_type"),
                            "value": claim_a.get("value"),
                            "evidence_text": claim_a.get("evidence_text"),
                            "status": claim_a.get("verification_status")
                        },
                        {
                            "claim_id": claim_b.get("claim_id") or claim_b.get("id"),
                            "source_type": claim_b.get("source_type"),
                            "value": claim_b.get("value"),
                            "evidence_text": claim_b.get("evidence_text"),
                            "status": claim_b.get("verification_status")
                        }
                    ],
                    "resolution_status": "RESOLVED" if is_resolved else "UNRESOLVED",
                    "message": (
                        f"Contradictory evidence for '{concept_code}'. "
                        f"Patient voice vs Document disagreement."
                    )
                })

    return conflicts


def evaluate_truth_state(claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Evaluate truth state across all claims in a session.
    """
    conflicts = detect_conflicts(claims)
    unresolved = [c for c in conflicts if c["resolution_status"] == "UNRESOLVED"]

    return {
        "status": "CONFLICT" if unresolved else "CLEAR",
        "conflicts": conflicts,
        "unresolved_conflicts": len(unresolved),
        "export_blocked": len(unresolved) > 0
    }
