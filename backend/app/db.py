"""
Persistence layer — SQLite via SQLAlchemy (hackathon default).
Swap DATABASE_URL to postgresql+psycopg://... for production deployment.
"""

from sqlalchemy import create_engine, Column, String, Float, Boolean, Text
from sqlalchemy.orm import sessionmaker, declarative_base
from datetime import datetime, timezone
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./vitalx_v2.db")

_connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=_connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


class DBSessionRecord(Base):
    __tablename__ = "sessions"

    session_id = Column(String, primary_key=True, index=True)
    patient_id = Column(String, index=True)
    language = Column(String, default="en-IN")
    consent_given = Column(Boolean, default=False)
    status = Column(String, default="active")
    created_at = Column(String, default=_now_iso)
    ayush_assessment = Column(Text, nullable=True)  # JSON serialized Dashavidha assessment


class DBClaimRecord(Base):
    __tablename__ = "claims"

    claim_id = Column(String, primary_key=True, index=True)
    session_id = Column(String, index=True)
    category = Column(String)
    concept_code = Column(String, index=True)
    value = Column(Text)
    source_type = Column(String)          # patient_voice | document | clinical_assessment
    source_id = Column(String)
    confidence = Column(Float, default=1.0)
    evidence_text = Column(Text)
    language_code = Column(String, default="en-IN")
    input_mode = Column(String, default="touch")
    captured_at = Column(String, default=_now_iso)
    namaste_term = Column(String, nullable=True)
    verification_status = Column(String, default="PENDING_REVIEW")
    practitioner_comment = Column(Text, nullable=True)


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
