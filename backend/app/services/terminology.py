"""
Terminology Service — Candidate lookup for AYUSH (NAMASTE) and ICD-11 / SNOMED concept codes.
Candidate concept matches are suggestions for practitioner confirmation, NOT automatic AI diagnoses.
"""

from typing import List, Dict, Any


# Standard NAMASTE & ICD Reference Candidate Knowledge Dictionary
TERMINOLOGY_DATABASE: Dict[str, Dict[str, Any]] = {
    "joint_pain": {
        "concept_code": "symptom.joint_pain",
        "namaste_code": "AYU-SYS-042",
        "namaste_term": "Sandhigata Vata (ಸಂಧಿಗತ ವಾತ / संधिगत वात)",
        "icd11_code": "FA26",
        "icd11_term": "Arthralgia",
        "category": "Musculoskeletal / Vata Vyadhi"
    },
    "chest_pain": {
        "concept_code": "symptom.chest_pain",
        "namaste_code": "AYU-SYS-019",
        "namaste_term": "Hridshoola (ಹೃಚ್ಛೂಲ / हृच्छूल)",
        "icd11_code": "MD81",
        "icd11_term": "Chest pain",
        "category": "Cardiovascular / Hridaya Roga"
    },
    "fever": {
        "concept_code": "symptom.fever",
        "namaste_code": "AYU-SYS-001",
        "namaste_term": "Jwara (ಜ್ವರ / ज्वर)",
        "icd11_code": "MG26",
        "icd11_term": "Pyrexia of unknown origin",
        "category": "General / Jwara Roga"
    },
    "diabetes": {
        "concept_code": "condition.diabetes",
        "namaste_code": "AYU-SYS-108",
        "namaste_term": "Madhumeha (ಮಧುಮೇಹ / मधुमेह)",
        "icd11_code": "5A11",
        "icd11_term": "Type 2 diabetes mellitus",
        "category": "Endocrine / Prameha"
    },
    "hypertension": {
        "concept_code": "condition.hypertension",
        "namaste_code": "AYU-SYS-112",
        "namaste_term": "Rakta Chapa (ರಕ್ತಚಾಪ / रक्तचाप)",
        "icd11_code": "BA00",
        "icd11_term": "Essential hypertension",
        "category": "Vascular / Rakta Dhatu"
    }
}


def lookup_terminology_candidates(text: str) -> List[Dict[str, Any]]:
    """
    Match clinical raw text against local reference terminology database
    and return candidate concept codes for practitioner confirmation.
    """
    normalized = text.lower().strip()
    candidates = []

    for key, item in TERMINOLOGY_DATABASE.items():
        if key in normalized or item["concept_code"] in normalized:
            candidates.append({
                "concept_code": item["concept_code"],
                "namaste_code": item["namaste_code"],
                "namaste_term": item["namaste_term"],
                "icd11_code": item["icd11_code"],
                "icd11_term": item["icd11_term"],
                "category": item["category"],
                "confidence": 0.95
            })

    if not candidates:
        candidates.append({
            "concept_code": "unmapped.general_finding",
            "namaste_code": "AYU-GEN-999",
            "namaste_term": "General Lakshan",
            "icd11_code": "MG99",
            "icd11_term": "Unspecified symptom",
            "category": "General",
            "confidence": 0.60
        })

    return candidates
