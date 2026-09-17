from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime, timezone
import uuid
import json
import hashlib
from sqlalchemy.orm import Session

from app.db import (
    get_db,
    DBPatientRecord,
    DBSessionRecord,
    DBConsentRecord,
    DBClaimRecord,
    DBEvidenceRecord,
    DBDocumentRecord,
    DBRedFlagRecord,
    DBClaimRelationshipRecord,
    DBTerminologyCandidateRecord,
    DBPractitionerActionRecord,
    DBAuditEventRecord,
)
from app.services.truth_engine import evaluate_truth_state
from app.services.safety import evaluate_safety_rules
from app.services.interview import get_next_question, extract_clinical_claims
from app.services.ocr import process_document
from app.services.summary import generate_physician_summary
from app.services.languages import get_language_info
from app.services.provenance import create_provenance
from app.services.terminology import lookup_terminology_candidates
from app.adapters.mock import MockFHIRAdapter, MockABDMAdapter, MockHISAdapter
from app.fixtures.demo_fixtures import DEMO_SCENARIOS

router = APIRouter(prefix="/api/v1", tags=["VITAL-X Core"])


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _log_audit_event(
    db: Session,
    session_id: str,
    event_type: str,
    actor_type: str = "system",
    actor_id: str = "system",
    payload: Optional[Dict[str, Any]] = None,
) -> None:
    evt = DBAuditEventRecord(
        event_id=f"EVT-{str(uuid.uuid4())[:8]}",
        session_id=session_id,
        event_type=event_type,
        actor_type=actor_type,
        actor_id=actor_id,
        payload_json=json.dumps(payload or {}),
        created_at=_now_iso(),
    )
    db.add(evt)
    db.commit()


# ── Schemas ────────────────────────────────────────────────────────────────────

class SessionCreate(BaseModel):
    patient_id: str = Field(..., max_length=100)
    abha_id: Optional[str] = None
    language: str = Field(default="kn-IN", max_length=20)
    consent_given: bool = True


class ConsentSubmit(BaseModel):
    status: str = Field(default="GRANTED")  # GRANTED | DENIED | REVOKED
    method: str = Field(default="audio_visual_touch")


class InterviewAnswerSubmit(BaseModel):
    step_id: str
    answer_text: str = Field(..., max_length=2000)
    input_mode: str = Field(default="voice")  # voice | touch | text
    language_code: str = Field(default="kn-IN")


class ClaimSubmit(BaseModel):
    category: str = Field(default="clinical", max_length=50)
    concept_code: str = Field(..., max_length=100)
    value: str = Field(..., max_length=500)
    source_type: str = Field(default="patient_voice", max_length=50)
    source_id: str = Field(default="SRC-01", max_length=100)
    evidence_text: str = Field(default="", max_length=2000)
    language_code: str = Field(default="kn-IN", max_length=20)
    input_mode: str = Field(default="voice", max_length=50)
    confidence: float = Field(default=1.0, ge=0.0, le=1.0)


class VerificationAction(BaseModel):
    claim_id: str
    action: str  # accept_claim | reject_claim | keep_both | accept | reject
    practitioner_id: str = "DR-AYUSH"
    comment: Optional[str] = Field(default=None, max_length=1000)


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

