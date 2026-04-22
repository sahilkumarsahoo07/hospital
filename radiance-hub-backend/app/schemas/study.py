from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, date
import uuid


class PatientOut(BaseModel):
    id: str
    name: Optional[str] = None
    sex: Optional[str] = None
    birthDate: Optional[str] = None


class AssigneeOut(BaseModel):
    id: uuid.UUID
    fullName: str


class StudyOut(BaseModel):
    id: uuid.UUID
    studyInstanceUID: str
    accessionNumber: Optional[str] = None
    modality: str
    bodyPart: Optional[str] = None
    studyDate: str
    description: Optional[str] = None
    patient: PatientOut
    status: str
    assignee: Optional[AssigneeOut] = None
    referringHospital: Optional[str] = None
    referringCentre: Optional[str] = None
    pacsSourceName: Optional[str] = None
    reportVersion: Optional[int] = None
    updatedAt: datetime
    createdAt: datetime

    model_config = {"from_attributes": True}


class StudyListResponse(BaseModel):
    items: List[StudyOut]
    total: int
    page: int
    pageSize: int


class TransitionBody(BaseModel):
    to: str
    assigneeId: Optional[str] = None
    reason: Optional[str] = None


class AssignBody(BaseModel):
    assigneeId: str


class StudyUploadMeta(BaseModel):
    referringHospital: Optional[str] = None
    referringCentre: Optional[str] = None
    notes: Optional[str] = None
