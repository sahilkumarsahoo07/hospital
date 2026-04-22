from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid


class UserBase(BaseModel):
    email: str
    full_name: str
    organization: Optional[str] = None


class UserRegister(UserBase):
    password: str
    roles: List[str] = []


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    fullName: str
    organization: Optional[str] = None
    roles: List[str]
    status: str
    certificatesStatus: Optional[str] = "none"
    createdAt: datetime

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_user(cls, u):
        return cls(
            id=u.id,
            email=u.email,
            fullName=u.full_name,
            organization=u.organization,
            roles=u.roles or [],
            status=u.status,
            certificatesStatus=u.certificates_status,
            createdAt=u.created_at,
        )


class RejectBody(BaseModel):
    reason: str


class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
