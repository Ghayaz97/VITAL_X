from uuid import UUID
from typing import Any, Literal
from pydantic import BaseModel, Field

class ConsentIn(BaseModel):
    purpose: str
    status: Literal["granted", "denied", "revoked"]

class PatientIn(BaseModel):
    name: str = Field(min_length=1)
    age: int | None = Field(default=None, ge=0, le=130)
    sex: str | None = None
    preferred_language: str = "en-IN"

class AnswerIn(BaseModel):
    question_id: str
    raw_text: str = Field(min_length=1)
    input_mode: Literal["voice", "touch"] = "touch"
    language_code: str = "en-IN"

class ClaimOut(BaseModel):
    id: UUID
    category: str
    concept_code: str | None
    value: Any
    source_type: str
    confidence: float | None
    verification_status: str
