"""
Base interfaces for VITAL-X Adapters.
All adapters must be cleanly separated from the clinical domain model.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, List, Optional


class ASRAdapter(ABC):
    @abstractmethod
    def transcribe(self, audio_data: bytes, language_code: str) -> Dict[str, Any]:
        """Transcribe speech audio to text and language metadata."""
        pass


class OCRAdapter(ABC):
    @abstractmethod
    def extract_text(self, document_bytes: bytes, filename: str) -> Dict[str, Any]:
        """Extract text and structure from medical documents/prescriptions."""
        pass


class ClinicalExtractionAdapter(ABC):
    @abstractmethod
    def extract_claims(self, text: str, source_type: str, source_id: str) -> List[Dict[str, Any]]:
        """Extract candidate clinical claims from raw text."""
        pass


class TerminologyAdapter(ABC):
    @abstractmethod
    def lookup_candidates(self, query: str) -> List[Dict[str, Any]]:
        """Map text or concept code to official AYUSH NAMASTE and ICD-11 codes."""
        pass


class FHIRAdapter(ABC):
    @abstractmethod
    def generate_bundle(self, session_data: Dict[str, Any], verified_claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Generate FHIR R4 Bundle from verified case state."""
        pass


class ABDMAdapter(ABC):
    @abstractmethod
    def transmit_bundle(self, fhir_bundle: Dict[str, Any], abha_id: str) -> Dict[str, Any]:
        """Transmit FHIR R4 Bundle to ABDM Gateway."""
        pass


class HISAdapter(ABC):
    @abstractmethod
    def push_case(self, summary: Dict[str, Any], fhir_bundle: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """Push verified clinical case into Hospital Information System (HIS)."""
        pass

