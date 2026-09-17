"""
Deterministic Prototype Adapters for SIH Demonstration.
Explicitly labeled as 'Prototype Adapter' — does not fabricate live external API connections.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timezone
import hashlib

from app.adapters.base import (
    ASRAdapter,
    OCRAdapter,
    ClinicalExtractionAdapter,
    TerminologyAdapter,
    FHIRAdapter,
    ABDMAdapter,
    HISAdapter,
)
from app.services.terminology import lookup_terminology_candidates


class MockASRAdapter(ASRAdapter):
    """Prototype ASR Adapter with deterministic fallback transcription."""
    adapter_name = "Prototype ASR Adapter (Local Deterministic)"

    def transcribe(self, audio_data: bytes, language_code: str) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "transcript": "I have joint pain and no history of diabetes.",
            "language_code": language_code,
            "confidence": 0.95,
        }


class MockOCRAdapter(OCRAdapter):
    """Prototype OCR Adapter for medical prescription ingestion."""
    adapter_name = "Prototype OCR Adapter (Local Prescription Document Engine)"

    def extract_text(self, document_bytes: bytes, filename: str) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "filename": filename or "DOC-PRESCRIPTION-2025.pdf",
            "extracted_text": "Rx: Metformin 500mg BD | Diagnosis: Type 2 Diabetes Mellitus (Active Record 2025)",
            "confidence": 0.98,
        }


class MockClinicalExtractionAdapter(ClinicalExtractionAdapter):
    """Prototype Clinical Extraction Adapter converting text into candidate claims."""
    adapter_name = "Prototype Clinical Extraction Adapter"

    def extract_claims(self, text: str, source_type: str, source_id: str) -> List[Dict[str, Any]]:
        text_lower = text.lower()
        claims = []

        if "joint pain" in text_lower or "sandhigata vata" in text_lower:
            claims.append({
                "category": "symptom",
                "concept_code": "symptom.joint_pain",
                "value": "Sandhigata Vata Present",
                "confidence": 0.95,
                "evidence_text": "Patient reported joint pain"
            })

        if "no history of diabetes" in text_lower or "no diabetes" in text_lower:
            claims.append({
                "category": "history",
                "concept_code": "condition.diabetes",
                "value": "No History of Diabetes",
                "confidence": 0.92,
                "evidence_text": "Patient denied history of diabetes"
            })

        if "metformin" in text_lower or "type 2 diabetes" in text_lower:
            claims.append({
                "category": "condition",
                "concept_code": "condition.diabetes",
                "value": "Type 2 Diabetes Active",
                "confidence": 0.98,
                "evidence_text": "Rx: Metformin 500mg BD | Active Record"
            })

        if "hypertension" in text_lower or "rakta chapa" in text_lower:
            claims.append({
                "category": "condition",
                "concept_code": "condition.hypertension",
                "value": "Rakta Chapa / Essential Hypertension",
                "confidence": 0.90,
                "evidence_text": text
            })

        return claims


class MockTerminologyAdapter(TerminologyAdapter):
    """Prototype Terminology Adapter mapping clinical concepts to official AYUSH NAMASTE and ICD-11."""
    adapter_name = "Prototype Terminology Adapter (NAMASTE + ICD-11 Reference)"

    def lookup_candidates(self, query: str) -> List[Dict[str, Any]]:
        return lookup_terminology_candidates(query)


class MockFHIRAdapter(FHIRAdapter):
    """Prototype FHIR Adapter generating standard R4 clinical artifact bundles."""
    adapter_name = "Prototype FHIR R4 Adapter (ABDM / AYUSH Interoperable)"

    def generate_bundle(self, session_data: Dict[str, Any], verified_claims: List[Dict[str, Any]]) -> Dict[str, Any]:
        session_id = session_data.get("session_id", "UNKNOWN")
        patient_id = session_data.get("patient_id", "UNKNOWN")
        language = session_data.get("language", "en-IN")

        bundle: Dict[str, Any] = {
            "resourceType": "Bundle",
            "type": "collection",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "meta": {
                "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifactBundle"],
                "interoperability": "ABDM / AYUSH Grid Compatible Boundary",
                "adapter": self.adapter_name
            },
            "entry": [
                {
                    "resource": {
                        "resourceType": "Patient",
                        "id": patient_id,
                        "language": language
                    }
                },
                {
                    "resource": {
                        "resourceType": "Encounter",
                        "id": session_id,
                        "status": "finished",
                        "subject": {"reference": f"Patient/{patient_id}"}
                    }
                }
            ]
        }

        for c in verified_claims:
            namaste_code = c.get("namaste_code") or "AYU-GEN"
            namaste_term = c.get("namaste_term") or c.get("value")
            icd11_code = c.get("icd11_code")

            codings = [
                {
                    "system": "http://namaste.ayush.gov.in",
                    "code": namaste_code,
                    "display": namaste_term
                }
            ]
            if icd11_code:
                codings.append({
                    "system": "http://id.who.int/icd/release/11/mms",
                    "code": icd11_code,
                    "display": c.get("icd11_term") or c.get("value")
                })

            bundle["entry"].append({
                "resource": {
                    "resourceType": "Observation",
                    "id": c.get("claim_id") or c.get("id"),
                    "status": "final",
                    "code": {
                        "text": c.get("concept_code"),
                        "coding": codings
                    },
                    "valueString": str(c.get("value")),
                    "note": [
                        {
                            "text": f"Source: {c.get('source_type')} | Verified Status: {c.get('verification_status')} | Evidence Ref: {c.get('evidence_id')}"
                        }
                    ]
                }
            })

        return bundle


class MockABDMAdapter(ABDMAdapter):
    """Prototype ABDM Gateway Adapter for FHIR bundle transmission."""
    adapter_name = "Prototype ABDM Gateway Adapter (Sandbox Sandbox Mode)"

    def transmit_bundle(self, fhir_bundle: Dict[str, Any], abha_id: str) -> Dict[str, Any]:
        bundle_id = fhir_bundle.get("id") or "BUNDLE-LOCAL-001"
        return {
            "adapter": self.adapter_name,
            "status": "TRANSMITTED_TO_SANDBOX",
            "abha_id": abha_id,
            "bundle_id": bundle_id,
            "ack_reference": f"ABDM-ACK-MOCK-001",
            "note": "Transmitted to ABDM Sandbox Gateway mock boundary."
        }


class MockHISAdapter(HISAdapter):
    """Prototype HIS Integration Adapter for hospital system ingestion."""
    adapter_name = "Prototype HIS Integration Adapter"

    def push_case(self, summary: Dict[str, Any], fhir_bundle: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        return {
            "adapter": self.adapter_name,
            "status": "INGESTED_IN_HIS",
            "his_encounter_id": f"HIS-ENC-2026-8812",
            "note": "Clinical case pushed to HIS mock endpoint."
        }

