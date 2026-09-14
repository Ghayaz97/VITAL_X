from datetime import datetime, timezone
from uuid import uuid4
from fastapi import APIRouter, HTTPException
from app.schemas.session import SessionCreate, SessionOut
from app.schemas.clinical import ConsentIn, PatientIn, AnswerIn
from app.services.interview import extract_candidate
from app.services.safety import evaluate

router = APIRouter(prefix="/api/v1")

# In-memory adapter for the first vertical slice. PostgreSQL repository is the next integration step.
SESSIONS: dict[str, dict] = {}
CLAIMS: dict[str, list[dict]] = {}
CONSENTS: dict[str, list[dict]] = {}
PATIENTS: dict[str, dict] = {}
SAFETY: dict[str, list[dict]] = {}

@router.post("/sessions", response_model=SessionOut)
def create_session(payload: SessionCreate):
    sid = str(uuid4())
    now = datetime.now(timezone.utc)
    SESSIONS[sid] = {"status": "ACTIVE", "language_code": payload.language_code, "started_at": now}
    CLAIMS[sid] = []
    CONSENTS[sid] = []
    SAFETY[sid] = []
    return {"session_id": sid, **SESSIONS[sid]}

@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    return {"session_id": session_id, **SESSIONS[session_id]}

@router.post("/sessions/{session_id}/consents")
def set_consent(session_id: str, payload: ConsentIn):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    item = {"purpose": payload.purpose, "status": payload.status, "timestamp": datetime.now(timezone.utc)}
    CONSENTS[session_id].append(item)
    return item

@router.post("/sessions/{session_id}/patient")
def attach_patient(session_id: str, payload: PatientIn):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    pid = str(uuid4())
    PATIENTS[pid] = {"id": pid, **payload.model_dump()}
    SESSIONS[session_id]["patient_id"] = pid
    return PATIENTS[pid]

@router.post("/sessions/{session_id}/answers")
def answer(session_id: str, payload: AnswerIn):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    result = extract_candidate(payload.raw_text)
    claim = {
        "id": str(uuid4()),
        "category": result.category,
        "concept_code": result.concept_code,
        "value": result.value,
        "source_type": f"patient_{payload.input_mode}",
        "confidence": result.confidence,
        "verification_status": "UNVERIFIED",
    }
    CLAIMS[session_id].append(claim)
    SAFETY[session_id] = evaluate(CLAIMS[session_id])
    return {"claim": claim, "safety_events": SAFETY[session_id]}

@router.get("/sessions/{session_id}/state")
def state(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    return {"session_id": session_id, "claims": CLAIMS[session_id], "safety_events": SAFETY[session_id]}

@router.get("/doctor/queue")
def doctor_queue():
    return [{"session_id": sid, "status": data["status"], "priority": "HIGH" if SAFETY[sid] else "NORMAL"} for sid, data in SESSIONS.items()]

@router.get("/doctor/cases/{session_id}")
def doctor_case(session_id: str):
    if session_id not in SESSIONS:
        raise HTTPException(404, "Session not found")
    return {"session": {"session_id": session_id, **SESSIONS[session_id]}, "patient": PATIENTS.get(SESSIONS[session_id].get("patient_id")), "claims": CLAIMS[session_id], "safety_events": SAFETY[session_id]}
