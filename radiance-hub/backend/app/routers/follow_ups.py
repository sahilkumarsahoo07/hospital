from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.follow_up import FollowUp

router = APIRouter(prefix="/studies/{study_id}/follow-up", tags=["follow-up"])

def serialize_followup(f: FollowUp):
    return {
        "id": str(f.id),
        "studyId": str(f.study_id),
        "creatorId": str(f.creator_id),
        "creatorName": f.creator.full_name if f.creator else "Unknown",
        "reason": f.reason,
        "dueDate": f.due_date.isoformat() if f.due_date else None,
        "isResolved": f.is_resolved,
        "resolutionNotes": f.resolution_notes,
        "createdAt": f.created_at.isoformat(),
        "resolvedAt": f.resolved_at.isoformat() if f.resolved_at else None,
    }

@router.get("")
def get_followups(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(FollowUp).filter(FollowUp.study_id == study_id).order_by(FollowUp.created_at.desc()).all()
    return [serialize_followup(f) for f in items]

@router.post("", status_code=201)
def create_followup(study_id: str, body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    due_date = None
    if body.get("dueDate"):
        try:
            due_date = datetime.fromisoformat(body["dueDate"])
        except ValueError:
            pass

    followup = FollowUp(
        study_id=study.id,
        creator_id=current_user.id,
        reason=body["reason"],
        due_date=due_date
    )
    db.add(followup)
    
    study.has_follow_up = True
    db.commit()
    db.refresh(followup)
    return serialize_followup(followup)

@router.put("/{followup_id}/resolve")
def resolve_followup(study_id: str, followup_id: str, body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    followup = db.query(FollowUp).filter(FollowUp.id == followup_id, FollowUp.study_id == study_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="FollowUp not found")

    followup.is_resolved = True
    followup.resolution_notes = body.get("resolutionNotes")
    followup.resolved_at = datetime.now(timezone.utc)
    
    # Check if this was the last unresolved follow-up
    unresolved_count = db.query(FollowUp).filter(FollowUp.study_id == study_id, FollowUp.is_resolved == False).count()
    if unresolved_count == 0:
        study = db.query(Study).filter(Study.id == study_id).first()
        if study:
            study.has_follow_up = False

    db.commit()
    db.refresh(followup)
    return serialize_followup(followup)
