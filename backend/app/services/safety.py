def evaluate(claims: list[dict]) -> list[dict]:
    """Small, explicit v0.1 safety rule set.

    This is escalation logic, not diagnosis. Clinical rules must be validated
    by a qualified clinical mentor before real deployment.
    """
    concepts = {c.get("concept_code") for c in claims}
    if "symptom.chest_pain" in concepts and "symptom.dyspnoea" in concepts:
        return [{
            "rule_id": "RF-CHEST-DYSPNOEA",
            "severity": "HIGH",
            "status": "DETECTED",
            "message": "Priority clinical review required."
        }]
    return []
