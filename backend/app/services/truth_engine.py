"""
VITAL-X Truth Engine & Domain State Evaluator.

Separates:
1. CLAIM STATE: UNKNOWN | UNVERIFIED | SUPPORTED | REJECTED | VERIFIED
2. EVIDENCE RELATIONSHIP: SUPPORTS | CONTRADICTS | DERIVED_FROM | DUPLICATES | REQUIRES_VERIFICATION
3. CASE INTEGRITY: CLEAR | REVIEW_REQUIRED | CONFLICT | EXPORT_BLOCKED | VERIFIED

Invariants:
- Rejecting Claim A marks Claim A REJECTED and resolves conflict, but Claim B remains UNVERIFIED/SUPPORTED until practitioner explicitly accepts Claim B.
- AI-extracted claims NEVER autoverify.
- Contradictory evidence is NEVER deleted.
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


def evaluate_claim_state(claim: Dict[str, Any], relationships: List[Dict[str, Any]]) -> str:
    v_status = str(claim.get("verification_status") or "").upper()
    val = _normalise_value(claim.get("value"))

    if v_status in ("PRACTITIONER_REJECT", "REJECTED"):
        return "REJECTED"
    if v_status in ("PRACTITIONER_ACCEPT", "VERIFIED", "ACCEPTED"):
        return "VERIFIED"
    if v_status in ("PRACTITIONER_KEEP_BOTH", "KEEP_BOTH"):
        return "VERIFIED"
    if "unknown" in val or "not reported" in val or "unspecified" in val:
        return "UNKNOWN"

    claim_id = claim.get("claim_id") or claim.get("id")
    has_support = any(
        r["relationship_type"] == "SUPPORTS" and (r["source_claim_id"] == claim_id or r["target_claim_id"] == claim_id)
        for r in relationships
    )
    if has_support:
        return "SUPPORTED"

    return "UNVERIFIED"


def detect_evidence_relationships(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    relationships: List[Dict[str, Any]] = []

    for c in claims:
        claim_id = c.get("claim_id") or c.get("id")
        ev_id = c.get("evidence_id") or f"EV-{claim_id}"
        relationships.append({
            "relationship_id": f"REL-DERIVED-{claim_id}",
            "source_claim_id": claim_id,
            "target_claim_id": None,
            "evidence_id": ev_id,
            "relationship_type": "DERIVED_FROM",
            "concept_code": c.get("concept_code"),
            "description": f"Claim derived from source '{c.get('source_type')}'"
        })

    active_claims = [
        c for c in claims
        if str(c.get("verification_status") or "").upper() not in ("PRACTITIONER_REJECT", "REJECTED")
    ]

    grouped: Dict[str, List[Dict[str, Any]]] = defaultdict(list)
    for c in active_claims:
        concept = c.get("concept_code")
        if concept:
            grouped[concept].append(c)

    for concept_code, concept_claims in grouped.items():
        if len(concept_claims) < 2:
            continue

        for i, claim_a in enumerate(concept_claims):
            for claim_b in concept_claims[i + 1:]:
                id_a = claim_a.get("claim_id") or claim_a.get("id")
                id_b = claim_b.get("claim_id") or claim_b.get("id")
                val_a = _normalise_value(claim_a.get("value"))
                val_b = _normalise_value(claim_b.get("value"))

                status_a = str(claim_a.get("verification_status") or "").upper()
                status_b = str(claim_b.get("verification_status") or "").upper()
                
                # Resolved if at least one claim has practitioner review action executed
                is_resolved = (
                    status_a in ("PRACTITIONER_ACCEPT", "PRACTITIONER_REJECT", "PRACTITIONER_KEEP_BOTH", "VERIFIED") or
                    status_b in ("PRACTITIONER_ACCEPT", "PRACTITIONER_REJECT", "PRACTITIONER_KEEP_BOTH", "VERIFIED")
                )

                if val_a == val_b:
                    relationships.append({
                        "relationship_id": f"REL-SUPPORTS-{id_a}-{id_b}",
                        "source_claim_id": id_a,
                        "target_claim_id": id_b,
                        "evidence_id": claim_a.get("evidence_id"),
                        "relationship_type": "SUPPORTS",
                        "concept_code": concept_code,
                        "resolution_status": "RESOLVED",
                        "description": f"Claims from '{claim_a.get('source_type')}' and '{claim_b.get('source_type')}' agree."
                    })
                else:
                    relationships.append({
                        "relationship_id": f"REL-CONTRADICT-{id_a}-{id_b}",
                        "source_claim_id": id_a,
                        "target_claim_id": id_b,
                        "evidence_id": claim_a.get("evidence_id"),
                        "relationship_type": "CONTRADICTS",
                        "concept_code": concept_code,
                        "resolution_status": "RESOLVED_BY_PRACTITIONER" if is_resolved else "UNRESOLVED",
                        "severity": "REVIEW_REQUIRED",
                        "description": (
                            f"Contradiction detected for '{concept_code}'. "
                            f"Source '{claim_a.get('source_type')}' states '{claim_a.get('value')}' vs "
                            f"Source '{claim_b.get('source_type')}' states '{claim_b.get('value')}'."
                        ),
                        "evidence_pair": [
                            {
                                "claim_id": id_a,
                                "source_type": claim_a.get("source_type"),
                                "value": claim_a.get("value"),
                                "evidence_text": claim_a.get("evidence_text"),
                                "status": claim_a.get("verification_status")
                            },
                            {
                                "claim_id": id_b,
                                "source_type": claim_b.get("source_type"),
                                "value": claim_b.get("value"),
                                "evidence_text": claim_b.get("evidence_text"),
                                "status": claim_b.get("verification_status")
                            }
                        ]
                    })

    return relationships


def detect_conflicts(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    relationships = detect_evidence_relationships(claims)
    conflicts = []
    for r in relationships:
        if r["relationship_type"] == "CONTRADICTS":
            conflicts.append({
                "conflict_id": r["relationship_id"],
                "type": "CONTRADICTORY_CLAIMS",
                "concept_code": r["concept_code"],
                "severity": r.get("severity", "REVIEW_REQUIRED"),
                "claim_ids": [r["source_claim_id"], r["target_claim_id"]],
                "evidence": r.get("evidence_pair", []),
                "resolution_status": r["resolution_status"],
                "message": r["description"]
            })
    return conflicts


def evaluate_truth_state(claims: List[Dict[str, Any]]) -> Dict[str, Any]:
    relationships = detect_evidence_relationships(claims)
    
    for c in claims:
        st = evaluate_claim_state(c, relationships)
        c["claim_state"] = st

    unresolved_contradictions = [
        r for r in relationships
        if r["relationship_type"] == "CONTRADICTS" and r.get("resolution_status") == "UNRESOLVED"
    ]
    
    active_claims = [
        c for c in claims
        if str(c.get("verification_status") or "").upper() not in ("PRACTITIONER_REJECT", "REJECTED")
    ]
    unverified_claims = [c for c in active_claims if c.get("claim_state") == "UNVERIFIED"]

    if len(unresolved_contradictions) > 0:
        case_integrity = "CONFLICT"
        status = "CONFLICT"
        export_blocked = True
    elif len(unverified_claims) > 0:
        case_integrity = "REVIEW_REQUIRED"
        status = "REVIEW_REQUIRED"
        export_blocked = False
    else:
        case_integrity = "VERIFIED"
        status = "CLEAR"
        export_blocked = False

    return {
        "status": status,
        "case_integrity": case_integrity,
        "conflicts": detect_conflicts(claims),
        "relationships": relationships,
        "unresolved_conflicts": len(unresolved_contradictions),
        "export_blocked": export_blocked,
        "total_claims": len(claims),
        "verified_claims_count": sum(1 for c in claims if c.get("claim_state") == "VERIFIED"),
        "unverified_claims_count": len(unverified_claims)
    }
