"""
Adaptive History Interview Engine.
Clinical Interview State Machine:
Chief Complaint -> HPI -> Past Medical -> Past Surgical -> Medications -> Allergies -> Family History -> ROS -> AYUSH Dashavidha.
"""

from typing import Dict, Any, List
import re


INTERVIEW_STEPS = [
    {
        "step_id": "chief_complaint",
        "question_text": "What brings you here today? (ನಿಮಗೆ ಏನು ಸಮಸ್ಯೆ ಇದೆ?)",
        "audio_prompt_key": "prompt_chief_complaint",
        "options": ["Joint Pain (ಸಂಧಿ ನೋವು)", "Chest Pain (ಹೃಚ್ಛೂಲ)", "Fever (ಜ್ವರ)", "Other"]
    },
    {
        "step_id": "hpi_onset",
        "question_text": "When did the pain or problem start? (ಇದು ಯಾವಾಗ ಪ್ರಾರಂಭವಾಯಿತು?)",
        "audio_prompt_key": "prompt_hpi_onset",
        "options": ["Today (ಇಂದು)", "Few days (ಕೆಲವು ದಿನಗಳ ಹಿಂದೆ)", "Few weeks (ಕೆಲವು ವಾರಗಳ ಹಿಂದೆ)", "Long time (ಬಹಳ ಸಮಯದಿಂದ)"]
    },
    {
        "step_id": "past_medical",
        "question_text": "Do you have any known medical conditions like Diabetes or Hypertension?",
        "audio_prompt_key": "prompt_past_medical",
        "options": ["No History of Diabetes", "Diabetes Active", "Hypertension", "None"]
    },
    {
        "step_id": "past_surgical",
        "question_text": "Have you had any prior surgeries or abdominal procedures?",
        "audio_prompt_key": "prompt_past_surgical",
        "options": ["No Prior Surgeries", "Prior Abdominal Surgery", "Unknown / Patient Unsure"]
    },
    {
        "step_id": "medications",
        "question_text": "Are you currently taking any prescription medications?",
        "audio_prompt_key": "prompt_medications",
        "options": ["Taking Metformin", "Taking BP Meds", "No Daily Medications"]
    },
    {
        "step_id": "allergies",
        "question_text": "Do you have any known food or drug allergies?",
        "audio_prompt_key": "prompt_allergies",
        "options": ["No Known Allergies", "Drug Allergy", "Food Allergy"]
    },
    {
        "step_id": "ayush_dashavidha",
        "question_text": "AYUSH Assessment: Please confirm your primary Prakriti constitution.",
        "audio_prompt_key": "prompt_ayush",
        "options": ["Vata-Pitta", "Pitta-Kapha", "Vata-Kapha", "Tridosha"]
    }
]


def get_next_question(answered_steps: List[str]) -> Dict[str, Any]:
    for step in INTERVIEW_STEPS:
        if step["step_id"] not in answered_steps:
            return step
    return {
        "step_id": "complete",
        "question_text": "Intake interview complete.",
        "audio_prompt_key": "prompt_complete",
        "options": []
    }


def extract_clinical_claims(text: str, category: str = "patient_report") -> List[Dict[str, Any]]:
    text_lower = text.lower().strip()
    claims = []

    if "joint pain" in text_lower or "sandhigata" in text_lower or "knee" in text_lower:
        claims.append({
            "category": "symptom",
            "concept_code": "symptom.joint_pain",
            "value": "Sandhigata Vata / Joint Pain",
            "confidence": 0.95
        })

    if "no history of diabetes" in text_lower or "no diabetes" in text_lower:
        claims.append({
            "category": "history",
            "concept_code": "condition.diabetes",
            "value": "No Diabetes",
            "confidence": 0.92
        })

    if "chest pain" in text_lower or "hridshoola" in text_lower:
        claims.append({
            "category": "symptom",
            "concept_code": "symptom.chest_pain",
            "value": "Hridshoola / Chest Pain",
            "confidence": 0.95
        })

    if "breathing" in text_lower or "shortness of breath" in text_lower or "dyspnoea" in text_lower:
        claims.append({
            "category": "symptom",
            "concept_code": "symptom.dyspnoea",
            "value": "Difficulty Breathing / Dyspnoea",
            "confidence": 0.95
        })

    if not claims:
        claims.append({
            "category": category,
            "concept_code": f"reported.{category}",
            "value": text,
            "confidence": 0.70
        })

    return claims
