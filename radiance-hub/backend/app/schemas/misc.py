from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class CommentOut(BaseModel):
    id: uuid.UUID
    studyId: uuid.UUID
    parentId: Optional[uuid.UUID] = None
    authorId: uuid.UUID
    authorName: str
    authorRole: str
    body: str
    createdAt: datetime

    model_config = {"from_attributes": True}


class CommentBody(BaseModel):
    body: str
    parentId: Optional[str] = None


class LandingCmsOut(BaseModel):
    brand: dict
    hero: dict
    nav: list
    contact: dict
    footer: dict
    version: int
    updatedAt: datetime

    model_config = {"from_attributes": True}


class LandingCmsUpdate(BaseModel):
    brand: Optional[dict] = None
    hero: Optional[dict] = None
    nav: Optional[list] = None
    contact: Optional[dict] = None
    footer: Optional[dict] = None