def _claims_to_dicts(db: Session, session_id: str) -> List[Dict[str, Any]]:
    claims = db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).all()
    result = []
    for c in claims:
        terms = (
            db.query(DBTerminologyCandidateRecord)
            .filter(DBTerminologyCandidateRecord.claim_id == c.claim_id)
            .all()
        )
        candidates_list = [
            {
                "candidate_id": t.candidate_id,
                "namaste_code": t.namaste_code,
                "namaste_term": t.namaste_term,
                "icd11_code": t.icd11_code,
                "icd11_term": t.icd11_term,
                "status": t.status,
            }
            for t in terms
        ]
        primary_term = candidates_list[0] if candidates_list else {}

        result.append({
            "claim_id": c.claim_id,
            "id": c.claim_id,
            "session_id": c.session_id,
            "evidence_id": c.evidence_id,
            "category": c.category,
            "concept_code": c.concept_code,
            "value": c.value,
            "source_type": c.source_type,
            "source_id": c.source_id,
            "confidence": c.confidence,
            "evidence_text": c.evidence_text,
            "language_code": c.language_code or "kn-IN",
            "input_mode": c.input_mode or "touch",
            "captured_at": c.captured_at,
            "verified_at": c.verified_at,
            "claim_state": c.claim_state or "UNVERIFIED",
            "verification_status": c.verification_status,
            "practitioner_comment": c.practitioner_comment,
            "namaste_code": primary_term.get("namaste_code"),
            "namaste_term": primary_term.get("namaste_term"),
            "icd11_code": primary_term.get("icd11_code"),
            "icd11_term": primary_term.get("icd11_term"),
            "terminology_candidates": candidates_list,
            "provenance": {
                "source_type": c.source_type,
                "source_id": c.source_id,
                "language_code": c.language_code or "kn-IN",
                "input_mode": c.input_mode or "touch",
                "evidence_text": c.evidence_text,
                "captured_at": c.captured_at
            }
        })
    return result


def _persist_claim_and_evidence(
    db: Session,
    session_id: str,
    category: str,
    concept_code: str,
    value: str,
    source_type: str,
    source_id: str,
    evidence_text: str,
    language_code: str = "kn-IN",
    input_mode: str = "touch",
    confidence: float = 1.0,
) -> DBClaimRecord:
    content_hash = hashlib.sha256(evidence_text.encode("utf-8")).hexdigest()[:12]
    ev_id = f"EV-{str(uuid.uuid4())[:8]}"
    db_ev = DBEvidenceRecord(
        evidence_id=ev_id,
        session_id=session_id,
        source_type=source_type,
        source_id=source_id,
        modality="audio_transcript" if input_mode == "voice" else ("ocr_text" if input_mode == "ocr_document" else "touch_input"),
        raw_text=evidence_text,
        normalized_text=evidence_text.strip().lower(),
        content_hash=content_hash,
        captured_at=_now_iso()
    )
    db.add(db_ev)

    claim_id = f"CLM-{str(uuid.uuid4())[:8]}"
    db_claim = DBClaimRecord(
        claim_id=claim_id,
        session_id=session_id,
        evidence_id=ev_id,
        category=category,
        concept_code=concept_code,
        value=value,
        source_type=source_type,
        source_id=source_id,
        confidence=confidence,
        evidence_text=evidence_text,
        language_code=language_code,
        input_mode=input_mode,
        captured_at=_now_iso(),
        claim_state="UNVERIFIED",
        verification_status="PENDING_REVIEW"
    )
    db.add(db_claim)

    rel = DBClaimRelationshipRecord(
        relationship_id=f"REL-{str(uuid.uuid4())[:8]}",
        session_id=session_id,
        source_claim_id=claim_id,
        target_claim_id=None,
        evidence_id=ev_id,
        relationship_type="DERIVED_FROM",
        created_at=_now_iso()
    )
    db.add(rel)

    candidates = lookup_terminology_candidates(f"{concept_code} {value}")
    for cand in candidates:
        cand_record = DBTerminologyCandidateRecord(
            candidate_id=f"TC-{str(uuid.uuid4())[:8]}",
            claim_id=claim_id,
            namaste_code=cand.get("namaste_code"),
            namaste_term=cand.get("namaste_term"),
            icd11_code=cand.get("icd11_code"),
            icd11_term=cand.get("icd11_term"),
            status="CANDIDATE"
        )
        db.add(cand_record)

    db.commit()

    _log_audit_event(
        db,
        session_id,
        "CLAIM_CREATED",
        actor_type="patient" if source_type == "patient_voice" else "adapter",
        actor_id=source_id,
        payload={"claim_id": claim_id, "concept_code": concept_code, "value": value}
    )

    return db_claim


# ── Endpoints ──────────────────────────────────────────────────────────────────

