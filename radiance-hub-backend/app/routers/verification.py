from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models.study import Study
from app.models.verification import VerificationRecord

router = APIRouter(prefix="/studies/{study_id}/verification", tags=["verification"])

def serialize_verification(v: VerificationRecord):
    return {
        "id": str(v.id),
        "studyId": str(v.study_id),
        "verifierId": str(v.verifier_id),
        "verifierName": v.verifier.full_name if v.verifier else "Unknown",
        "status": v.status,
        "notes": v.notes,
        "rejectionReason": v.rejection_reason,
        "correctionInstructions": v.correction_instructions,
        "createdAt": v.created_at.isoformat(),
    }

@router.get("")
def list_verifications(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    records = db.query(VerificationRecord).filter(VerificationRecord.study_id == study_id).order_by(VerificationRecord.created_at.desc()).all()
    return [serialize_verification(r) for r in records]

@router.post("/verify")
def verify_study(study_id: str, body: dict = None, current_user=Depends(require_roles("verifier", "super_admin")), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")
    
    if study.status != "verification_pending" and study.status != "report_finalized":
        raise HTTPException(status_code=400, detail="Study is not pending verification")

    record = VerificationRecord(
        study_id=study.id,
        verifier_id=current_user.id,
        status="verified",
        notes=body.get("notes") if body else None
    )
    db.add(record)
    
    study.status = "report_verified"
    study.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(record)
    return serialize_verification(record)

@router.post("/reject")
def reject_study(study_id: str, body: dict, current_user=Depends(require_roles("verifier", "super_admin")), db: Session = Depends(get_db)):
    study = db.query(Study).filter(Study.id == study_id).first()
    if not study:
        raise HTTPException(status_code=404, detail="Study not found")

    if study.status != "verification_pending" and study.status != "report_finalized":
        raise HTTPException(status_code=400, detail="Study is not pending verification")

    if not body.get("rejectionReason"):
        raise HTTPException(status_code=400, detail="Rejection reason is mandatory")

    record = VerificationRecord(
        study_id=study.id,
        verifier_id=current_user.id,
        status="rejected",
        notes=body.get("notes"),
        rejection_reason=body["rejectionReason"],
        correction_instructions=body.get("correctionInstructions")
    )
    db.add(record)
    
    study.status = "revert_to_radiologist"
    study.revert_count += 1
    study.updated_at = datetime.now(timezone.utc)
    
    db.commit()
    db.refresh(record)
    return serialize_verification(record)
