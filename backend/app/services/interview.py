from dataclasses import dataclass
import re

@dataclass
class ExtractionResult:
    category: str
    concept_code: str
    value: dict
    confidence: float


def extract_candidate(text: str) -> ExtractionResult:
    """Deterministic v0.1 extractor for the vertical slice.

    This intentionally avoids pretending to be a production clinical NLP model.
    The provider adapter will replace/augment it after the end-to-end path works.
    """
    normalized = text.lower().strip()
    if "chest pain" in normalized:
        duration = None
        match = re.search(r"(\d+)\s*(day|days|week|weeks|month|months)", normalized)
        if match:
            duration = f"{match.group(1)} {match.group(2)}"
        return ExtractionResult(
            category="chief_complaint",
            concept_code="symptom.chest_pain",
            value={"text": "chest pain", "duration": duration},
            confidence=0.90,
        )
    if "fever" in normalized:
        return ExtractionResult(
            category="chief_complaint",
            concept_code="symptom.fever",
            value={"text": "fever"},
            confidence=0.90,
        )
    return ExtractionResult(
        category="patient_report",
        concept_code="unmapped.patient_report",
        value={"text": text},
        confidence=0.60,
    )
