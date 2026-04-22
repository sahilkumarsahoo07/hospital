from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.study_lock import StudyLock

router = APIRouter(prefix="/studies/{study_id}/lock", tags=["locks"])

LOCK_DURATION_MINUTES = 30

@router.post("")
def acquire_lock(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    existing_lock = db.query(StudyLock).filter(StudyLock.study_id == study_id).first()
    now = datetime.now(timezone.utc)

    if existing_lock:
        if existing_lock.expires_at > now and existing_lock.user_id != current_user.id:
            raise HTTPException(status_code=409, detail=f"Study is locked by another user ")
        
        # Extend lock or take over expired lock
        existing_lock.user_id = current_user.id
        existing_lock.locked_at = now
        existing_lock.expires_at = now + timedelta(minutes=LOCK_DURATION_MINUTES)
        db.commit()
        return {"status": "locked", "expiresAt": existing_lock.expires_at.isoformat()}

    lock = StudyLock(
        study_id=study.id,
        user_id=current_user.id,
        locked_at=now,
        expires_at=now + timedelta(minutes=LOCK_DURATION_MINUTES)
    )
    db.add(lock)
    db.commit()
    return {"status": "locked", "expiresAt": lock.expires_at.isoformat()}

@router.post("/unlock")
def release_lock(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    lock = db.query(StudyLock).filter(StudyLock.study_id == study_id).first()
    if lock and lock.user_id == current_user.id:
        db.delete(lock)
        db.commit()
    return {"status": "unlocked"}
