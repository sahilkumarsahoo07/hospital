from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.user import UserOut, RejectBody

router = APIRouter(prefix="/users", tags=["users"])

ADMIN_ROLES = ["super_admin", "sub_admin"]


@router.get("", response_model=list[UserOut])
def list_users(
    status: Optional[str] = None,
    role: Optional[str] = None,
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    q = db.query(User)
    if status:
        q = q.filter(User.status == status)
    if role:
        q = q.filter(User.roles.any(role))
    users = q.order_by(User.created_at.desc()).all()
    return [UserOut.from_orm_user(u) for u in users]


@router.post("/{user_id}/approve", response_model=UserOut)
def approve_user(
    user_id: str,
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "approved"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_user(user)


@router.post("/{user_id}/reject", response_model=UserOut)
def reject_user(
    user_id: str,
    body: RejectBody,
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "rejected"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_user(user)


@router.post("/{user_id}/suspend", response_model=UserOut)
def suspend_user(
    user_id: str,
    current_user: User = Depends(require_roles(*ADMIN_ROLES)),
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "suspended"
    user.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(user)
    return UserOut.from_orm_user(user)
