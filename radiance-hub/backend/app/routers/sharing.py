import secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta

from app.database import get_db
from app.auth import get_current_user, hash_password, verify_password
from app.models.study import Study
from app.models.study_share import StudyShare

router = APIRouter(tags=["sharing"])

def serialize_share(s: StudyShare):
    return {
        "id": str(s.id),
        "studyId": str(s.study_id),
        "creatorId": str(s.creator_id),
        "token": s.token,
        "hasPassword": bool(s.password_hash),
        "expiresAt": s.expires_at.isoformat() if s.expires_at else None,
        "maxUses": s.max_uses,
        "currentUses": s.current_uses,
        "isRevoked": s.is_revoked,
        "createdAt": s.created_at.isoformat(),
        # Generate the full link URL
        "url": f"http://localhost:8080/share/{s.token}"
    }

@router.get("/studies/{study_id}/shares")
def list_shares(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    shares = db.query(StudyShare).filter(StudyShare.study_id == study_id).order_by(StudyShare.created_at.desc()).all()
    return [serialize_share(s) for s in shares]

@router.post("/studies/{study_id}/shares", status_code=201)
def create_share(study_id: str, body: dict, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    token = secrets.token_urlsafe(16)
    
    expires_at = None
    if body.get("expiresInDays"):
        expires_at = datetime.now(timezone.utc) + timedelta(days=body["expiresInDays"])

    pwd_hash = hash_password(body["password"]) if body.get("password") else None

    share = StudyShare(
        study_id=study.id,
        creator_id=current_user.id,
        token=token,
        password_hash=pwd_hash,
        expires_at=expires_at,
        max_uses=body.get("maxUses")
    )
    db.add(share)
    db.commit()
    db.refresh(share)
    return serialize_share(share)

@router.delete("/studies/{study_id}/shares/{share_id}", status_code=204)
def revoke_share(study_id: str, share_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    share = db.query(StudyShare).filter(StudyShare.id == share_id, StudyShare.study_id == study_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share link not found")
    share.is_revoked = True
    db.commit()

# Public endpoint (no auth required)
@router.post("/share/{token}/access")
def access_share(token: str, body: dict = None, db: Session = Depends(get_db)):
    share = db.query(StudyShare).filter(StudyShare.token == token).first()
    if not share or share.is_revoked:
        raise HTTPException(status_code=404, detail="Link invalid or revoked")
    
    if share.expires_at and share.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=403, detail="Link has expired")
        
    if share.max_uses and share.current_uses >= share.max_uses:
        raise HTTPException(status_code=403, detail="Link usage limit reached")

    if share.password_hash:
        if not body or not body.get("password"):
            raise HTTPException(status_code=401, detail="Password required")
        if not verify_password(body["password"], share.password_hash):
            raise HTTPException(status_code=401, detail="Incorrect password")

    # Record usage
    share.current_uses += 1
    db.commit()
    
    study = db.query(Study).filter(Study.id == share.study_id).first()
    # Return minimal safe study info + viewer url
    return {
        "studyInstanceUID": study.study_instance_uid,
        "patientName": study.patient_name,
        "studyDate": str(study.study_date),
        "modality": study.modality,
        "viewerUrl": f"http://localhost:8042/ohif?study={study.id}",
    }