@router.post("/sessions", status_code=201)
def create_session(payload: SessionCreate, db: Session = Depends(get_db)):
    session_id = f"SESS-{str(uuid.uuid4())[:8]}"
    
    # Persist or update patient record with ABHA ID
    patient_rec = db.query(DBPatientRecord).filter(DBPatientRecord.patient_id == payload.patient_id).first()
    if not patient_rec:
        patient_rec = DBPatientRecord(
            patient_id=payload.patient_id,
            abha_id=payload.abha_id or "91-042-4242-88",
            created_at=_now_iso()
        )
        db.add(patient_rec)
    elif payload.abha_id:
        patient_rec.abha_id = payload.abha_id

    db_session = DBSessionRecord(
        session_id=session_id,
        patient_id=payload.patient_id,
        language=payload.language,
        consent_given=payload.consent_given,
        routing_state="NORMAL",
        status="active",
        created_at=_now_iso()
    )
    db.add(db_session)

    # Persist explicit Consent Record
    consent_id = f"CNS-{str(uuid.uuid4())[:8]}"
    db_consent = DBConsentRecord(
        consent_id=consent_id,
        session_id=session_id,
        purpose="clinical_case_taking_and_verification",
        status="GRANTED" if payload.consent_given else "DENIED",
        version="1.0",
        method="audio_visual_touch",
        timestamp=_now_iso()
    )
    db.add(db_consent)
    db.commit()

    _log_audit_event(
        db, session_id, "SESSION_CREATED", actor_type="patient", actor_id=payload.patient_id
    )
    if payload.consent_given:
        _log_audit_event(
            db, session_id, "CONSENT_GRANTED", actor_type="patient", actor_id=payload.patient_id
        )

    return {
        "session_id": session_id,
        "status": "active",
        "patient_id": payload.patient_id,
        "language": payload.language,
        "consent_given": payload.consent_given,
        "routing_state": "NORMAL",
        "created_at": db_session.created_at
    }


@router.post("/sessions/{session_id}/consent")
def update_consent(session_id: str, payload: ConsentSubmit, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    session.consent_given = (payload.status == "GRANTED")
    consent_rec = db.query(DBConsentRecord).filter(DBConsentRecord.session_id == session_id).first()
    if consent_rec:
        consent_rec.status = payload.status
        consent_rec.timestamp = _now_iso()
    db.commit()

    _log_audit_event(
        db, session_id, f"CONSENT_{payload.status}", actor_type="patient", actor_id=session.patient_id
    )

    return {"status": "consent_updated", "session_id": session_id, "consent_given": session.consent_given}


@router.get("/sessions/{session_id}")
def get_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)
    ayush_data = json.loads(session.ayush_assessment) if session.ayush_assessment else None

    red_flags = (
        db.query(DBRedFlagRecord)
        .filter(DBRedFlagRecord.session_id == session_id)
        .all()
    )

    return {
        "session_id": session.session_id,
        "patient_id": session.patient_id,
        "language": session.language,
        "consent_given": session.consent_given,
        "routing_state": session.routing_state,
        "status": session.status,
        "created_at": session.created_at,
        "ayush_assessment": ayush_data,
        "claims": claims_list,
        "truth_state": truth_eval,
        "red_flags_count": len(red_flags)
    }


