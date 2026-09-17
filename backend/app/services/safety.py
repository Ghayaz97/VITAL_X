"""
Deterministic Red-Flag Safety Engine.
Identifies high-priority emergency symptoms and emits safety signals.
Does NOT output autonomous medical diagnoses or prescriptions.
"""

from typing import List, Dict, Any


def evaluate_safety_rules(claims: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Evaluates claims against deterministic clinical safety rules.
    Returns safety event signals requiring immediate staff priority review.
    """
    signals = []
    concepts = {str(c.get("concept_code")).lower() for c in claims}
    texts = " ".join([str(c.get("evidence_text") or "").lower() for c in claims] + [str(c.get("value") or "").lower() for c in claims])

    # Rule 1: Chest pain (Acute Chest Pain Safety Signal)
    if ("symptom.chest_pain" in concepts or "chest pain" in texts or "chest" in texts or "hridshoola" in texts):
        signals.append({
            "rule_id": "RF-CHEST-PAIN-ACUTE",
            "severity": "URGENT",
            "status": "DETECTED",
            "message": "Urgent safety signal detected (Chest Pain). Priority clinical assessment required.",
            "trigger_evidence": "Patient reported chest pain during intake."
        })

    # Rule 2: Severe bleeding / Acute trauma
    if "severe bleeding" in texts or "uncontrolled hemorrhage" in texts:
        signals.append({
            "rule_id": "RF-ACUTE-BLEEDING",
            "severity": "URGENT",
            "status": "DETECTED",
            "message": "Potential urgent symptom detected (Severe Bleeding). Priority staff review required.",
            "trigger_evidence": "Patient reported severe bleeding."
        })

    return signals
