from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.auth import get_current_user
from app.models.audit_log import AuditLog

router = APIRouter(prefix="/studies/{study_id}/timeline", tags=["audit"])

def serialize_audit_log(log: AuditLog):
    return {
        "id": str(log.id),
        "studyId": str(log.study_id) if log.study_id else None,
        "userId": str(log.user_id) if log.user_id else None,
        "userName": log.user.full_name if log.user else "System",
        "action": log.action,
        "details": log.details,
        "metadata": log.metadata_json,
        "ipAddress": log.ip_address,
        "createdAt": log.created_at.isoformat(),
    }

@router.get("")
def get_timeline(study_id: str, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    logs = db.query(AuditLog).filter(AuditLog.study_id == study_id).order_by(AuditLog.created_at.asc()).all()
    return [serialize_audit_log(log) for log in logs]
