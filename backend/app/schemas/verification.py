from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


VerificationDecision = Literal[
    "accept_claim",
    "reject_claim",
    "keep_both",
]


class VerificationIn(BaseModel):
    conflict_id: str = Field(min_length=1)
    decision: VerificationDecision
    practitioner_note: str | None = None


class VerificationOut(BaseModel):
    conflict_id: str
    decision: VerificationDecision
    practitioner_note: str | None
    status: str
