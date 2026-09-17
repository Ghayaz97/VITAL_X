"""
Persistence layer — SQLite / PostgreSQL canonical schema.
Swap DATABASE_URL to postgresql+psycopg://... for production PostgreSQL deployment.
"""

from sqlalchemy import create_engine, Column, String, Float, Boolean, Text, Integer, ForeignKey
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime, timezone
import os
import tempfile

def _get_database_url() -> str:
    url = os.getenv("DATABASE_URL")
    if url:
        if url.startswith("postgres://"):
            return url.replace("postgres://", "postgresql+psycopg://", 1)
        if url.startswith("postgresql://") and "+psycopg" not in url:
            return url.replace("postgresql://", "postgresql+psycopg://", 1)
        return url
    if os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME"):
        tmp_db = os.path.join(tempfile.gettempdir(), "vitalx_v3.db")
        return f"sqlite:///{tmp_db}"
    return "sqlite:///./vitalx_v3.db"

DATABASE_URL = _get_database_url()

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DBPatientRecord(Base):
    __tablename__ = "patients"

    patient_id = Column(String, primary_key=True, index=True)
    abha_id = Column(String, nullable=True, index=True)
    name = Column(String, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    created_at = Column(String, default=_now_iso)


class DBSessionRecord(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    language = Column(String, default="kn-IN")
    consent_given = Column(Boolean, default=False)
    # NORMAL | URGENT | INCOMPLETE | CONFLICT | READY
    routing_state = Column(String, default="NORMAL")
    status = Column(String, default="active")
    created_at = Column(String, default=_now_iso)
    ayush_assessment = Column(Text, nullable=True)  # JSON serialized Dashavidha assessment


class DBConsentRecord(Base):
    __tablename__ = "consents"

    consent_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    purpose = Column(String, default="clinical_case_taking_and_verification")
    status = Column(String, default="GRANTED")  # GRANTED | DENIED | REVOKED
    version = Column(String, default="1.0")
    method = Column(String, default="audio_visual_touch")
    timestamp = Column(String, default=_now_iso)


class DBRedFlagRecord(Base):
    __tablename__ = "red_flags"

    event_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    rule_id = Column(String, index=True)
    severity = Column(String, default="URGENT")  # INFO | REVIEW | URGENT
    trigger_evidence = Column(Text)
    message = Column(Text)
    timestamp = Column(String, default=_now_iso)
    acknowledged_by = Column(String, nullable=True)
    acknowledged_at = Column(String, nullable=True)


class DBDocumentRecord(Base):
    __tablename__ = "documents"

    document_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    document_type = Column(String)  # prescription | lab_report | discharge_summary
    file_path = Column(String, nullable=True)
    content_hash = Column(String)
    ocr_status = Column(String, default="COMPLETED")
    captured_at = Column(String, default=_now_iso)


class DBEvidenceRecord(Base):
    __tablename__ = "evidence"

    evidence_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    source_type = Column(String)  # patient_voice | document | clinical_assessment
    source_id = Column(String)
    modality = Column(String)    # audio_transcript | ocr_text | touch_input | ayush_grid
    raw_text = Column(Text)
    normalized_text = Column(Text)
    content_hash = Column(String)
    captured_at = Column(String, default=_now_iso)


class DBClaimRecord(Base):
    __tablename__ = "claims"

    claim_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    evidence_id = Column(String, nullable=True, index=True)
    category = Column(String)
    concept_code = Column(String, index=True)
    value = Column(Text)
    source_type = Column(String)          # patient_voice | document | clinical_assessment
    source_id = Column(String)
    confidence = Column(Float, default=1.0)
    evidence_text = Column(Text)
    language_code = Column(String, default="kn-IN")
    input_mode = Column(String, default="touch")
    captured_at = Column(String, default=_now_iso)
    verified_at = Column(String, nullable=True)
    
    # Truth Engine domain state
    # UNKNOWN | UNVERIFIED | SUPPORTED | REJECTED | VERIFIED
    claim_state = Column(String, default="UNVERIFIED")
    
    verification_status = Column(String, default="PENDING_REVIEW")
    practitioner_comment = Column(Text, nullable=True)


class DBClaimRelationshipRecord(Base):
    __tablename__ = "claim_relationships"

    relationship_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    source_claim_id = Column(String, index=True)
    target_claim_id = Column(String, nullable=True, index=True)
    evidence_id = Column(String, nullable=True, index=True)
    # SUPPORTS | CONTRADICTS | DERIVED_FROM | DUPLICATES | REQUIRES_VERIFICATION
    relationship_type = Column(String)
    created_at = Column(String, default=_now_iso)


class DBTerminologyCandidateRecord(Base):
    __tablename__ = "terminology_candidates"

    candidate_id = Column(String, primary_key=True, index=True)
    claim_id = Column(String, index=True)
    namaste_code = Column(String, nullable=True)
    namaste_term = Column(String, nullable=True)
    icd11_code = Column(String, nullable=True)
    icd11_term = Column(String, nullable=True)
    # CANDIDATE | VERIFIED | REJECTED
    status = Column(String, default="CANDIDATE")
    created_at = Column(String, default=_now_iso)


class DBPractitionerActionRecord(Base):
    __tablename__ = "practitioner_actions"

    action_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    claim_id = Column(String, index=True)
    practitioner_id = Column(String, default="DR-AYUSH")
    action_type = Column(String)  # ACCEPT | REJECT | KEEP_BOTH
    comment = Column(Text, nullable=True)
    created_at = Column(String, default=_now_iso)


class DBAuditEventRecord(Base):
    __tablename__ = "audit_events"

    event_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    event_type = Column(String, index=True)
    actor_type = Column(String, default="system")  # patient | practitioner | system | adapter
    actor_id = Column(String, default="system")
    payload_json = Column(Text)
    created_at = Column(String, default=_now_iso)


def init_db() -> None:
    """Create all tables if they do not yet exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """FastAPI dependency — yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
