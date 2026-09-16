from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import json
from sqlalchemy.orm import Session

from app.db import get_db, DBSessionRecord, DBClaimRecord
from app.services.truth_engine import evaluate_truth_state
from app.services.provenance import create_provenance
from app.services.terminology import lookup_terminology_candidates

router = APIRouter(prefix="/api/v1", tags=["VITAL-X Core"])


# ── Request Schemas ────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    patient_id: str
    language: str = Field(default="en-IN")
    consent_given: bool = True


class ClaimSubmit(BaseModel):
    category: str = "clinical"
    concept_code: str
    value: str
    source_type: str = "patient_voice"      # patient_voice | document | clinical_assessment
    source_id: str = "SRC-01"
    evidence_text: str = ""
    language_code: str = "en-IN"
    input_mode: str = "voice"               # voice | touch | ocr_document
    confidence: float = 1.0


class VerificationAction(BaseModel):
    claim_id: str
    action: str                             # accept_claim | reject_claim | keep_both | accept | reject
    practitioner_id: str = "DR-AYUSH"
    comment: Optional[str] = None


class AyushAssessmentIn(BaseModel):
    prakriti: Optional[str] = None
    vikriti: Optional[str] = None
    sara: Optional[str] = None
    samhanana: Optional[str] = None
    pramana: Optional[str] = None
    satmya: Optional[str] = None
    sattva: Optional[str] = None
    ahara_shakti: Optional[str] = None
    vyayama_shakti: Optional[str] = None
    vaya: Optional[str] = None


# ── Helpers ────────────────────────────────────────────────────────────────────