@router.get("/sessions/{session_id}/interview/next")
def get_interview_question(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    answered_events = (
        db.query(DBAuditEventRecord)
        .filter(DBAuditEventRecord.session_id == session_id, DBAuditEventRecord.event_type == "QUESTION_ANSWERED")
        .all()
    )
    answered_steps = []
    for evt in answered_events:
        data = json.loads(evt.payload_json) if evt.payload_json else {}
        if data.get("step_id"):
            answered_steps.append(data.get("step_id"))

    q = get_next_question(answered_steps)
    lang_info = get_language_info(session.language)

    return {
        "session_id": session_id,
        "language": session.language,
        "language_info": lang_info,
        "step": q
    }


@router.post("/sessions/{session_id}/interview/answer")
def submit_interview_answer(session_id: str, payload: InterviewAnswerSubmit, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    if not session.consent_given:
        raise HTTPException(status_code=409, detail={"error": "CONSENT_REQUIRED", "message": "Consent required before processing interview answers.", "request_id": str(uuid.uuid4())})

    extracted = extract_clinical_claims(payload.answer_text, payload.step_id)
    created_claims = []

    for c in extracted:
        db_claim = _persist_claim_and_evidence(
            db,
            session_id=session_id,
            category=c["category"],
            concept_code=c["concept_code"],
            value=c["value"] if isinstance(c["value"], str) else json.dumps(c["value"]),
            source_type="patient_voice" if payload.input_mode == "voice" else "patient_touch",
            source_id="SRC-INTERVIEW",
            evidence_text=payload.answer_text,
            language_code=payload.language_code,
            input_mode=payload.input_mode,
            confidence=c["confidence"]
        )
        created_claims.append(db_claim)

    _log_audit_event(
        db, session_id, "QUESTION_ANSWERED", actor_type="patient", actor_id=session.patient_id,
        payload={"step_id": payload.step_id, "answer_text": payload.answer_text, "input_mode": payload.input_mode}
    )

    claims_list = _claims_to_dicts(db, session_id)
    safety_signals = evaluate_safety_rules(claims_list)

    if safety_signals:
        session.routing_state = "URGENT"
        for sig in safety_signals:
            rf = DBRedFlagRecord(
                event_id=f"RF-{str(uuid.uuid4())[:8]}",
                session_id=session_id,
                rule_id=sig["rule_id"],
                severity=sig["severity"],
                trigger_evidence=sig["trigger_evidence"],
                message=sig["message"],
                timestamp=_now_iso()
            )
            db.add(rf)
            _log_audit_event(
                db, session_id, "RED_FLAG_RAISED", actor_type="system", actor_id="safety_engine",
                payload=sig
            )
        db.commit()

    truth_eval = evaluate_truth_state(claims_list)

    return {
        "status": "answer_recorded",
        "step_id": payload.step_id,
        "created_claims_count": len(created_claims),
        "safety_signals": safety_signals,
        "routing_state": session.routing_state,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/claims")
def add_claim(session_id: str, claim: ClaimSubmit, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    db_claim = _persist_claim_and_evidence(
        db,
        session_id=session_id,
        category=claim.category,
        concept_code=claim.concept_code,
        value=claim.value,
        source_type=claim.source_type,
        source_id=claim.source_id,
        evidence_text=claim.evidence_text,
        language_code=claim.language_code,
        input_mode=claim.input_mode,
        confidence=claim.confidence
    )

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)

    return {
        "status": "claim_recorded",
        "claim_id": db_claim.claim_id,
        "evidence_id": db_claim.evidence_id,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/documents/mock-upload")
def mock_upload_document(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    doc_bytes = b"Rx: Metformin 500mg BD"
    ocr_res = process_document(doc_bytes, "DOC-PRESCRIPTION-2025.pdf")

    doc_rec = DBDocumentRecord(
        document_id=f"DOC-{str(uuid.uuid4())[:8]}",
        session_id=session_id,
        document_type="prescription",
        content_hash=ocr_res["content_hash"],
        ocr_status="COMPLETED",
        captured_at=_now_iso()
    )
    db.add(doc_rec)
    db.commit()

    db_claim = _persist_claim_and_evidence(
        db,
        session_id=session_id,
        category="clinical",
        concept_code="condition.diabetes",
        value="Type 2 Diabetes Active",
        source_type="document",
        source_id="DOC-PRESCRIPTION-2025",
        evidence_text=ocr_res["extracted_text"],
        language_code="en-IN",
        input_mode="ocr_document",
        confidence=0.98
    )

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)

    if truth_eval.get("unresolved_conflicts", 0) > 0:
        session.routing_state = "CONFLICT"
        db.commit()

    _log_audit_event(
        db, session_id, "DOCUMENT_UPLOADED", actor_type="adapter", actor_id="Prototype OCR Adapter",
        payload={"document_id": doc_rec.document_id, "claim_id": db_claim.claim_id}
    )

    return {
        "status": "document_ingested",
        "document_id": doc_rec.document_id,
        "claim_id": db_claim.claim_id,
        "lab_safety_flags": ocr_res.get("lab_safety_flags", []),
        "truth_evaluation": truth_eval
    }


@router.get("/sessions/{session_id}/summary")
def get_session_summary(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)
    ayush_data = json.loads(session.ayush_assessment) if session.ayush_assessment else {}

    summary = generate_physician_summary(
        session_data={
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "language": session.language,
            "consent_given": session.consent_given
        },
        claims=claims_list,
        truth_state=truth_eval,
        ayush_data=ayush_data
    )
    return summary


@router.get("/sessions/{session_id}/red-flags")
def get_session_red_flags(session_id: str, db: Session = Depends(get_db)):
    flags = db.query(DBRedFlagRecord).filter(DBRedFlagRecord.session_id == session_id).all()
    return [
        {
            "event_id": f.event_id,
            "rule_id": f.rule_id,
            "severity": f.severity,
            "message": f.message,
            "trigger_evidence": f.trigger_evidence,
            "timestamp": f.timestamp
        }
        for f in flags
    ]


@router.get("/sessions/{session_id}/truth")
def get_session_truth(session_id: str, db: Session = Depends(get_db)):
    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)
    return truth_eval


@router.get("/sessions/{session_id}/evidence")
def get_session_evidence(session_id: str, db: Session = Depends(get_db)):
    ev_records = db.query(DBEvidenceRecord).filter(DBEvidenceRecord.session_id == session_id).all()
    return [
        {
            "evidence_id": e.evidence_id,
            "session_id": e.session_id,
            "source_type": e.source_type,
            "source_id": e.source_id,
            "modality": e.modality,
            "raw_text": e.raw_text,
            "normalized_text": e.normalized_text,
            "content_hash": e.content_hash,
            "captured_at": e.captured_at,
        }
        for e in ev_records
    ]


@router.get("/sessions/{session_id}/audit")
def get_session_audit(session_id: str, db: Session = Depends(get_db)):
    events = (
        db.query(DBAuditEventRecord)
        .filter(DBAuditEventRecord.session_id == session_id)
        .order_by(DBAuditEventRecord.created_at.asc())
        .all()
    )
    return [
        {
            "event_id": e.event_id,
            "session_id": e.session_id,
            "event_type": e.event_type,
            "actor_type": e.actor_type,
            "actor_id": e.actor_id,
            "payload": json.loads(e.payload_json) if e.payload_json else {},
            "created_at": e.created_at,
        }
        for e in events
    ]


@router.get("/sessions/{session_id}/conflicts")
def get_session_conflicts(session_id: str, db: Session = Depends(get_db)):
    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)
    return {
        "unresolved_conflicts": truth_eval.get("unresolved_conflicts", 0),
        "conflicts": truth_eval.get("conflicts", [])
    }


@router.post("/sessions/{session_id}/ayush")
def set_ayush_assessment(session_id: str, payload: AyushAssessmentIn, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    assessment_dict = payload.model_dump(exclude_none=True)
    session.ayush_assessment = json.dumps(assessment_dict)
    db.commit()

    _log_audit_event(
        db, session_id, "EVIDENCE_CAPTURED", actor_type="practitioner", actor_id="DR-AYUSH",
        payload={"type": "AyushAssessment", "fields_count": len(assessment_dict)}
    )

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
        claims_list = _claims_to_dicts(db, s.session_id)
        truth = evaluate_truth_state(claims_list)
        queue.append({
            "session_id": s.session_id,
            "patient_id": s.patient_id,
            "language": s.language,
            "routing_state": s.routing_state,
            "status": s.status,
            "created_at": s.created_at,
            "case_integrity": truth.get("case_integrity"),
            "truth_status": truth["status"],
            "export_blocked": truth["export_blocked"],
            "unresolved_conflicts": truth.get("unresolved_conflicts", 0)
        })
    return queue


@router.get("/doctor/cases/{session_id}")
def get_doctor_case(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)
    ayush_data = json.loads(session.ayush_assessment) if session.ayush_assessment else None

    return {
        "session": {
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "language": session.language,
            "consent_given": session.consent_given,
            "routing_state": session.routing_state,
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
        raise HTTPException(status_code=404, detail={"error": "CLAIM_NOT_FOUND", "message": "Claim not found", "request_id": str(uuid.uuid4())})

    act = action.action.lower()
    now = _now_iso()

    if act in ("accept", "accept_claim"):
        claim.verification_status = "PRACTITIONER_ACCEPT"
        claim.claim_state = "VERIFIED"
    elif act in ("reject", "reject_claim"):
        claim.verification_status = "PRACTITIONER_REJECT"
        claim.claim_state = "REJECTED"
    elif act in ("keep_both", "keepboth"):
        claim.verification_status = "PRACTITIONER_KEEP_BOTH"
        claim.claim_state = "VERIFIED"
    else:
        raise HTTPException(status_code=422, detail={"error": "INVALID_ACTION", "message": "Action must be accept_claim, reject_claim, or keep_both", "request_id": str(uuid.uuid4())})

    claim.verified_at = now
    claim.practitioner_comment = action.comment

    # Persist practitioner action record
    act_record = DBPractitionerActionRecord(
        action_id=f"ACT-{str(uuid.uuid4())[:8]}",
        session_id=session_id,
        claim_id=action.claim_id,
        practitioner_id=action.practitioner_id,
        action_type=claim.verification_status,
        comment=action.comment,
        created_at=now
    )
    db.add(act_record)
    db.commit()

    _log_audit_event(
        db,
        session_id,
        "PRACTITIONER_REVIEWED",
        actor_type="practitioner",
        actor_id=action.practitioner_id,
        payload={"claim_id": action.claim_id, "action": claim.verification_status, "comment": action.comment}
    )

    claims_list = _claims_to_dicts(db, session_id)
    truth_eval = evaluate_truth_state(claims_list)

    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if session and not truth_eval.get("export_blocked"):
        session.routing_state = "READY"
        db.commit()

    return {
        "status": "success",
        "claim_id": action.claim_id,
        "new_verification_status": claim.verification_status,
        "claim_state": claim.claim_state,
        "truth_evaluation": truth_eval
    }


@router.post("/sessions/{session_id}/reset")
def reset_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    db.query(DBClaimRecord).filter(DBClaimRecord.session_id == session_id).delete()
    db.query(DBEvidenceRecord).filter(DBEvidenceRecord.session_id == session_id).delete()
    db.query(DBDocumentRecord).filter(DBDocumentRecord.session_id == session_id).delete()
    db.query(DBRedFlagRecord).filter(DBRedFlagRecord.session_id == session_id).delete()
    db.query(DBClaimRelationshipRecord).filter(DBClaimRelationshipRecord.session_id == session_id).delete()
    db.query(DBPractitionerActionRecord).filter(DBPractitionerActionRecord.session_id == session_id).delete()
    db.query(DBAuditEventRecord).filter(DBAuditEventRecord.session_id == session_id).delete()
    
    session.ayush_assessment = None
    session.routing_state = "NORMAL"
    db.commit()

    _log_audit_event(db, session_id, "SESSION_RESET", actor_type="system", actor_id="reset_handler")

    return {"status": "session_reset", "session_id": session_id}


@router.get("/sessions/{session_id}/fhir")
def export_fhir(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})

    if not session.consent_given:
        _log_audit_event(db, session_id, "FHIR_EXPORT_BLOCKED", actor_type="system", payload={"reason": "Missing consent"})
        raise HTTPException(
            status_code=409,
            detail={
                "error": "EXPORT_BLOCKED",
                "reason": "Patient consent is required prior to FHIR export.",
                "request_id": str(uuid.uuid4())
            }
        )

    claims_list = _claims_to_dicts(db, session_id)
    truth = evaluate_truth_state(claims_list)

    if truth["export_blocked"]:
        _log_audit_event(
            db, session_id, "FHIR_EXPORT_BLOCKED", actor_type="system",
            payload={"unresolved_conflicts": truth.get("unresolved_conflicts")}
        )
        raise HTTPException(
            status_code=409,
            detail={
                "error": "EXPORT_BLOCKED",
                "reason": "Unresolved contradictions detected. Practitioner verification required prior to export.",
                "conflicts": truth.get("conflicts", []),
                "request_id": str(uuid.uuid4())
            }
        )

    # Active verified claims only for FHIR bundle
    verified_claims = [
        c for c in claims_list
        if c.get("claim_state") == "VERIFIED"
    ]

    adapter = MockFHIRAdapter()
    bundle = adapter.generate_bundle(
        session_data={
            "session_id": session.session_id,
            "patient_id": session.patient_id,
            "language": session.language,
        },
        verified_claims=verified_claims
    )

    _log_audit_event(
        db, session_id, "FHIR_EXPORT_GENERATED", actor_type="system",
        payload={"entries_count": len(bundle.get("entry", []))}
    )

    return bundle


@router.post("/sessions/{session_id}/abdm/transmit")
def transmit_abdm_bundle(session_id: str, db: Session = Depends(get_db)):
    session = db.query(DBSessionRecord).filter(DBSessionRecord.session_id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail={"error": "SESSION_NOT_FOUND", "message": "Session not found", "request_id": str(uuid.uuid4())})
    
    patient_rec = db.query(DBPatientRecord).filter(DBPatientRecord.patient_id == session.patient_id).first()
    abha_id = patient_rec.abha_id if (patient_rec and patient_rec.abha_id) else "91-042-4242-88"

    fhir_bundle = export_fhir(session_id, db)
    adapter = MockABDMAdapter()
    result = adapter.transmit_bundle(fhir_bundle, abha_id=abha_id)

    _log_audit_event(
        db, session_id, "ABDM_TRANSMITTED", actor_type="system",
        payload=result
    )

    return result




@router.post("/demo/load/{scenario_id}")
def load_demo_scenario(scenario_id: str, db: Session = Depends(get_db)):
    sc_key = scenario_id.upper()
    if sc_key not in DEMO_SCENARIOS:
        raise HTTPException(status_code=400, detail={"error": "INVALID_SCENARIO", "message": "Invalid scenario ID", "request_id": str(uuid.uuid4())})

    data = DEMO_SCENARIOS[sc_key]
    sess_id = f"SESS-DEMO-{sc_key}-{str(uuid.uuid4())[:4]}"

    existing_sess = db.query(DBSessionRecord).filter(DBSessionRecord.patient_id == data["patient_id"]).first()
    if existing_sess:
        sid_to_clear = existing_sess.session_id
        db.query(DBClaimRecord).filter(DBClaimRecord.session_id == sid_to_clear).delete()
        db.query(DBEvidenceRecord).filter(DBEvidenceRecord.session_id == sid_to_clear).delete()
        db.query(DBDocumentRecord).filter(DBDocumentRecord.session_id == sid_to_clear).delete()
        db.query(DBRedFlagRecord).filter(DBRedFlagRecord.session_id == sid_to_clear).delete()
        db.query(DBClaimRelationshipRecord).filter(DBClaimRelationshipRecord.session_id == sid_to_clear).delete()
        db.query(DBPractitionerActionRecord).filter(DBPractitionerActionRecord.session_id == sid_to_clear).delete()
        db.query(DBAuditEventRecord).filter(DBAuditEventRecord.session_id == sid_to_clear).delete()
        db.delete(existing_sess)
        db.commit()

    db_sess = DBSessionRecord(
        session_id=sess_id,
        patient_id=data["patient_id"],
        language=data["language"],
        consent_given=True,
        routing_state="NORMAL",
        status="active",
        created_at=_now_iso()
    )
    db.add(db_sess)
    db.commit()

    _log_audit_event(
        db, sess_id, "SESSION_CREATED", actor_type="system", actor_id="demo_loader",
        payload={"scenario": sc_key, "title": data["title"]}
    )

    for c in data["claims"]:
        _persist_claim_and_evidence(
            db,
            session_id=sess_id,
            category=c["category"],
            concept_code=c["concept_code"],
            value=c["value"],
            source_type=c["source_type"],
            source_id=c["source_id"],
            evidence_text=c["evidence_text"],
            language_code=c["language_code"],
            input_mode=c["input_mode"],
        )

    claims_list = _claims_to_dicts(db, sess_id)
    truth = evaluate_truth_state(claims_list)

    return {
        "status": "scenario_loaded",
        "scenario_id": sc_key,
        "title": data["title"],
        "session_id": sess_id,
        "patient_id": data["patient_id"],
        "claims_count": len(claims_list),
        "truth_state": truth
    }
