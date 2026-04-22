from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class ReportOut(BaseModel):
    id: uuid.UUID
    studyId: uuid.UUID
    status: str
    contentHtml: str
    contentText: str
    version: int
    authorId: uuid.UUID
    authorName: str
    createdAt: datetime
    updatedAt: datetime
    submittedAt: Optional[datetime] = None
    finalizedAt: Optional[datetime] = None

    model_config = {"from_attributes": True}


class ReportBundleOut(BaseModel):
    draft: Optional[ReportOut] = None
    latest: Optional[ReportOut] = None


class ReportSaveBody(BaseModel):
    contentHtml: str
    contentText: str