def _claims_to_dicts(claims: List[DBClaimRecord]) -> List[Dict[str, Any]]:
    result = []
    for c in claims:
        # Determine candidate NAMASTE term
        candidates = lookup_terminology_candidates(f"{c.concept_code} {c.value}")
        namaste_info = candidates[0] if candidates else {}

        result.append({
            "claim_id": c.claim_id,
            "id": c.claim_id,
            "category": c.category,
            "concept_code": c.concept_code,
            "value": c.value,
            "source_type": c.source_type,
            "source_id": c.source_id,
            "confidence": c.confidence,
            "evidence_text": c.evidence_text,
            "language_code": c.language_code or "en-IN",
            "input_mode": c.input_mode or "touch",
            "captured_at": c.captured_at,
            "verification_status": c.verification_status,
            "practitioner_comment": c.practitioner_comment,
            "namaste_code": namaste_info.get("namaste_code"),
            "namaste_term": namaste_info.get("namaste_term"),
            "icd11_code": namaste_info.get("icd11_code"),
            "icd11_term": namaste_info.get("icd11_term"),
            "provenance": {
                "source_type": c.source_type,
                "source_id": c.source_id,
                "language_code": c.language_code or "en-IN",
                "input_mode": c.input_mode or "touch",
                "evidence_text": c.evidence_text,
                "captured_at": c.captured_at
            }
        })
    return result


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/sessions", status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session_id = str(uuid.uuid4())
    db_session = DBSessionRecord(
        session_id=session_id,
        patient_id=payload.patient_id,
        language=payload.language,
        consent_given=payload.consent_given,
        status="active"
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    return {
        "session_id": session_id,
        "status": "active",
        "patient_id": payload.patient_id,
        "language": payload.language,
        "consent_given": payload.consent_given
    }


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    claims_list = _claims_to_dicts(claims)
    truth_eval = evaluate_truth_state(claims_list)
    
    ayush_data = json.loads(session.ayush_assessment) if session.ayush_assessment else None

    return {
        "session_id": session.session_id,
        "patient_id": session.patient_id,
        "language": session.language,
        "consent_given": session.consent_given,
        "status": session.status,
        "created_at": session.created_at,
        "ayush_assessment": ayush_data,
        "claims": claims_list,
        "truth_state": truth_eval
    }


@router.post("/sessions/{session_id}/claims")
def add_claim(session_id: str, claim: ClaimSubmit, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claim_id = str(uuid.uuid4())
    prov = create_provenance(
        source_type=claim.source_type,
        source_id=claim.source_id,
        language_code=claim.language_code,
        input_mode=claim.input_mode,
        evidence_text=claim.evidence_text
    )

    db_claim = DBClaimRecord(
        claim_id=claim_id,
        session_id=session_id,
        category=claim.category,
        concept_code=claim.concept_code,
        value=claim.value,
        source_type=claim.source_type,
        source_id=claim.source_id,
        confidence=claim.confidence,
        evidence_text=claim.evidence_text,
        language_code=claim.language_code,
        input_mode=claim.input_mode,
        captured_at=prov["captured_at"],
        verification_status="PENDING_REVIEW"
    )
    db.add(db_claim)
    db.commit()

    all_claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    truth_eval = evaluate_truth_state(_claims_to_dicts(all_claims))

    return {
        "status": "claim_recorded",
        "claim_id": claim_id,
        "provenance": prov,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/documents/mock-upload")
def mock_upload_document(session_id: str, db: Session = Depends(get_db)):
    """
    Simulates OCR document ingestion of a previous prescription record.
    Generates a document claim ('condition.diabetes': 'Type 2 Diabetes Active')
    which triggers the golden-path contradiction against patient verbal statements.
    """
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claim_id = str(uuid.uuid4())
    prov = create_provenance(
        source_type="document",
        source_id="DOC-PRESCRIPTION-2025",
        language_code="en-IN",
        input_mode="ocr_document",
        evidence_text="Rx: Metformin 500mg BD | Diagnosis: Type 2 Diabetes Mellitus (Active Record 2025)"
    )

    db_claim = DBClaimRecord(
        claim_id=claim_id,
        session_id=session_id,
        category="clinical",
        concept_code="condition.diabetes",
        value="Type 2 Diabetes Active",
        source_type="document",
        source_id="DOC-PRESCRIPTION-2025",
        confidence=0.98,
        evidence_text=prov["evidence_text"],
        language_code="en-IN",
        input_mode="ocr_document",
        captured_at=prov["captured_at"],
        verification_status="PENDING_REVIEW"
    )
    db.add(db_claim)
    db.commit()

    all_claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    truth_eval = evaluate_truth_state(_claims_to_dicts(all_claims))

    return {
        "status": "document_ingested",
        "document_id": "DOC-PRESCRIPTION-2025",
        "claim_id": claim_id,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/ayush")
def set_ayush_assessment(session_id: str, payload: AyushAssessmentIn, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    assessment_dict = payload.model_dump(exclude_none=True)
    session.ayush_assessment = json.dumps(assessment_dict)
    db.commit()

    return {
        "status": "ayush_recorded",
        "session_id": session_id,
        "ayush_assessment": assessment_dict
    }


@router.get("/doctor/queue")
def get_doctor_queue(db: Session = Depends(get_db)):
    sessions = db.query(DBSessionRecord).all()
    queue = []
    for s in sessions:
        claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == s.session_id).all()
        truth = evaluate_truth_state(_claims_to_dicts(claims))
        queue.append({
            "session_id": s.session_id,
            "patient_id": s.patient_id,
            "language": s.language,
            "status": s.status,
            "created_at": s.created_at,
            "truth_status": truth["status"],
            "export_blocked": truth["export_blocked"],
            "unresolved_conflicts": truth.get("unresolved_conflicts", 0)
        })
    return queue


@router.get("/doctor/cases/{session_id}")
def get_doctor_case(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    claims_list = _claims_to_dicts(claims)
    truth_eval = evaluate_truth_state(claims_list)
    ayush_data = json.loads(session.ayush_assessment) if session.ayush_assessment else None

    return {
        "session": {
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "language": session.language,
            "consent_given": session.consent_given,
            "status": session.status,
            "created_at": session.created_at
        },
        "ayush_assessment": ayush_data,
        "claims": claims_list,
        "truth_state": truth_eval
    }


@router.post("/sessions/{session_id}/verify")
def verify_claim(session_id: str, action: VerificationAction, db: Session = Depends(get_db)):
    claim = (
        db.query(DBClaimRecord)
        .filter(
            DBClaimRecord.claim_id == action.claim_id,
            DBClaimRecord.session_id == session_id
        )
        .first()
    )
    if not claim:
        raise HTTPException(status_code=404, detail="Claim not found")

    act = action.action.lower()
    if act in ("accept", "accept_claim"):
        claim.verification_status = "PRACTITIONER_ACCEPT"
    elif act in ("reject", "reject_claim"):
        claim.verification_status = "PRACTITIONER_REJECT"
    elif act in ("keep_both", "keepboth"):
        claim.verification_status = "PRACTITIONER_KEEP_BOTH"
    else:
        raise HTTPException(status_code=422, detail="Action must be accept_claim, reject_claim, or keep_both")

    claim.practitioner_comment = action.comment
    db.commit()

    all_claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    truth_eval = evaluate_truth_state(_claims_to_dicts(all_claims))

    return {
        "status": "success",
        "claim_id": action.claim_id,
        "new_verification_status": claim.verification_status,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/reset")
def reset_session(session_id: str, db: Session = Depends(get_db)):
    """
    Resets session claims to allow clean demo restarts during judge evaluations.
    """
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).delete()
    session.ayush_assessment = None
    db.commit()

    return {"status": "session_reset", "session_id": session_id}


@router.get("/sessions/{session_id}/fhir")
def export_fhir(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    claims_list = _claims_to_dicts(claims)

    truth = evaluate_truth_state(claims_list)
    if truth["export_blocked"]:
        raise HTTPException(
            status_code=409,
            detail={
                "error": "EXPORT_BLOCKED",
                "reason": "Unresolved contradictions detected. Practitioner verification required prior to export.",
                "conflicts": truth.get("conflicts", [])
            }
        )

    bundle: dict = {
        "resourceType": "Bundle",
        "type": "collection",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "meta": {
            "profile": ["https://nrces.in/ndhm/fhir/r4/StructureDefinition/ClinicalArtifactBundle"],
            "interoperability": "ABDM / AYUSH Grid Compatible Boundary"
        },
        "entry": [
            {
                "resource": {
                    "resourceType": "Patient",
                    "id": session.patient_id,
                    "language": session.language
                }
            },
            {
                "resource": {
                    "resourceType": "Encounter",
                    "id": session.session_id,
                    "status": "finished",
                    "subject": {"reference": f"Patient/{session.patient_id}"}
                }
            }
        ]
    }

    for c in claims:
        candidates = lookup_terminology_candidates(f"{c.concept_code} {c.value}")
        namaste_term = candidates[0].get("namaste_term") if candidates else None

        bundle["entry"].append({
            "resource": {
                "resourceType": "Observation",
                "id": c.claim_id,
                "status": "final",
                "code": {
                    "text": c.concept_code,
                    "coding": [
                        {
                            "system": "http://namaste.ayush.gov.in",
                            "code": candidates[0].get("namaste_code") if candidates else "AYU-GEN",
                            "display": namaste_term
                        }
                    ]
                },
                "valueString": c.value,
                "note": [
                    {
                        "text": f"Provenance: {c.source_type} ({c.input_mode}) | Evidence: {c.evidence_text} | Status: {c.verification_status}"
                    }
                ]
            }
        })

    return bundle


@router.get("/health")
def health():
    return {"status": "ok", "service": "vital-x-api", "version": "0.3.0"}
