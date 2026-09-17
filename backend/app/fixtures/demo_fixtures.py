"""
Demo Fixtures for VITAL-X — Scenarios A through E.
All fixture data is explicitly loaded through explicit demo mechanisms.
"""

from typing import Dict, Any, List


DEMO_SCENARIOS: Dict[str, Dict[str, Any]] = {
    "A": {
        "scenario_id": "A",
        "title": "Scenario A — Clean Case",
        "description": "Patient reports joint pain. No document contradictions present. Immediately export-ready upon practitioner verification.",
        "patient_id": "PT-DEMO-A01",
        "language": "kn-IN",
        "claims": [
            {
                "category": "symptom",
                "concept_code": "symptom.joint_pain",
                "value": "Sandhigata Vata / Joint Pain (3 months)",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-A1",
                "evidence_text": "I have joint pain for 3 months.",
                "language_code": "kn-IN",
                "input_mode": "voice"
            }
        ]
    },
    "B": {
        "scenario_id": "B",
        "title": "Scenario B — Single Contradiction (Golden Path)",
        "description": "Patient verbal statement denies diabetes, but prescription document indicates active Metformin prescription.",
        "patient_id": "PT-SIH-042",
        "language": "kn-IN",
        "claims": [
            {
                "category": "symptom",
                "concept_code": "symptom.joint_pain",
                "value": "Sandhigata Vata / Joint Pain",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-01",
                "evidence_text": "I have joint pain and no history of diabetes.",
                "language_code": "kn-IN",
                "input_mode": "voice"
            },
            {
                "category": "history",
                "concept_code": "condition.diabetes",
                "value": "No History of Diabetes",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-01",
                "evidence_text": "I have joint pain and no history of diabetes.",
                "language_code": "kn-IN",
                "input_mode": "voice"
            },
            {
                "category": "condition",
                "concept_code": "condition.diabetes",
                "value": "Type 2 Diabetes Active",
                "source_type": "document",
                "source_id": "DOC-PRESCRIPTION-2025",
                "evidence_text": "Rx: Metformin 500mg BD | Diagnosis: Type 2 Diabetes Mellitus (Active Record 2025)",
                "language_code": "en-IN",
                "input_mode": "ocr_document"
            }
        ]
    },
    "C": {
        "scenario_id": "C",
        "title": "Scenario C — Multiple Contradictions",
        "description": "Contradictions across multiple domains: Diabetes and Hypertension conflicting patient vs EHR records.",
        "patient_id": "PT-DEMO-C03",
        "language": "hi-IN",
        "claims": [
            {
                "category": "history",
                "concept_code": "condition.diabetes",
                "value": "No History of Diabetes",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-C1",
                "evidence_text": "Mujhe koi meetha bimari nahi hai.",
                "language_code": "hi-IN",
                "input_mode": "voice"
            },
            {
                "category": "condition",
                "concept_code": "condition.diabetes",
                "value": "Type 2 Diabetes Active",
                "source_type": "document",
                "source_id": "DOC-EHR-2024",
                "evidence_text": "EHR Record 2024: HbA1c 8.2%",
                "language_code": "en-IN",
                "input_mode": "ocr_document"
            },
            {
                "category": "history",
                "concept_code": "condition.hypertension",
                "value": "Normal Blood Pressure",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-C1",
                "evidence_text": "BP Bilkul normal hai.",
                "language_code": "hi-IN",
                "input_mode": "voice"
            },
            {
                "category": "condition",
                "concept_code": "condition.hypertension",
                "value": "Rakta Chapa / Hypertension Stage 2",
                "source_type": "document",
                "source_id": "DOC-EHR-2024",
                "evidence_text": "EHR Record 2024: BP 150/95 mmHg | Amlodipine 5mg",
                "language_code": "en-IN",
                "input_mode": "ocr_document"
            }
        ]
    },
    "D": {
        "scenario_id": "D",
        "title": "Scenario D — Unknown Surgical History",
        "description": "Patient uncertainty regarding prior abdominal surgery — marked UNKNOWN, requiring explicit practitioner clarification.",
        "patient_id": "PT-DEMO-D04",
        "language": "en-IN",
        "claims": [
            {
                "category": "symptom",
                "concept_code": "symptom.chest_pain",
                "value": "Hridshoola / Chest discomfort",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-D1",
                "evidence_text": "I feel tightness in chest when walking.",
                "language_code": "en-IN",
                "input_mode": "voice"
            },
            {
                "category": "history",
                "concept_code": "history.surgical",
                "value": "Unknown / Patient Unsure of Past Abdominal Surgery",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-D1",
                "evidence_text": "I had some stomach procedure 10 years ago but don't remember details.",
                "language_code": "en-IN",
                "input_mode": "voice"
            }
        ]
    },
    "E": {
        "scenario_id": "E",
        "title": "Scenario E — Agreeing Sources",
        "description": "Both patient verbal statement and previous clinical document agree on Sandhigata Vata / Joint Pain diagnosis.",
        "patient_id": "PT-DEMO-E05",
        "language": "kn-IN",
        "claims": [
            {
                "category": "symptom",
                "concept_code": "symptom.joint_pain",
                "value": "Sandhigata Vata Present",
                "source_type": "patient_voice",
                "source_id": "SRC-VOICE-E1",
                "evidence_text": "Kalu novu ide (Joints hurt).",
                "language_code": "kn-IN",
                "input_mode": "voice"
            },
            {
                "category": "symptom",
                "concept_code": "symptom.joint_pain",
                "value": "Sandhigata Vata Present",
                "source_type": "document",
                "source_id": "DOC-AYUSH-CLINIC-2024",
                "evidence_text": "Prior Consultation Note: Sandhigata Vata diagnosed, Janu Basti recommended.",
                "language_code": "en-IN",
                "input_mode": "ocr_document"
            }
        ]
    }
}
