"""
Provenance Service — Tracks origin, language, mode, and evidence text for clinical claims.
"""

from datetime import datetime, timezone
from dataclasses import dataclass, asdict
from typing import Optional


@dataclass
class ProvenanceInfo:
    source_type: str        # patient_voice | document | clinical_assessment
    source_id: str          # e.g. SRC-VOICE-01 | DOC-PRESCRIPTION-2025
    language_code: str      # kn-IN | hi-IN | en-IN
    input_mode: str         # voice | touch | ocr_document
    evidence_text: str      # raw verbatim statement or extracted document snippet
    captured_at: str        # ISO-8601 timestamp


def create_provenance(
    source_type: str,
    source_id: str,
    language_code: str = "en-IN",
    input_mode: str = "touch",
    evidence_text: str = "",
    captured_at: Optional[str] = None
) -> dict:
    """
    Generate a structured provenance dictionary for a clinical claim.
    """
    if not captured_at:
        captured_at = datetime.now(timezone.utc).isoformat()
        
    prov = ProvenanceInfo(
        source_type=source_type,
        source_id=source_id,
        language_code=language_code,
        input_mode=input_mode,
        evidence_text=evidence_text,
        captured_at=captured_at
    )
    return asdict(prov)
