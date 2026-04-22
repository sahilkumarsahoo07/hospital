from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from datetime import datetime, timezone
import uuid
import os

from app.database import get_db
from app.auth import get_current_user
from app.models.study import Study
from app.models.study_attachment import StudyAttachment

router = APIRouter(prefix="/studies/{study_id}/attachments", tags=["attachments"])

UPLOAD_DIR = "uploads/attachments"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def serialize_attachment(a: StudyAttachment):
    return {
        "id": str(a.id),
        "studyId": str(a.study_id),
        "uploaderId": str(a.uploader_id),
        "uploaderName": a.uploader.full_name if a.uploader else "Unknown",
        "fileName": a.file_name,
        "fileType": a.file_type,
        "fileSizeBytes": a.file_size_bytes,
        "storageUrl": a.storage_url,
        "createdAt": a.created_at.isoformat(),
    }

@router.get("")
def list_attachments(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    attachments = db.query(StudyAttachment).filter(StudyAttachment.study_id == study_id).order_by(StudyAttachment.created_at.desc()).all()
    return [serialize_attachment(a) for a in attachments]

@router.post("", status_code=201)
async def upload_attachment(study_id: str, file: UploadFile = File(...), current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    file_ext = os.path.splitext(file.filename)[1]
    safe_filename = f"{uuid.uuid4()}{file_ext}"
    filepath = os.path.join(UPLOAD_DIR, safe_filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    attachment = StudyAttachment(
        study_id=study.id,
        uploader_id=current_user.id,
        file_name=file.filename,
        file_type=file.content_type or "application/octet-stream",
        file_size_bytes=len(content),
        storage_url=f"/api/studies/{study_id}/attachments/{safe_filename}/download"
    )
    db.add(attachment)
    study.attachment_count += 1
    db.commit()
    db.refresh(attachment)
    return serialize_attachment(attachment)

@router.delete("/{attachment_id}", status_code=204)
def delete_attachment(study_id: str, attachment_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    attachment = db.query(StudyAttachment).filter(StudyAttachment.id == attachment_id, StudyAttachment.study_id == study_id).first()
    if not attachment:
        raise HTTPException(status_code=404, detail="Attachment not found")
    
    # Optional check: only uploader or admin can delete
    db.delete(attachment)
    study = db.query(Study).filter(Study.id == study_id).first()
    if study:
        study.attachment_count = max(0, study.attachment_count - 1)
    db.commit()
