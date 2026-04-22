from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.study_note import StudyNote

router = APIRouter(prefix="/studies/{study_id}/notes", tags=["notes"])

def serialize_note(n: StudyNote):
    role = (n.author.roles or ["unknown"])[0] if n.author and n.author.roles else "unknown"
    return {
        "id": str(n.id),
        "studyId": str(n.study_id),
        "authorId": str(n.author_id),
        "authorName": n.author.full_name if n.author else "Unknown",
        "authorRole": role,
        "parentId": str(n.parent_id) if n.parent_id else None,
        "noteType": n.note_type,
        "content": n.content,
        "isPublic": n.is_public,
        "status": n.status,
        "createdAt": n.created_at.isoformat(),
        "updatedAt": n.updated_at.isoformat(),
    }

@router.get("")
def list_notes(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    notes = db.query(StudyNote).filter(StudyNote.study_id == study_id).order_by(StudyNote.created_at.asc()).all()
    # Roles filtering for private notes would go here
    return [serialize_note(n) for n in notes]

@router.post("", status_code=201)
def create_note(study_id: str, body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    note = StudyNote(
        study_id=study.id,
        author_id=current_user.id,
        parent_id=body.get("parentId"),
        note_type=body.get("noteType", "general"),
        content=body["content"],
        is_public=body.get("isPublic", True),
    )
    db.add(note)
    study.note_count += 1
    db.commit()
    db.refresh(note)
    return serialize_note(note)

@router.put("/{note_id}/resolve")
def resolve_note(study_id: str, note_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    note = db.query(StudyNote).filter(StudyNote.id == note_id, StudyNote.study_id == study_id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Note not found")
    note.status = "resolved"
    note.updated_at = datetime.now(timezone.utc)
    db.commit()
    return serialize_note(note)
