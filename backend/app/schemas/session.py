from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class SessionCreate(BaseModel):
    language_code: str = Field(default="en-IN", min_length=2)

class SessionOut(BaseModel):
    session_id: UUID
    status: str
    language_code: str
    started_at: datetime
